# Duplicate Folders Fix - Edge Cases Analysis

## Overview
This document analyzes all possible edge cases for the duplicate folders fix and how they are handled.

## Edge Cases

### 1. New Duplicate Folder Created After Sync
**Scenario:** Microsoft Graph creates a new duplicate folder (e.g., "INBOX" appears after "Inbox" already exists)

**Handling:**
- ✅ `fixDuplicateFolders()` runs after EVERY folder sync
- ✅ Automatically detects new duplicate and marks it as secondary
- ✅ Existing primary folder remains primary (has more messages)

**Test:** Create a folder via Graph API with duplicate name, run sync

---

### 2. Primary Folder Gets Deleted from Graph API
**Scenario:** User deletes the primary "Inbox" folder in Outlook, but secondary "INBOX" still exists

**Handling:**
- ✅ Folder sync detects deletion and removes from database
- ✅ `fixDuplicateFolders()` runs after deletion
- ✅ Secondary folder automatically becomes primary (only one left)

**Test:** Delete primary folder from Graph, run sync, verify secondary becomes primary

---

### 3. Message Counts Change - Primary Should Switch
**Scenario:** Secondary folder suddenly has more messages than primary (user moved emails)

**Handling:**
- ✅ `fixDuplicateFolders()` recalculates based on CURRENT counts every sync
- ✅ Folder with most messages becomes primary
- ✅ Previous primary becomes secondary

**Code:**
```typescript
const sorted = [...typeFolders].sort((a, b) => {
  if (b.total_count !== a.total_count) {
    return b.total_count - a.total_count; // Most messages wins
  }
  if (b.unread_count !== a.unread_count) {
    return b.unread_count - a.unread_count; // Tie-breaker
  }
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Oldest wins
});
```

**Test:** Manually update message counts in database, run fixDuplicateFolders()

---

### 4. Both Folders Have Identical Counts
**Scenario:** Two inbox folders both have exactly 100 messages and 50 unread

**Handling:**
- ✅ Falls back to `unread_count` DESC
- ✅ If still tied, falls back to `created_at` ASC (oldest folder wins)
- ✅ Deterministic result - same folder always wins

**Test:** Create two folders with identical counts, verify consistent primary selection

---

### 5. All Folders Marked as Secondary (is_primary = false)
**Scenario:** Database corruption or manual error sets all inbox folders to is_primary=false

**Handling:**
- ⚠️ **POTENTIAL ISSUE**: `fixDuplicateFolders()` would fix this on next sync
- ⚠️ **RISK**: If sync fails, UI shows no inbox folders
- ✅ **MITIGATION**: Next folder sync automatically fixes it

**Recommendation:** Add database constraint or fix in API:
```sql
-- Future enhancement: Ensure at least one primary per type
CREATE OR REPLACE FUNCTION ensure_primary_folder()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting to false and it's the last primary, prevent it
  IF NEW.is_primary = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM account_folders
      WHERE account_id = NEW.account_id
        AND folder_type = NEW.folder_type
        AND is_primary = true
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot set is_primary to false - at least one primary folder required';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Test:** Manually set all inbox folders to is_primary=false, check UI behavior

---

### 6. Folder Type Has No Folders
**Scenario:** Account has no "Junk Email" folder at all

**Handling:**
- ✅ Not an issue - API simply returns no folders for that type
- ✅ UI handles missing folder types gracefully

**Test:** Delete all folders of a type, verify API returns empty array

---

### 7. Hidden Folder Marked as Primary
**Scenario:** Primary inbox folder has is_hidden=true

**Handling:**
- ✅ API filters: `.is('is_hidden', false)`
- ✅ Hidden primary folders are not returned to UI
- ⚠️ **POTENTIAL ISSUE**: If primary is hidden and secondary is not, user sees no inbox
- ✅ **MITIGATION**: Hidden folders should never be marked primary

**Recommendation:** Update `fixDuplicateFolders()` to skip hidden folders:
```typescript
const { data: folders } = await supabase
  .from('account_folders')
  .select('*')
  .eq('account_id', this.accountId)
  .is('is_hidden', false); // Only consider visible folders
