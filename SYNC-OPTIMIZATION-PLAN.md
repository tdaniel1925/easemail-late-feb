# Sync Optimization & Error Handling Plan

**Date:** 2026-02-28
**Status:** Analysis Complete, Ready for Implementation

---

## Current Performance Issues Found

### 🔴 CRITICAL: N+1 Query Problem (88K+ Extra Queries!)

**Location:** `lib/graph/message-delta-sync.ts:204-234`

**Problem:**
```typescript
// For EACH message, we do 2 separate folder lookups:
for (const message of messages) {
  // Query 1: Lookup by parentFolderId
  const { data: folder } = await supabase
    .from('account_folders')
    .select('id')
    .eq('account_id', this.accountId)
    .eq('graph_id', message.parentFolderId)
    .single();

  // Query 2: Fallback lookup by this.folderId
  if (!folderUuid && this.folderId) {
    const { data: folder } = await supabase
      .from('account_folders')
      .select('id')
      .eq('account_id', this.accountId)
      .eq('graph_id', this.folderId)
      .single();
  }
}
```

**Impact:**
- Account with 88,352 messages = **176,704+ database queries** just for folder lookups!
- Each query adds ~10-50ms latency
- Total overhead: **30-150 minutes** wasted on unnecessary queries

**Solution:** Pre-load folder map once
```typescript
// Load ALL folders ONCE at start of sync
const { data: folders } = await supabase
  .from('account_folders')
  .select('id, graph_id')
  .eq('account_id', this.accountId);

const folderMap = new Map(folders.map(f => [f.graph_id, f.id]));

// Then use in-memory lookup (instant!)
const folderUuid = folderMap.get(message.parentFolderId);
```

**Expected Speedup:** 10-50x faster (30-150 min → 3-15 min)

---

### 🔴 CRITICAL: Sequential Message Processing

**Location:** `lib/graph/message-delta-sync.ts:134-156`

**Problem:**
```typescript
// Processes messages ONE AT A TIME
for (const message of messages) {
  await this.upsertMessage(message); // Waits for each message
}
```

**Impact:**
- 999 messages per batch, processed sequentially
- Each upsert takes 50-100ms
- 999 × 50ms = **50 seconds per batch**
- For 88K messages: **1.2 hours** just waiting for database operations

**Solution:** Batch insert/update
```typescript
// Process messages in batches of 100
const BATCH_SIZE = 100;
for (let i = 0; i < messages.length; i += BATCH_SIZE) {
  const batch = messages.slice(i, i + BATCH_SIZE);

  // Prepare all inserts/updates
  const inserts = [];
  const updates = [];

  for (const msg of batch) {
    const messageData = this.prepareMessageData(msg);
    if (existsInDb) updates.push(messageData);
    else inserts.push(messageData);
  }

  // Bulk insert (100 at once!)
  if (inserts.length > 0) {
    await supabase.from('messages').insert(inserts);
  }

  // Bulk update (100 at once!)
  if (updates.length > 0) {
    await supabase.from('messages').upsert(updates);
  }
}
```

**Expected Speedup:** 20-50x faster (1.2 hours → 1-4 minutes)

---

### 🟡 MODERATE: No Database Indexing Verification

**Problem:**
- Don't know if proper indexes exist
- Missing indexes can make queries 100-1000x slower

**Check These Indexes:**
```sql
-- Critical for message upsert lookups
CREATE INDEX IF NOT EXISTS idx_messages_account_graph_id
ON messages(account_id, graph_id);

-- Critical for folder lookups
CREATE INDEX IF NOT EXISTS idx_account_folders_account_graph_id
ON account_folders(account_id, graph_id);

-- Critical for message queries by folder
CREATE INDEX IF NOT EXISTS idx_messages_folder_id
ON messages(folder_id);

-- Critical for sync state lookups
CREATE INDEX IF NOT EXISTS idx_sync_state_account_resource
ON sync_state(account_id, resource_type);
```

**Expected Speedup:** 10-100x for queries if missing

---

### 🟡 MODERATE: Inefficient Existence Checks

**Location:** `lib/graph/message-delta-sync.ts:204-209`

**Problem:**
```typescript
// Checks if each message exists individually
const { data: existing } = await supabase
  .from('messages')
  .select('id')
  .eq('account_id', this.accountId)
  .eq('graph_id', message.id)
  .single();
```

**Impact:**
- 88K messages = 88K separate existence checks
- Each check: 10-50ms
- Total: 15-75 minutes

