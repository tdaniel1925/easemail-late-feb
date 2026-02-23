# HANDOFF: Ready for Agent 4 - Email API

**Date:** 2026-02-22
**Status:** Checkpoint 3 Complete ✅
**Next Task:** Begin Agent 4: Email API (Steps 4.1-4.8)

---

## Current Project State

### Completed Work:
- ✅ **Phase 0:** Risk Mitigation POCs (Token refresh, Delta sync, Webhooks)
- ✅ **Agent 1:** Foundation (Scaffold, DB, Config, Clients, Stores, Jobs)
- ✅ **Agent 2:** Auth Engine (NextAuth, Tokens, Graph Client, Connect/Disconnect/Reauth)
- ✅ **Agent 3:** Sync Engine (Folders, Messages, Orchestrator, Webhooks, Attachments)
- ✅ **Checkpoint 3:** Manual verification complete

### Key Context:

**Database Schema:** `supabase/migrations/001_initial_schema.sql`
- All tables created and verified
- RLS policies enabled
- Foreign key relationships working

**Connected Account:**
- Email: `info@tonnerow.com`
- ID: `f817b168-8de0-462b-a676-9e9b8295e8d5`
- Status: `active` (reset from error state)
- 15 folders synced
- 2 messages synced (Drafts folder)
- Initial sync complete

**Environment:**
- Next.js 14 App Router
- Supabase (admin client working)
- Microsoft Graph API (tokens refreshing correctly)
- Inngest (background jobs configured)
- Dev server: `http://localhost:3000`

---

## Issues Fixed in Agent 3:

### 1. Token Storage Upsert Conflict ✅
**Problem:** `duplicate key value violates unique constraint "account_tokens_account_id_key"`

**Solution:** Added `{ onConflict: 'account_id' }` to upsert in `lib/graph/token-service.ts:33`

**Result:** Token refresh now works correctly

### 2. Schema Mismatches ✅
**Problem:** Code referenced wrong column names

**Fixes Applied:**
- `folders` → `account_folders` (table name)
- `ms_folder_id` → `graph_id`
- `body_preview` → `preview`
- `body_content` → `body_html`/`body_text`
- `from_email` → `from_address`
- `folder_id` expects UUID (not graph_id string)

### 3. Admin Client for Background Jobs ✅
**Pattern Established:** Always use `createAdminClient()` from `@/lib/supabase/admin` in:
- Sync services
- Background jobs
- API routes that perform admin operations
- Test scripts

**Reason:** Bypasses RLS for service-level operations

---

## Architecture Patterns Established

### 1. Sync Services Pattern
```typescript
export class SomeService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  async syncResource(): Promise<SyncResult> {
    const supabase = createAdminClient();
    // Fetch from Graph API
    // Transform data
    // Upsert to database
    // Update sync state
    return result;
  }
}
```

### 2. API Route Pattern
```typescript
// POST /api/resource/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { accountId, ...params } = body;

    // Validate account exists and is active
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, status')
      .eq('id', accountId)
      .single();

    if (!account || account.status !== 'active') {
      return NextResponse.json({ error: 'Invalid account' }, { status: 404 });
    }

    // Get Graph client
    const graphClient = await createGraphClient(accountId);

    // Perform operation
    const service = new SomeService(graphClient, accountId);
    const result = await service.doThing(params);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. Test Script Pattern
```typescript
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testThing() {
  // Find active account
  const { data: accounts } = await supabase
    .from('connected_accounts')
    .select('id, email')
    .eq('status', 'active')
    .limit(1);

  // Call API endpoint
  const response = await fetch('http://localhost:3000/api/thing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: accounts[0].id }),
  });

  // Verify results
  // ...
}