```

**Test:** Set primary folder to is_hidden=true, verify behavior

---

### 8. Custom Folders with Duplicate Names
**Scenario:** User creates two custom folders both named "Clients"

**Handling:**
- ✅ Both marked as is_primary=true (custom folders all marked primary)
- ⚠️ **POTENTIAL ISSUE**: UI might show both folders with same name
- ✅ **ACCEPTABLE**: Custom folders can have duplicates (user-created)

**Current Code:**
```typescript
// For custom folders (no duplicates expected), mark all as primary
UPDATE account_folders
SET is_primary = true
WHERE folder_type = 'custom';
```

**Test:** Create two custom folders with same name, verify both appear

---

### 9. Migration 008 Not Applied
**Scenario:** `is_primary` column doesn't exist in database

**Handling:**
- ❌ **FAILURE**: Code will throw errors
- ❌ `fixDuplicateFolders()` will fail with "column does not exist"
- ❌ API query will fail

**Mitigation:**
- ✅ Migration should be verified during deployment
- ✅ Add migration check in instrumentation.ts or startup

**Recommendation:** Add startup check:
```typescript
// In instrumentation.ts or similar
async function verifySchema() {
  const { error } = await supabase
    .from('account_folders')
    .select('is_primary')
    .limit(1);

  if (error?.code === '42703') {
    console.error('CRITICAL: Migration 008 not applied! is_primary column missing.');
    process.exit(1);
  }
}
```

**Test:** Rollback migration 008, verify error handling

---

### 10. Concurrent Folder Syncs for Same Account
**Scenario:** Two folder sync processes run simultaneously for the same account

**Handling:**
- ⚠️ **RACE CONDITION**: Both might try to mark different folders as primary
- ⚠️ Last write wins - could cause flickering primary folder
- ✅ Eventually consistent - final state will be correct

**Recommendation:** Add locking mechanism:
```typescript
// Acquire lock before fixDuplicateFolders()
const { data: lock } = await supabase
  .from('sync_state')
  .select('sync_status')
  .eq('account_id', this.accountId)
  .eq('resource_type', 'folders')
  .single();