**Solution:** Batch existence check
```typescript
// Get all existing message graph_ids in one query
const batchGraphIds = messages.map(m => m.id);
const { data: existingMessages } = await supabase
  .from('messages')
  .select('graph_id')
  .eq('account_id', this.accountId)
  .in('graph_id', batchGraphIds);

const existingSet = new Set(existingMessages.map(m => m.graph_id));

// Then check in-memory
const isNew = !existingSet.has(message.id);
```

**Expected Speedup:** 100-500x faster

---

## Sync Failure Handling Issues Found

### ❌ MISSING: No Retry Mechanism

**Problem:**
- Sync fails → status set to 'error'
- No automatic retry
- User must manually trigger re-sync
- Transient errors (network blip) require full re-sync

**Solution:** Exponential backoff retry
```typescript
async function syncWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await orchestrator.performFullSync();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
}
```

---

### ❌ MISSING: No Resume from Failure

**Problem:**
- Sync fails after syncing 50,000 messages
- Next sync starts from scratch
- Re-processes all 50,000 messages again
- Wastes time and resources

**Solution:** Checkpoint progress
```typescript
// Save checkpoint after each batch
await supabase.from('sync_state').upsert({
  account_id: accountId,
  resource_type: `messages:${folderId}`,
  last_checkpoint: {
    lastProcessedMessageId: messages[messages.length - 1].id,
    messagesProcessed: 5000,
    timestamp: new Date().toISOString()
  }
});

// Resume from checkpoint on retry
const checkpoint = syncState?.last_checkpoint;
if (checkpoint) {
  deltaUrl += `&$skiptoken=${checkpoint.lastProcessedMessageId}`;
}
```

---

### ❌ MISSING: No Rate Limit Handling

**Problem:**
- Microsoft Graph API has rate limits
- 429 errors not handled properly
- Sync fails instead of waiting and retrying

**Solution:** Rate limit backoff
```typescript
async function graphApiCall(url: string, retries = 3) {
  try {
    return await graphClient.api(url).get();
  } catch (error: any) {
    if (error.statusCode === 429) {
      const retryAfter = error.headers?.['retry-after'] || 60;
      console.log(`Rate limited. Waiting ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      if (retries > 0) return graphApiCall(url, retries - 1);
    }
    throw error;
  }
}
```

---

### ❌ MISSING: No Dead Letter Queue

**Problem:**
- Some messages consistently fail (malformed data, schema issues)
- Block entire folder sync
- No way to skip and process later

**Solution:** Dead letter queue
```typescript
// If message fails 3 times, move to DLQ
if (messageFailCount >= 3) {
  await supabase.from('failed_messages').insert({
    account_id: accountId,
    graph_id: message.id,
    error_message: error.message,
    message_data: message,
    retry_count: 3,
    created_at: new Date().toISOString()
  });

  console.log(`Moved message to DLQ: ${message.id}`);
  continue; // Skip and process other messages
}
```

---

### ❌ MISSING: No Sync Progress Tracking

**Problem:**
- User sees "syncing" status
- No idea if it's stuck or progressing
- No ETA or progress bar

**Solution:** Real-time progress updates
```typescript
// Update progress after each batch
await supabase.from('sync_state').update({
  progress: {
    foldersCompleted: 5,
    totalFolders: 20,
    messagesProcessed: 5000,
    estimatedTimeRemaining: '5 minutes',
    currentFolder: 'Inbox'
  }
}).eq('account_id', accountId);

