# HANDOFF: Ready for Agent 5 - UI Shell

**Date:** 2026-02-22
**Status:** Agent 4 Complete ✅ - Ready for Agent 5
**Next Task:** Begin Agent 5: UI Shell (Steps 5.1-5.10)

---

## Current Project State

### Completed Work:
- ✅ **Phase 0:** Risk Mitigation POCs (Token refresh, Delta sync, Webhooks)
- ✅ **Agent 1:** Foundation (Scaffold, DB, Config, Clients, Stores, Jobs)
- ✅ **Agent 2:** Auth Engine (NextAuth, Tokens, Graph Client, Connect/Disconnect/Reauth)
- ✅ **Agent 3:** Sync Engine (Folders, Messages, Orchestrator, Webhooks, Attachments)
- ✅ **Agent 4:** Email API (All 8 endpoints with tests)
- ✅ **Checkpoint 3:** Manual verification complete

### Key Context:

**Active Test Account:**
- Email: `info@tonnerow.com`
- ID: `f817b168-8de0-462b-a676-9e9b8295e8d5`
- Status: `active`
- Messages: 5 synced (2 in Drafts, 3 sent test emails)
- Folders: 15 synced

**Environment:**
- Next.js 14 App Router
- Supabase (admin client working)
- Microsoft Graph API (tokens refreshing correctly)
- Inngest (background jobs configured)
- Dev server: `http://localhost:3000` (or :3001, :3002, :3003 depending on ports)

---

## Agent 4 Summary: Email API

All 8 API endpoints completed and tested:

### 4.1: List Messages API ✅
- **Endpoint:** `GET /api/mail/messages`
- **Features:** Pagination, folder filter, unread/flagged/attachments filters, sorting
- **Test:** `scripts/test-list-messages.ts` - PASSED

### 4.2: Get Single Message API ✅
- **Endpoints:**
  - `GET /api/mail/messages/[id]` - Full details
  - `PATCH /api/mail/messages/[id]` - Update flags
  - `DELETE /api/mail/messages/[id]` - Soft delete
- **Test:** `scripts/test-get-message.ts` - PASSED

### 4.3: Compose & Send API ✅
- **Endpoint:** `POST /api/mail/send`
- **Features:** Send with attachments, CC/BCC, reply/forward support
- **Test:** `scripts/test-send-message.ts` - PASSED (sent 3 real test emails)

### 4.4: Message Actions API ✅
- **Endpoint:** `POST /api/mail/messages/[id]/move`
- **Features:** Move messages, mark read/unread, flag/unflag
- **Test:** `scripts/test-message-actions.ts` - PASSED

### 4.5: Folder Management API ✅
- **Endpoints:**
  - `GET /api/mail/folders` - List all
  - `POST /api/mail/folders` - Create
  - `PATCH /api/mail/folders/[id]` - Rename
  - `DELETE /api/mail/folders/[id]` - Delete
- **Test:** `scripts/test-folders.ts` - PASSED

### 4.6: Search API ✅
- **Endpoint:** `GET /api/mail/search`
- **Features:** Full-text search, sender filter, date range, attachments filter
- **Test:** `scripts/test-search.ts` - PASSED

### 4.7: Contacts API ✅
- **Endpoint:** `GET /api/contacts`
- **Features:** Aggregate contacts from messages, interaction tracking
- **Test:** `scripts/test-contacts.ts` - PASSED (3 contacts found)

### 4.8: Account Management API ✅
- **Endpoints:**
  - `GET /api/accounts` - List accounts with stats
  - `GET /api/accounts/[accountId]/stats` - Detailed statistics
- **Test:** `scripts/test-accounts.ts` - PASSED

---

## Agent 5: UI Shell - Task Breakdown

Agent 5 builds the core UI components. Before starting, **READ UI-DESIGN-SYSTEM.md** - it contains critical design specs.

### Design System Key Points:
- **Base font:** 13px (not 16px!)
- **Spacing:** 4px grid - every margin/padding is multiple of 4
- **Accent color:** Coral `#FF7F50` - ONLY for primary buttons, focus rings, unread dots, active nav, send button
- **Everything else:** Grayscale
- **NO gradients, NO colored backgrounds**
- **Reference:** `easemail-mockup.jsx` for visual design

---

### Step 5.1: App Layout Shell

**Goal:** Create the main app layout with sidebar, topbar, and content area.

**Files to Create:**
- `app/(app)/layout.tsx` - Main app layout wrapper
- `components/layout/AppShell.tsx` - Shell container
- `components/layout/Sidebar.tsx` - Left sidebar (accounts, folders)
- `components/layout/TopBar.tsx` - Top navigation bar
- `components/layout/BottomBar.tsx` - Optional bottom status bar