if (lock?.sync_status === 'syncing') {
  console.log('Folder sync already in progress, skipping duplicate fix');
  return;
}
```

**Test:** Run two folder syncs concurrently, check for race conditions

---

### 11. RLS Policy Blocks is_primary Update
**Scenario:** Row-Level Security prevents updating is_primary column

**Handling:**
- ✅ Using `createAdminClient()` which bypasses RLS
- ✅ Not an issue in current implementation

**Test:** Enable strict RLS, verify admin client can still update

---

### 12. Tenant Isolation Issues
**Scenario:** Folder from one tenant appears in another tenant's account

**Handling:**
- ✅ API filters by `tenant_id`
- ✅ Cross-tenant folders won't be returned
- ✅ `fixDuplicateFolders()` only processes folders for specific account

**Test:** Create folders in different tenants, verify isolation

---

### 13. Graph API Returns Previously Deleted Folder
**Scenario:** Folder was deleted locally but still exists in Graph API

**Handling:**
- ✅ Folder sync re-creates the folder in database
- ✅ `fixDuplicateFolders()` recalculates primary status
- ✅ System self-heals

**Test:** Delete folder from database, run sync, verify re-creation

---

### 14. fixDuplicateFolders() Fails Mid-Execution
**Scenario:** Database error or exception during duplicate folder fix

**Handling:**
- ⚠️ **PARTIAL STATE**: Some folders marked primary, others not
- ✅ **MITIGATION**: Function uses try-catch and logs errors
- ✅ **RECOVERY**: Next sync will retry and fix inconsistent state

**Current Code:**
```typescript
private async fixDuplicateFolders(): Promise<void> {
  try {
    // ... fix logic
  } catch (error: any) {
    console.error(`Failed to fix duplicate folders: ${error.message}`);
    // Don't throw - this is a cleanup operation, shouldn't fail the sync
  }
}
```

**Recommendation:** Add transaction support:
```typescript
// Use Supabase transaction to ensure atomicity
const { error } = await supabase.rpc('fix_duplicate_folders', {
  p_account_id: this.accountId
});
```

**Test:** Simulate database error mid-execution, verify recovery

---

### 15. Zero-Message Folders
**Scenario:** All inbox folders have 0 messages and 0 unread

**Handling:**
- ✅ Falls back to `created_at` ASC (oldest folder wins)
- ✅ Deterministic result
- ✅ Oldest folder becomes primary

**Test:** Create multiple empty folders, verify oldest is primary

---

### 16. Folder Created During Sync
**Scenario:** User creates a folder in Outlook while sync is running

**Handling:**
- ✅ Current sync might miss it (depends on timing)
- ✅ Next delta sync will pick it up
- ✅ Eventually consistent

**Test:** Create folder during sync, verify next sync picks it up

---

### 17. Well-Known Folder Name But Custom Type
**Scenario:** User creates custom folder named "Inbox" (separate from real inbox)

**Handling:**
- ✅ `getFolderType()` determines type by displayName
- ✅ Both would be marked as folder_type='inbox'
- ✅ `fixDuplicateFolders()` would mark one as primary

**Potential Issue:** User-created "Inbox" custom folder might become primary over real inbox

**Recommendation:** Use Graph API's `wellKnownName` property if available:
```typescript
function getFolderType(folder: GraphFolder): string {
  // Use well-known name if available (more reliable)
  if (folder.wellKnownName) {
    return folder.wellKnownName.toLowerCase();
  }

  // Fall back to display name matching
  const normalizedName = folder.displayName.toLowerCase();
  // ... existing logic
}
```

**Test:** Create custom folder named "Inbox", verify behavior

---

## Critical Edge Cases Requiring Action

### 🔴 HIGH PRIORITY

1. **Hidden Primary Folder** (Case #7)
   - Update `fixDuplicateFolders()` to only consider visible folders

2. **All Folders Marked Secondary** (Case #5)
   - Add API fallback: if no primary found, return first folder anyway

3. **Migration Check** (Case #9)
   - Add startup verification that migration 008 is applied

### 🟡 MEDIUM PRIORITY

4. **Concurrent Sync Race Condition** (Case #10)
   - Add sync locking mechanism

5. **Transaction Support** (Case #14)
   - Wrap `fixDuplicateFolders()` in database transaction

6. **Well-Known Name vs Display Name** (Case #17)
   - Use Graph API's `wellKnownName` property for reliable type detection

### 🟢 LOW PRIORITY (Already Handled)

- Cases #1, 2, 3, 4, 6, 8, 11, 12, 13, 15, 16

## Testing Matrix

| Edge Case | Status | Test Script | Result |
|-----------|--------|-------------|--------|
| New duplicate after sync | ✅ Handled | `test-edge-case-1.ts` | TBD |
| Primary deleted | ✅ Handled | `test-edge-case-2.ts` | TBD |
| Counts change | ✅ Handled | `test-edge-case-3.ts` | TBD |
| Identical counts | ✅ Handled | `test-edge-case-4.ts` | TBD |
| All secondary | ⚠️ Needs fix | `test-edge-case-5.ts` | TBD |
| No folders | ✅ Handled | `test-edge-case-6.ts` | TBD |
| Hidden primary | ⚠️ Needs fix | `test-edge-case-7.ts` | TBD |
| Custom duplicates | ✅ Acceptable | `test-edge-case-8.ts` | TBD |
| Migration missing | ⚠️ Needs check | `test-edge-case-9.ts` | TBD |
| Concurrent syncs | ⚠️ Needs lock | `test-edge-case-10.ts` | TBD |
| RLS blocks update | ✅ Handled | `test-edge-case-11.ts` | TBD |
| Tenant isolation | ✅ Handled | `test-edge-case-12.ts` | TBD |
| Deleted folder returns | ✅ Handled | `test-edge-case-13.ts` | TBD |
| Mid-execution failure | ⚠️ Needs txn | `test-edge-case-14.ts` | TBD |
| Zero messages | ✅ Handled | `test-edge-case-15.ts` | TBD |
| Created during sync | ✅ Handled | `test-edge-case-16.ts` | TBD |
| Custom "Inbox" folder | ⚠️ Needs fix | `test-edge-case-17.ts` | TBD |

## Next Steps

1. Create comprehensive edge case test suite
2. Fix high-priority edge cases (#5, #7, #9)
3. Consider medium-priority improvements (#10, #14, #17)
4. Run full test matrix and document results
