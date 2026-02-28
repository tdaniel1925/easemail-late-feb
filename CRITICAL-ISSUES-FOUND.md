# CRITICAL ISSUES FOUND - Deep Dive Review

## 🔴 CRITICAL - App-Breaking Issues

### 1. Missing Teams API Routes
**Impact:** Teams messaging features completely non-functional
**Location:** `/api/teams/messages/`

**Missing:**
- ❌ POST `/api/teams/messages/route.ts` - Send new message
- ❌ GET `/api/teams/messages/[id]/replies/route.ts` - Get message replies
- ❌ POST `/api/teams/messages/[id]/replies/route.ts` - Send reply to message
- ❌ POST `/api/teams/messages/[id]/reactions/route.ts` - Add reaction to message

**Called by:**
- `TeamsMessageList.tsx:handleSendMessage()` - line 91
- `TeamsMessageDetails.tsx:fetchReplies()` - line 35
- `TeamsMessageDetails.tsx:handleSendReply()` - line 58
- `TeamsMessageItem.tsx:handleEmojiSelect()` - line 22 (commented out)

**Fix Required:** Create these 3 API routes with proper Graph API integration

---

### 2. Calendar Filters Don't Actually Filter
**Impact:** Filter UI exists but does nothing
**Location:** `components/calendar/CalendarGrid.tsx`

**Problem:**
- Filters are set in toolbar: `responseStatusFilter`, `isOnlineMeetingFilter`
- CalendarGrid fetches and displays ALL events
- Never checks filter values when rendering

**Fix Required:**
```typescript
// In CalendarGrid.tsx, after fetching events:
const filteredEvents = events.filter(event => {
  // Filter by response status
  if (responseStatusFilter && event.response_status !== responseStatusFilter) {
    return false;
  }

  // Filter by online meeting
  if (isOnlineMeetingFilter === true && !event.is_online_meeting) {
    return false;
  }

  return true;
});

// Then use filteredEvents instead of events in all views
```

---

### 3. Teams Message Type Filter Doesn't Work
**Impact:** Filter dropdown exists but doesn't filter messages
**Location:** `components/teams/TeamsToolbar.tsx`, `TeamsMessageList.tsx`

**Problem:**
- `TeamsToolbar` sets `messageTypeFilter` state locally
- Never stored in Zustand store
- `TeamsMessageList` never reads or applies filter

**Fix Required:**
1. Add `messageTypeFilter` to teams-store.ts
2. Apply filter in TeamsMessageList when displaying messages
3. Connect TeamsToolbar to store

---

### 4. Test-ID Mismatch: Meeting Link
**Impact:** E2E test will fail
**Location:** `components/calendar/EventDetailsModal.tsx:146`

**Problem:**
- E2E test expects: `data-testid="meeting-link"`
- Modal has: `data-testid="join-meeting"`

**Fix Required:** Change line 146 to use `meeting-link` test-id

---

### 5. RLS Security Bypass - Still Vulnerable
**Impact:** CRITICAL SECURITY ISSUE - Users can access other tenants' data
**Location:** ~40 remaining API routes

**Fixed (10 routes):**
- ✅ AI routes (3)
- ✅ CRM routes (3)
- ✅ Teams routes (2)
- ✅ Assignments, Shared Inboxes (2)

**Still Vulnerable (~40 routes):**
- ❌ `/api/accounts/*`
- ❌ `/api/calendar/*`
- ❌ `/api/contacts/*` (most routes)
- ❌ `/api/mail/*`
- ❌ `/api/organization/*`
- ❌ `/api/invitations/*`
- ❌ `/api/signatures/*`
- ❌ `/api/test/*`

**Fix Required:** Replace `createAdminClient()` with `createClient()` + `getCurrentUser()` in all routes

---

## 🟡 HIGH PRIORITY - Functionality Issues

### 6. Teams Reactions Not Implemented
**Impact:** Reaction button shows but doesn't work
**Location:** `components/teams/TeamsMessageItem.tsx:22`

**Problem:**
- `handleEmojiSelect()` just logs to console
- Comment says "TODO: Make API call"
- No actual Graph API integration

**Fix Required:**
1. Create `/api/teams/messages/[id]/reactions/route.ts`
2. Implement Graph API call to add reaction
3. Uncomment and complete handleEmojiSelect

---

### 7. Company Filter Uses Client-Side Filtering
**Impact:** Performance issue with large contact lists
**Location:** `stores/contacts-store.ts:248-340`