**Key Features:**
- Responsive layout (collapse sidebar on mobile)
- Fixed sidebar width: 240px
- TopBar height: 56px
- 3-column layout: Sidebar | Message List | Message Viewer
- Use CSS Grid or Flexbox (prefer Grid)

**Test Gate:**
- Layout renders without errors
- Sidebar visible on desktop, collapsible on mobile
- No layout shift on load

---

### Step 5.2: Account Switcher

**Goal:** Dropdown to switch between connected accounts.

**Files to Create:**
- `components/mail/AccountSwitcher.tsx`
- `components/ui/Dropdown.tsx` (if needed)

**API Integration:**
- Fetch accounts from `GET /api/accounts`
- Show account email, status indicator
- Store active account in Zustand store: `stores/account-store.ts`

**Features:**
- Display account avatar (or initials if no avatar)
- Status badge: green (active), red (needs_reauth), yellow (syncing)
- Unread count badge per account
- Click to switch active account

**Test Gate:**
- Can fetch and display accounts
- Can switch between accounts
- Active account persists in store

---

### Step 5.3: Folder Tree

**Goal:** Display folder hierarchy in sidebar.

**Files to Create:**
- `components/mail/FolderTree.tsx`
- `components/mail/FolderItem.tsx`

**API Integration:**
- Fetch folders from `GET /api/mail/folders?accountId=xxx`
- Show folder name, unread count, total count

**Features:**
- Tree structure with collapsible parent folders
- System folders (Inbox, Drafts, Sent) with icons
- Custom folders with folder icon
- Unread count badge (only show if > 0)
- Active folder highlight
- Click to select folder

**Folder Icons:**
- Inbox: `<Inbox />` from lucide-react
- Drafts: `<FileEdit />`
- Sent Items: `<Send />`
- Deleted Items: `<Trash2 />`
- Custom: `<Folder />`

**Test Gate:**
- Folders display in tree structure
- Can expand/collapse folders with children
- Click to select folder
- Unread counts display correctly

---

### Step 5.4: Message List

**Goal:** Display messages for selected folder.

**Files to Create:**
- `components/mail/MessageList.tsx`
- `components/mail/MessageListItem.tsx`
- `components/mail/MessageListToolbar.tsx`

**API Integration:**
- Fetch messages from `GET /api/mail/messages?accountId=xxx&folderId=xxx&page=1&limit=50`
- Infinite scroll or pagination

**Features:**
- Message row height: 72px (comfortable density)
- Display: avatar/initials, from name, subject, preview, date
- Visual indicators:
  - Unread: bold text, coral dot (4px)
  - Flagged: star icon (filled if flagged)
  - Attachments: paperclip icon
  - Draft: "Draft" badge
- Hover state: light gray background
- Selected state: slightly darker gray background
- Multi-select with checkboxes (Cmd/Ctrl + Click)
- Toolbar: Archive, Delete, Mark Read, Flag, Move to Folder

**Date Display:**
- Today: "2:30 PM"
- Yesterday: "Yesterday"
- This week: "Monday"
- Older: "Jan 15"

**Test Gate:**
- Messages load and display
- Can select single message
- Can multi-select messages
- Toolbar actions work
- Infinite scroll or pagination works

---

### Step 5.5: Message Viewer

**Goal:** Display full message content in reading pane.

**Files to Create:**
- `components/mail/MessageViewer.tsx`
- `components/mail/MessageHeader.tsx`
- `components/mail/MessageBody.tsx`
- `components/mail/AttachmentList.tsx`

**API Integration:**
- Fetch message from `GET /api/mail/messages/[id]`
- Mark as read on open: `PATCH /api/mail/messages/[id]` with `{ isRead: true }`

**Features:**
- Header: From, To, CC, Date, Subject
- Action buttons: Reply, Reply All, Forward, Archive, Delete, Flag
- Body: Sanitized HTML or plain text
- Attachments list with download buttons
- Loading skeleton while fetching

**Security:**
- Sanitize HTML body with DOMPurify
- Strip `<script>`, `<iframe>`, dangerous attributes
- Allow `<img>` but set `loading="lazy"`

**Test Gate:**
- Message displays correctly
- HTML is sanitized
- Action buttons work
- Attachments display

---

### Step 5.6: Composer

**Goal:** Email composition modal/pane.

**Files to Create:**
- `components/mail/Composer.tsx`
- `components/mail/ComposerToolbar.tsx`
- `components/mail/RecipientInput.tsx`