testThing();
```

---

## Agent 4: Email API - Task Breakdown

### Step 4.1: List Messages API
**Endpoint:** `GET /api/mail/messages?accountId=xxx&folderId=xxx&page=1&limit=50`

**Query Parameters:**
- `accountId` (required)
- `folderId` (optional - defaults to Inbox)
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `unreadOnly` (boolean)
- `flaggedOnly` (boolean)
- `hasAttachments` (boolean)
- `sortBy` (received_at, from, subject)
- `sortOrder` (asc, desc - default desc)

**Response:**
```json
{
  "messages": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5526,
    "pages": 111
  }
}
```

**Test:** `scripts/test-list-messages.ts`

---

### Step 4.2: Get Single Message API
**Endpoint:** `GET /api/mail/messages/[id]/route.ts`

**Returns:**
- Full message details
- Body (HTML + text)
- Attachments list
- Recipients (to, cc, bcc)
- Headers
- Thread information

**Test:** `scripts/test-get-message.ts`

---

### Step 4.3: Compose & Send API
**Endpoint:** `POST /api/mail/send`

**Body:**
```json
{
  "accountId": "uuid",
  "to": ["email@example.com"],
  "cc": ["email2@example.com"],
  "bcc": [],
  "subject": "Subject",
  "body": "<html>...</html>",
  "importance": "normal",
  "replyTo": "message-graph-id",
  "attachments": [
    {
      "name": "file.pdf",
      "contentType": "application/pdf",
      "contentBytes": "base64..."
    }
  ]
}
```

**Implementation:**
- Use Graph API `/me/sendMail` for direct send
- OR create in `/me/messages` then `/me/messages/{id}/send`
- Store sent message in database
- Handle reply/forward cases (set `inReplyTo` header)

**Test:** `scripts/test-send-message.ts`

---

### Step 4.4: Message Actions API
**Endpoints:**

1. **PATCH** `/api/mail/messages/[id]` - Update message flags
   ```json
   {
     "isRead": true,
     "isFlagged": false
   }
   ```

2. **POST** `/api/mail/messages/[id]/move` - Move to folder
   ```json
   {
     "targetFolderId": "uuid"
   }
   ```

3. **DELETE** `/api/mail/messages/[id]` - Delete message

**Graph API Mappings:**
- Mark read: `PATCH /me/messages/{id}` with `{ isRead: true }`
- Flag: `PATCH /me/messages/{id}` with `{ flag: { flagStatus: "flagged" } }`
- Move: `POST /me/messages/{id}/move` with `{ destinationId: "graph-folder-id" }`
- Delete: `DELETE /me/messages/{id}` (soft delete to Deleted Items)

**Test:** `scripts/test-message-actions.ts`

---

### Step 4.5: Folder Management API
**Endpoints:**

1. **POST** `/api/mail/folders` - Create folder
   ```json
   {
     "accountId": "uuid",
     "displayName": "My Folder",
     "parentFolderId": "uuid"
   }
   ```

2. **PATCH** `/api/mail/folders/[id]` - Rename folder
   ```json
   {
     "displayName": "New Name"
   }
   ```

3. **DELETE** `/api/mail/folders/[id]` - Delete folder

**Graph API Mappings:**
- Create: `POST /me/mailFolders` or `/me/mailFolders/{parentId}/childFolders`
- Rename: `PATCH /me/mailFolders/{id}`
- Delete: `DELETE /me/mailFolders/{id}`

**Important:** Update local database after Graph API operations

**Test:** `scripts/test-folders.ts`

---

### Step 4.6: Search API
**Endpoint:** `GET /api/mail/search?q=keyword&accountId=xxx`

**Query Parameters:**
- `q` (search query)
- `accountId`
- `folderId` (optional - search within folder)
- `from` (filter by sender)
- `hasAttachments` (boolean)
- `startDate`, `endDate` (date range)
- `page`, `limit`

**Implementation Options:**

**Option A:** Database full-text search (PostgreSQL)
```sql
SELECT * FROM messages
WHERE to_tsvector('english', subject || ' ' || preview || ' ' || body_text)
@@ plainto_tsquery('english', 'keyword')
```

**Option B:** Graph API search
```
GET /me/messages?$search="keyword"
```

**Recommendation:** Start with database search, add Graph API search later for unified inbox

**Test:** `scripts/test-search.ts`

---

### Step 4.7: Contacts API
**Endpoint:** `GET /api/contacts?accountId=xxx&q=search`

**Query Parameters:**
- `accountId`
- `q` (search query)
- `limit` (default: 20)

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "displayName": "John Doe",
      "emailAddress": "john@example.com",
      "lastInteractionAt": "2026-02-22T10:00:00Z",
      "messageCount": 42
    }
  ]
}
```

**Implementation:**
- Query `messages` table for distinct email addresses
- Join with `contacts` table if exists
- Aggregate interaction counts
- Sort by relevance (last interaction + frequency)

**Future Enhancement:** Sync contacts from Graph API `/me/contacts`

**Test:** `scripts/test-contacts.ts`

---

### Step 4.8: Account Management API
**Endpoints:**

1. **GET** `/api/accounts` - List user's accounts
   ```json
   {
     "accounts": [
       {
         "id": "uuid",
         "email": "user@example.com",
         "status": "active",
         "lastSyncAt": "2026-02-22T10:00:00Z",
         "messageCount": 5526,
         "folderCount": 15
       }
     ]
   }
   ```