// UI can poll and show progress bar
```

---

## Optimization Priorities

### 🚨 High Priority (Immediate - Major Impact)

1. **Fix N+1 Query Problem** ⏱️ 30-150 min savings
   - Pre-load folder map
   - Expected: 10-50x speedup

2. **Add Bulk Insert/Update** ⏱️ 60-120 min savings
   - Batch 100 messages at a time
   - Expected: 20-50x speedup

3. **Add Batch Existence Checks** ⏱️ 15-75 min savings
   - Check all message IDs in one query
   - Expected: 100-500x speedup

**Total Expected Improvement:**
- Current: 2-5 hours for 88K messages
- After fixes: **3-15 minutes** 🚀
- **Speedup: 10-50x faster!**

### 🟡 Medium Priority (Important - Reliability)

4. **Add Retry Mechanism**
   - Automatic retry with exponential backoff
   - Handle transient failures gracefully

5. **Add Rate Limit Handling**
   - Respect 429 responses from Graph API
   - Automatic backoff and retry

6. **Verify Database Indexes**
   - Create missing indexes
   - 10-100x query speedup

### 🟢 Low Priority (Nice to Have - UX)

7. **Add Resume from Failure**
   - Checkpoint after each batch
   - Resume where left off

8. **Add Progress Tracking**
   - Real-time progress updates
   - Show ETA to user

9. **Add Dead Letter Queue**
   - Handle persistently failing messages
   - Don't block entire sync

---

## Implementation Plan

### Phase 1: Critical Performance Fixes (Day 1)

**Files to modify:**
- `lib/graph/message-delta-sync.ts`

**Changes:**
1. Pre-load folder map (1 query instead of 176K)
2. Batch existence checks (1 query instead of 88K)
3. Bulk insert/update (100 at a time instead of 1)

**Testing:**
- Run sync on test account
- Measure before/after time
- Verify data integrity

**Expected result:** 10-50x speedup

---

### Phase 2: Reliability Improvements (Day 2)

**Files to modify:**
- `lib/graph/sync-orchestrator.ts`
- `app/api/sync/account/route.ts`

**Changes:**
1. Add retry mechanism with exponential backoff
2. Add rate limit handling (429 responses)
3. Update account status properly on failures

**Testing:**
- Simulate network failures
- Simulate rate limits
- Verify automatic retry

**Expected result:** 99% sync success rate

---

### Phase 3: Database Optimization (Day 2)

**Files to create:**
- `supabase/migrations/009_sync_optimization_indexes.sql`

**Changes:**
1. Add missing indexes
2. Verify existing indexes
3. Add performance monitoring

**Testing:**
- Run EXPLAIN ANALYZE on slow queries
- Verify index usage
- Measure query performance

**Expected result:** 10-100x query speedup

---

### Phase 4: UX Improvements (Day 3-4)

**Files to modify:**
- `lib/graph/message-delta-sync.ts`
- `lib/graph/sync-orchestrator.ts`
- UI components (progress bars)

**Changes:**
1. Add checkpoint/resume functionality
2. Add progress tracking
3. Add dead letter queue
4. Add sync dashboard

**Testing:**
- Test resume after failure
- Verify progress updates
- Test DLQ with bad data

**Expected result:** Better user experience

---

## Estimated Performance Improvements

### Current Performance (88K messages)
```
Folder lookup queries: 176,704 queries × 30ms = 88 minutes
Existence checks:       88,352 queries × 20ms = 29 minutes
Individual inserts:     88,352 inserts × 50ms = 74 minutes
Total:                  ~3 hours
```

### After Optimization
```
Folder lookup: 1 query × 50ms        = 0.05 seconds
Existence checks: ~90 queries × 20ms = 1.8 seconds
Bulk inserts: ~900 batches × 100ms   = 90 seconds
Total: ~2-3 minutes
```

**🚀 SPEEDUP: 60-90x FASTER!**

---

## Risk Assessment

### Low Risk (Safe to implement immediately)
- ✅ Pre-load folder map (read-only optimization)
- ✅ Batch existence checks (read-only optimization)
- ✅ Add database indexes (non-breaking)

### Medium Risk (Test thoroughly)
- ⚠️ Bulk insert/update (test data integrity)
- ⚠️ Retry mechanism (test idempotency)
- ⚠️ Rate limit handling (test API behavior)

### Higher Risk (Requires careful design)
- ⚠️ Resume from failure (complex state management)
- ⚠️ Dead letter queue (new infrastructure)

---

## Next Steps

1. **Implement Phase 1 optimizations** (N+1 query fix, bulk operations)
2. **Test with real account data**
3. **Measure performance improvement**
4. **Implement Phase 2** (retry, rate limits)
5. **Create migration 009** (indexes)
6. **Monitor production performance**
7. **Implement Phase 3-4** based on needs

---

## Questions to Answer

1. What's acceptable sync time for 100K messages?
   - Target: < 5 minutes

2. Should we parallelize folder syncs more?
   - Currently: 10 folders at a time
   - Could increase to 20-50 if Graph API allows

3. Should we implement incremental sync UI?
   - Show progress bar in real-time
   - Let user see which folder is syncing

4. Should we prioritize certain folders?
   - Sync Inbox first (most important)
   - Then Sent, Drafts, etc.
   - Then archive folders last

---

## Success Metrics

**Before Optimization:**
- Full sync time: 2-5 hours
- Database queries: 300K+
- Failure recovery: Manual re-sync
- User experience: "Is it stuck?"

**After Optimization:**
- Full sync time: 3-15 minutes ✅
- Database queries: < 1,000 ✅
- Failure recovery: Automatic retry ✅
- User experience: Progress bar with ETA ✅

**Target Achievement:**
- 🎯 90% reduction in sync time
- 🎯 99.5% reduction in database queries
- 🎯 99% sync success rate
- 🎯 Zero manual interventions needed