**API Integration:**
- Send email: `POST /api/mail/send`
- Fetch contacts for autocomplete: `GET /api/contacts?q=xxx`

**Features:**
- Modal or expandable pane (start with modal)
- Fields: To, CC, BCC, Subject, Body
- Rich text editor: TipTap (already installed)
- Toolbar: Bold, Italic, Underline, Lists, Link
- Attachment upload (file input)
- Auto-save to drafts every 30 seconds
- Keyboard shortcut: Cmd+Enter to send

**Recipient Input:**
- Autocomplete from contacts
- Multi-select with chips/tags
- Validate email format

**Test Gate:**
- Can compose new email
- Can send email successfully
- Recipients autocomplete works
- Rich text formatting works

---

### Step 5.7: Search UI

**Goal:** Global search bar and results view.

**Files to Create:**
- `components/mail/SearchBar.tsx`
- `components/mail/SearchResults.tsx`

**API Integration:**
- Search: `GET /api/mail/search?q=xxx&accountId=xxx`

**Features:**
- Search bar in TopBar
- Keyboard shortcut: Cmd+K or /
- Debounce input (300ms)
- Display results in main content area (replace message list)
- Group results by folder
- Highlight search terms in results
- Click result to open message

**Test Gate:**
- Search bar functional
- Results display
- Can navigate to message from results

---

### Step 5.8: Settings Pages

**Goal:** User settings and preferences.

**Files to Create:**
- `app/(app)/settings/page.tsx`
- `components/settings/GeneralSettings.tsx`
- `components/settings/AccountSettings.tsx`
- `components/settings/AppearanceSettings.tsx`

**Features:**
- Sidebar nav: General, Accounts, Appearance, Notifications
- General: Default account, timezone, date format
- Accounts: List connected accounts, connect new, disconnect
- Appearance: Theme (light/dark/system), density (compact/comfortable/spacious), reading pane position
- Notifications: Enable/disable, sound

**Store Integration:**
- Save preferences to `user_preferences` table
- Load on app start
- Store in Zustand: `stores/ui-store.ts`

**Test Gate:**
- Settings page renders
- Can update preferences
- Preferences persist across reload

---

### Step 5.9: Notifications & Toasts

**Goal:** Toast notifications for user feedback.

**Files to Create:**
- `components/ui/Toast.tsx`
- `components/ui/Toaster.tsx`
- `lib/toast.ts` - Toast utility functions

**Features:**
- Toast positions: top-right (default)
- Types: success, error, info, warning
- Auto-dismiss after 5 seconds (configurable)
- Manual dismiss with X button
- Stack multiple toasts
- Use sonner or custom implementation

**Usage:**
```typescript
toast.success('Email sent successfully');
toast.error('Failed to send email');
```

**Test Gate:**
- Toasts display
- Auto-dismiss works
- Manual dismiss works

---

### Step 5.10: Keyboard Shortcuts

**Goal:** Keyboard shortcuts for power users.

**Files to Create:**
- `components/mail/KeyboardShortcuts.tsx` - Help modal
- `hooks/useKeyboardShortcuts.ts` - Shortcut handler

**Shortcuts:**
- `c` - Compose new email
- `r` - Reply to selected message
- `a` - Reply all
- `f` - Forward
- `e` - Archive
- `#` or `Delete` - Delete
- `s` - Star/flag
- `u` - Mark as unread
- `j` / `k` - Next/previous message
- `/` or `Cmd+K` - Search
- `Cmd+Enter` - Send email (in composer)
- `Esc` - Close modal/composer
- `?` - Show keyboard shortcuts help

**Test Gate:**
- Shortcuts work as expected
- Help modal displays all shortcuts
- No conflicts with browser shortcuts

---

## Critical Implementation Notes

### 1. API Error Handling Pattern

All API calls should handle errors gracefully:

```typescript
try {
  const response = await fetch('/api/mail/messages');
  if (!response.ok) {
    const error = await response.json();
    if (error.reauth) {
      // Trigger reauth flow
      router.push('/reauth');
    }
    toast.error(error.error || 'An error occurred');
    return;
  }
  const data = await response.json();
  // Success
} catch (error) {
  toast.error('Network error. Please try again.');
}
```

### 2. Zustand Store Pattern

Update stores immutably:

```typescript
// stores/mail-store.ts
interface MailState {
  messages: Message[];
  selectedMessageId: string | null;
  selectedFolderId: string | null;
  setMessages: (messages: Message[]) => void;
  selectMessage: (id: string) => void;
}

export const useMailStore = create<MailState>((set) => ({
  messages: [],
  selectedMessageId: null,
  selectedFolderId: null,
  setMessages: (messages) => set({ messages }),
  selectMessage: (id) => set({ selectedMessageId: id }),
}));
```