**Problem:**
- Fetches ALL contacts from API
- Filters on client side in `getFilteredContacts()`
- Should filter server-side for performance

**Fix Required:** Pass filter params to API route, filter in database

---

### 8. No Error Toast Notifications
**Impact:** Poor UX - users don't see meaningful errors
**Location:** Multiple components

**Problem:**
- Errors logged to console or shown in alerts
- No consistent toast notification system
- E.g., `TeamsMessageDetails.tsx:72` uses `alert()`

**Fix Required:**
1. Install toast library (e.g., sonner, react-hot-toast)
2. Replace all `alert()` calls with toast
3. Add toast provider to app layout

---

### 9. Message Composer Doesn't Clear on Channel Change
**Impact:** Typing message in one channel, switch channels, message persists
**Location:** `components/teams/TeamsMessageComposer.tsx`

**Problem:**
- Component receives `channelId` prop
- No `useEffect` to clear message when channelId changes

**Fix Required:**
```typescript
useEffect(() => {
  setMessage(""); // Clear when channel changes
}, [channelId]);
```

---

### 10. Missing Loading States in Modals
**Impact:** No feedback during API calls
**Locations:**
- `TeamsMessageDetails.tsx` - sending reply
- `EventDetailsModal.tsx` - deleting event

**Problem:**
- Buttons disable but no loading spinner
- Just says "Deleting..." text

**Fix Required:** Add loading spinners to button states

---

## 🟢 MEDIUM PRIORITY - Edge Cases & Polish

### 11. Calendar Event Deletion Uses window.reload()
**Impact:** Bad UX - entire page reloads
**Location:** `EventDetailsModal.tsx:45`

**Problem:**
```typescript
window.location.reload(); // TODO: Replace with proper store update
```

**Fix Required:** Remove event from store instead of reloading

---

### 12. Select All Contacts Edge Case
**Impact:** Confusing behavior
**Location:** `ContactsToolbar.tsx`

**Problem:**
- Select all → filter by company → still shows "X selected" from all contacts
- Deleted contacts aren't removed from selection

**Fix Required:** Clear selection when filters change

---

### 13. No Optimistic Updates
**Impact:** Slow perceived performance
**Locations:** All mutation operations

**Problem:**
- Send message → wait for API → fetch messages again
- Should optimistically add message, then confirm

**Fix Required:** Add optimistic updates to mutations

---

### 14. Hard-Coded Pagination Limits
**Impact:** May not match API limits
**Multiple files**

**Problem:**
- CalendarGrid: `limit: '100'`
- TeamsMessageList: `limit: "50"`
- ContactsToolbar: No pagination at all

**Fix Required:** Use consistent pagination strategy

---

### 15. Accessibility Issues
**Impact:** Not WCAG compliant

**Problems:**
- EmojiPicker backdrop doesn't have label
- Dropdowns missing proper ARIA attributes
- No focus management in modals

**Fix Required:** Add proper ARIA labels and focus management

---

### 16. TypeScript Any Types
**Impact:** Type safety compromised
**Locations:** Multiple

**Examples:**
- `EventDetailsModal.tsx:179` - `attendee: any`
- `TeamsMessageDetails.tsx:15` - `Reply` interface incomplete
- Error handlers: `error: any`

**Fix Required:** Define proper interfaces

---

## 🔵 LOW PRIORITY - Nice to Have

### 17. Console Logs in Production Code
**Impact:** Performance, security (leak info)
**Everywhere**

**Fix Required:** Use proper logging library, disable in production

---

### 18. No Offline Support
**Impact:** App breaks without internet
**Fix Required:** Add service worker, offline detection

---

### 19. No Real-Time Updates
**Impact:** Need to manually refresh to see new messages
**Fix Required:** Add WebSocket or polling for real-time

---

### 20. Missing Input Validation
**Impact:** Can send empty messages with just whitespace
**Location:** All form submissions

**Fix Required:** Add validation before API calls

---

## 📊 Summary

**CRITICAL Issues:** 5 (Must fix before deployment)
**HIGH Priority:** 10 (Should fix before production)
**MEDIUM Priority:** 6 (Fix for polish)
**LOW Priority:** 4 (Future enhancements)

**Estimated Time to Fix:**
- Critical: 8-12 hours
- High: 6-8 hours
- Medium: 4-6 hours
- Low: 2-4 hours

**TOTAL: 20-30 hours of work remaining**