2. **GET** `/api/accounts/[id]/stats` - Account statistics
   ```json
   {
     "totalMessages": 5526,
     "unreadMessages": 342,
     "folders": 15,
     "storageUsed": 1234567890,
     "lastSyncAt": "2026-02-22T10:00:00Z"
   }
   ```

3. **POST** `/api/accounts/[id]/sync` - Trigger manual sync
   (Already implemented in Agent 3 - just need to verify)

**Test:** `scripts/test-accounts.ts`

---

## Critical Implementation Notes

### 1. Always Update Local Database
After Graph API mutations (send, delete, move, etc.), **immediately update local database** to reflect changes. Don't rely solely on webhook notifications.

### 2. Error Handling Pattern
```typescript
try {
  // Graph API operation
  await graphClient.api('/endpoint').post(data);

  // Update local database
  await supabase.from('table').update(...);

  return NextResponse.json({ success: true });
} catch (error: any) {
  console.error('Operation failed:', error);

  // Check for token expiry
  if (error.statusCode === 401) {
    // Trigger reauth flow
    return NextResponse.json(
      { error: 'Token expired', reauth: true },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}
```

### 3. Pagination Pattern
Always paginate lists with default limit of 50, max 100:
```typescript
const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
const limit = Math.min(
  parseInt(request.nextUrl.searchParams.get('limit') || '50'),
  100
);
const offset = (page - 1) * limit;

const { data, count } = await supabase
  .from('messages')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

### 4. Folder ID Conversion
Remember: Database uses UUIDs, Graph API uses graph_id strings. Always convert:
```typescript
// Get folder UUID from graph_id
const { data: folder } = await supabase
  .from('account_folders')
  .select('id')
  .eq('account_id', accountId)
  .eq('graph_id', graphFolderId)
  .single();

const folderUuid = folder?.id;
```

---

## Test Coverage Requirements

Each step must have a test script that:
1. Finds the active test account
2. Calls the API endpoint
3. Verifies the response structure
4. Checks database state
5. Outputs ✅ PASSED or ❌ FAILED

**Test Script Naming:**
- `scripts/test-list-messages.ts`
- `scripts/test-get-message.ts`
- `scripts/test-send-message.ts`
- `scripts/test-message-actions.ts`
- `scripts/test-folders.ts`
- `scripts/test-search.ts`
- `scripts/test-contacts.ts`
- `scripts/test-accounts.ts`

---

## Known Issues to Watch For

1. **RLS Policies:** Use `createAdminClient()` for all API routes
2. **Token Expiry:** Check for 401 responses and trigger reauth
3. **Graph ID vs UUID:** Always convert between the two
4. **Null Handling:** Many Graph API fields can be null (from, body, etc.)
5. **Date Formats:** Graph API uses ISO 8601, ensure consistent handling
6. **Attachment Sizes:** Don't try to load massive attachments into memory

---

## Checkpoint 4 Requirements

After completing steps 4.1-4.8, verify:

- [ ] All 8 API endpoints implemented
- [ ] All 8 test scripts pass
- [ ] Can list messages with pagination
- [ ] Can view single message details
- [ ] Can send email (test with real send)
- [ ] Can mark read/unread, flag, move, delete
- [ ] Can create/rename/delete folders
- [ ] Search returns relevant results
- [ ] Contacts API returns accurate data
- [ ] Account stats are correct

---

## Starting the Next Session

**Command to begin:**
```
I'm ready to start Agent 4: Email API (Steps 4.1-4.8).
Checkpoint 3 is complete, all sync infrastructure is working.
Please begin with Step 4.1: List Messages API.
```

**Files to reference:**
- `PROJECT-SPEC.md` - Full architecture
- `BUILD-STATE.md` - Current progress tracker
- `CLAUDE-CODE-INSTRUCTIONS.md` - Per-step prompts
- This file - `HANDOFF-AGENT-4.md` - Context from Agent 3

**Active test account:**
- Email: info@tonnerow.com
- ID: f817b168-8de0-462b-a676-9e9b8295e8d5
- Status: active
- Has 15 folders, 2 messages synced

---

## Quick Reference Commands

**Check account status:**
```bash
npx tsx scripts/check-accounts.ts
```

**Reset account to active:**
```bash
npx tsx scripts/reset-account-status.ts
```

**Run existing sync tests:**
```bash
npx tsx scripts/test-folder-sync.ts
npx tsx scripts/test-message-delta-sync.ts
```

**Start dev server:**
```bash
npm run dev
```

---

**Status:** ✅ Ready for Agent 4
**Last Updated:** 2026-02-22
**All Agent 3 work committed to main branch**