### 3. Loading States

Always show skeleton screens:

```typescript
{isLoading ? (
  <MessageListSkeleton />
) : (
  <MessageList messages={messages} />
)}
```

### 4. Optimistic Updates

Update UI immediately, revert on error:

```typescript
// Mark as read optimistically
const originalMessage = { ...message };
setMessage({ ...message, is_read: true });

try {
  await fetch(`/api/mail/messages/${message.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead: true }),
  });
} catch (error) {
  // Revert on error
  setMessage(originalMessage);
  toast.error('Failed to mark as read');
}
```

### 5. Design System Compliance

**BEFORE writing ANY component, check:**
- Is the font 13px? (not 16px)
- Are margins/padding multiples of 4?
- Am I only using coral for: primary buttons, focus rings, unread dots, active nav, send button?
- Everything else grayscale?
- No gradients or colored backgrounds?

---

## Test Coverage Requirements

Each step should have manual testing checklist:

**Example for Step 5.1 (App Layout):**
- [ ] Layout renders without errors
- [ ] Sidebar displays on desktop
- [ ] Sidebar collapses on mobile (< 768px)
- [ ] TopBar displays with correct height
- [ ] Content area takes remaining space
- [ ] No layout shift during load
- [ ] Responsive breakpoints work

**Example for Step 5.4 (Message List):**
- [ ] Messages load from API
- [ ] Message list displays correctly
- [ ] Can select single message
- [ ] Can multi-select with Cmd+Click
- [ ] Toolbar buttons work
- [ ] Unread indicator shows
- [ ] Attachment icon shows when has_attachments=true
- [ ] Date formatting correct
- [ ] Infinite scroll/pagination works

---

## Known Issues from Agent 4

1. **Column name:** Use `last_full_sync_at` not `last_synced_at` for connected_accounts
2. **Column name:** Use `initial_sync_complete` not `initial_sync_completed`
3. **Folder types:** Currently all marked as 'custom', should infer from display_name
4. **RLS policies:** Use `createAdminClient()` for all background operations
5. **Dynamic routes:** All use `[accountId]` or `[id]` consistently (no mixing)

---

## Micro-Features to Implement

Before building each component, check `MICRO-FEATURES.md`, `MICRO-FEATURES-V2.md`, and `MICRO-FEATURES-V3.md` for relevant features. Don't defer - implement them NOW.

**Example for Message List (from MICRO-FEATURES.md):**
- Row selection
- Multi-select
- Keyboard navigation (j/k)
- Read/unread visual distinction
- Hover states
- Loading skeletons
- Empty state
- Bulk actions toolbar
- Refresh button
- Select all checkbox
- Etc.

---

## Files Modified in Agent 4

**API Routes Created:**
- `app/api/mail/messages/route.ts`
- `app/api/mail/messages/[id]/route.ts`
- `app/api/mail/messages/[id]/move/route.ts`
- `app/api/mail/send/route.ts`
- `app/api/mail/folders/route.ts`
- `app/api/mail/folders/[id]/route.ts`
- `app/api/mail/search/route.ts`
- `app/api/contacts/route.ts`
- `app/api/accounts/route.ts`
- `app/api/accounts/[accountId]/stats/route.ts`

**Test Scripts Created:**
- `scripts/test-list-messages.ts`
- `scripts/test-get-message.ts`
- `scripts/test-send-message.ts`
- `scripts/test-message-actions.ts`
- `scripts/test-folders.ts`
- `scripts/test-search.ts`
- `scripts/test-contacts.ts`
- `scripts/test-accounts.ts`

**Updated:**
- `BUILD-STATE.md` - Marked steps 4.1-4.8 as ✅

---

## Starting Agent 5

**Command to begin:**
```
I'm ready to start Agent 5: UI Shell (Steps 5.1-5.10).

Agent 4 is complete - all Email API endpoints are working and tested.

Please read HANDOFF-AGENT-5.md for full context, then begin with Step 5.1: App Layout Shell.

IMPORTANT: Before writing ANY UI code, read UI-DESIGN-SYSTEM.md and reference easemail-mockup.jsx.
```

**Active test account:**
- Email: info@tonnerow.com
- ID: f817b168-8de0-462b-a676-9e9b8295e8d5
- Status: active
- Messages: 5
- Folders: 15

**Dev server:** Port 3000 (or next available: 3001, 3002, 3003)

---

**Status:** ✅ Ready for Agent 5
**Last Updated:** 2026-02-22
**All Agent 4 work committed to main branch**
