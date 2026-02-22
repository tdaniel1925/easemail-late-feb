# MICRO-FEATURES.md — EaseMail v3.0

> **The 200+ small features that separate "demo" from "daily driver"**
> These are organized by area. Each one is a checklist item that must be
> verified during the manual checkpoint for its parent agent.
> Claude Code agents MUST read this file alongside PROJECT-SPEC.md.

---

## WHY THIS FILE EXISTS

Previous EaseMail builds looked complete but weren't usable because hundreds
of small behaviors were missing. You could compose an email but couldn't paste
an image. You could attach a file but couldn't drag-and-drop it. You could
save a draft but it didn't auto-save. These micro-features are the difference
between a prototype and a product people actually use every day.

**Rule for Claude Code agents:** When building a component, check this file
for ALL micro-features related to that component. Implement them in the same
step. Don't create a "polish" step later — polish is built in from the start.

---

## 1. COMPOSER — EVERY NUANCE

### Text Editing
- [ ] Standard keyboard shortcuts: Ctrl/⌘+B (bold), Ctrl/⌘+I (italic), Ctrl/⌘+U (underline)
- [ ] Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z redo (multi-level, at least 50 steps)
- [ ] Ctrl/⌘+A select all within composer (not whole page)
- [ ] Ctrl/⌘+K insert link (opens link dialog with URL + display text)
- [ ] Tab key inserts indent in lists, Shift+Tab outdents
- [ ] Enter in empty list item exits list mode
- [ ] Shift+Enter inserts line break without new paragraph
- [ ] Triple-click selects entire paragraph
- [ ] Double-click selects word

### Copy/Paste
- [ ] Paste plain text (Ctrl/⌘+Shift+V) strips all formatting
- [ ] Paste rich text (Ctrl/⌘+V) preserves formatting (bold, italic, lists, links)
- [ ] Paste from Word/Google Docs preserves reasonable formatting (clean up messy HTML)
- [ ] Paste image from clipboard directly into compose body (inline image)
- [ ] Paste screenshot (⌘+Shift+4 on Mac → ⌘+V into compose) embeds as inline image
- [ ] Paste URL auto-detects and creates clickable link
- [ ] Paste email address auto-detects and creates mailto link
- [ ] Copy from email body and paste into reply preserves formatting
- [ ] Paste table from Excel/Sheets renders as HTML table
- [ ] Strip tracking pixels and hidden elements from pasted HTML

### Attachments
- [ ] Click "Attach" button opens system file picker
- [ ] Drag-and-drop files ANYWHERE on the composer window (not just a tiny dropzone)
- [ ] Drag-and-drop shows visual drop indicator (dashed border, "Drop files here")
- [ ] Drag file over compose window from desktop highlights the composer
- [ ] Multiple files can be attached at once (multi-select in file picker)
- [ ] Attachment chips show: filename, file size, file type icon, remove (×) button
- [ ] Click attachment chip to preview (images show thumbnail, PDF shows first page)
- [ ] Attachment size limit warning BEFORE upload (show "File exceeds 25MB" immediately)
- [ ] Large attachments (>3MB) use Graph upload session automatically
- [ ] Progress bar on attachment upload
- [ ] Cancel upload in progress (× on progress bar)
- [ ] Drag image into body inserts as inline image (not attachment)
- [ ] Can convert inline image to attachment and vice versa
- [ ] Forward email with attachments: all original attachments carried over automatically
- [ ] Reply does NOT carry forward attachments (matches Outlook behavior)
- [ ] Attach from recent files (last 10 attachments sent/received)
- [ ] Total attachment size shown: "3 files (2.4 MB)"
- [ ] Warn if total attachments exceed 25MB (Graph limit)
- [ ] Support common file types with icons: PDF, DOC, XLS, PPT, ZIP, images, code files

### Draft Auto-Save
- [ ] Auto-save triggers 3 seconds after user stops typing (debounced)
- [ ] Auto-save creates draft in Graph API (POST first time, PATCH subsequent)
- [ ] "Saving..." indicator in composer footer during save
- [ ] "Saved" indicator with timestamp after successful save ("Saved 2:34 PM")
- [ ] "Save failed" indicator with retry button on failure
- [ ] Auto-save does NOT trigger on empty composer (no subject, no body, no recipients)
- [ ] Auto-save only triggers if content CHANGED since last save
- [ ] Closing composer with unsaved changes shows "Discard draft?" confirmation
- [ ] Browser tab close / navigation away shows "You have unsaved changes" browser prompt
- [ ] Draft appears in Drafts folder in sidebar immediately after first save
- [ ] Opening a saved draft in message list opens it in composer (resume editing)
- [ ] Auto-save preserves: recipients, subject, body, attachments, CC/BCC state
- [ ] Multiple composers = multiple independent drafts, each auto-saving independently

### Undo Send
- [ ] After clicking Send, show toast: "Message sent" with "Undo" button
- [ ] Undo window: configurable 5/10/30 seconds (default 10)
- [ ] During undo window: message is queued locally, NOT sent to Graph yet
- [ ] Clicking "Undo" cancels send, reopens composer with all content intact
- [ ] Undo toast shows countdown timer (visual progress bar or seconds remaining)
- [ ] If undo window expires: send via Graph API, toast changes to "Message sent ✓"
- [ ] If sending fails after undo window: show error toast, move to drafts, notify user
- [ ] Undo works even if user navigated away from composer (toast persists)
- [ ] Multiple messages queued: each has independent undo timer

### Schedule Send
- [ ] "Schedule Send" option next to Send button (dropdown arrow)
- [ ] Quick options: "Tomorrow morning (8 AM)", "Tomorrow afternoon (1 PM)", "Monday morning (8 AM)"
- [ ] Custom date/time picker
- [ ] Scheduled messages saved as drafts with scheduled_send_at metadata
- [ ] Scheduled messages appear in a "Scheduled" section in Drafts folder
- [ ] Can edit scheduled message before send time (opens composer, reschedule or cancel)
- [ ] Background job picks up scheduled messages and sends at the right time
- [ ] Timezone-aware (uses user's configured timezone)
- [ ] "Scheduled for Tomorrow at 8:00 AM" badge on the draft

### Recipients (To/CC/BCC)
- [ ] Autocomplete dropdown appears after 2 characters typed
- [ ] Autocomplete searches: name, email, company (from contacts hub)
- [ ] Autocomplete ranked by frequency score (most emailed first)
- [ ] Show presence dot on autocomplete suggestions (if Teams integrated)
- [ ] Pressing Enter or Tab on highlighted suggestion adds it as chip
- [ ] Pressing comma or semicolon after email address adds it as chip
- [ ] Pasting comma-separated emails creates multiple chips
- [ ] Pasting "Name <email@example.com>" format creates chip with display name
- [ ] Backspace on empty input deletes last chip (with confirm highlight first)
- [ ] Click chip to edit (inline edit, not modal)
- [ ] × button on each chip to remove
- [ ] Invalid email chip shows red border (validates email format)
- [ ] CC field hidden by default, "CC" and "BCC" buttons to reveal
- [ ] CC/BCC fields slide open with subtle animation
- [ ] Can drag chips between To/CC/BCC fields
- [ ] "Reply All" pre-fills To with sender, CC with all other recipients (minus yourself)
- [ ] "Reply" pre-fills To with sender only
- [ ] "Forward" clears all recipients

### Composer Window Behavior
- [ ] Composer opens as modal overlay (bottom-right, 560×480px default)
- [ ] Can minimize composer to a small bar at bottom (shows subject line)
- [ ] Can maximize to full-screen
- [ ] Can resize by dragging edges
- [ ] Up to 3 composers open simultaneously
- [ ] Minimized composers stack at bottom of screen
- [ ] Clicking minimized composer restores it
- [ ] Each composer is independent (different accounts, different drafts)
- [ ] "From" dropdown shows all connected accounts (for multi-account send)
- [ ] Changing "From" account changes the signature automatically
- [ ] Composer remembers last used account as default "From"
- [ ] "Discard" button with confirmation dialog
- [ ] Close (×) button with "Save as draft?" / "Discard" / "Cancel" options

### Signatures
- [ ] Signature auto-inserted at bottom of new emails
- [ ] Signature auto-inserted ABOVE quoted text in replies
- [ ] "--" separator line above signature
- [ ] Signature changes when switching "From" account (if account-specific signature)
- [ ] Can toggle signature off for individual email
- [ ] Signature rendered as HTML (supports images, links, formatting)
- [ ] Cursor placed ABOVE signature when composing
- [ ] Signature editable in settings with rich text editor

### Reply/Forward Specifics
- [ ] Reply: "On [date], [sender] wrote:" header above quoted text
- [ ] Reply: quoted text is indented or has left border (traditional email quoting)
- [ ] Reply All: includes all original recipients minus yourself
- [ ] Forward: "---------- Forwarded message ----------" header
- [ ] Forward: includes original From, Date, Subject, To in header
- [ ] Forward: carries all original attachments
- [ ] Forward: "Fwd: " prefix added to subject if not already present
- [ ] Reply: "Re: " prefix added to subject if not already present
- [ ] Multiple Re: or Fwd: prefixes don't stack ("Re: Re: Re:" → stays "Re:")
- [ ] Inline reply: can type between quoted paragraphs
- [ ] "Pop out" reply from reading pane to full composer window

---

## 2. MESSAGE LIST — EVERY NUANCE

### Selection
- [ ] Single click selects message AND opens in reading pane
- [ ] Checkbox click selects message WITHOUT opening it (for bulk actions)
- [ ] Shift+click selects range (from last selected to clicked)
- [ ] Ctrl/⌘+click toggles individual selection (add/remove from selection)
- [ ] Ctrl/⌘+A selects all messages in current view
- [ ] Escape clears selection
- [ ] Selection count shown in toolbar: "12 selected"
- [ ] Selected messages have bg-selected background

### Bulk Actions (when multiple selected)
- [ ] Mark as read / Mark as unread
- [ ] Flag / Unflag
- [ ] Move to folder (dropdown folder picker)
- [ ] Apply label
- [ ] Delete (move to trash)
- [ ] "Select all X messages in this folder" option (beyond current page)

### Drag and Drop
- [ ] Drag message(s) to folder in sidebar to move
- [ ] Drag shows ghost with message count: "Moving 3 messages"
- [ ] Drop target (folder) highlights on drag over
- [ ] Invalid drop target (same folder) shows "not allowed" cursor
- [ ] Drag multiple selected messages at once

### Sorting
- [ ] Sort by: Date (default), From, Subject, Size, Importance, Flagged
- [ ] Click column header to sort (if table view)
- [ ] Sort direction toggle (ascending/descending)
- [ ] Sort preference persists per folder

### Thread/Conversation View
- [ ] Toggle conversation view on/off (user preference)
- [ ] Conversation: group messages by conversationId
- [ ] Conversation shows message count: "Sarah (3)"
- [ ] Expand conversation to see all messages inline
- [ ] Thread shows newest message preview
- [ ] Thread unread if ANY message in thread is unread
- [ ] Mark thread as read marks ALL messages in thread as read

### Visual Indicators
- [ ] Unread: semibold subject + coral dot (no background color change)
- [ ] Flagged: coral star icon
- [ ] Has attachment: paperclip icon
- [ ] High importance: "!" icon
- [ ] Draft: "Draft" label in red
- [ ] Replied: curved arrow icon
- [ ] Forwarded: right arrow icon
- [ ] Encrypted: lock icon (if applicable)
- [ ] From me (sent items): shows "To: recipient" instead of "From"

### Infinite Scroll
- [ ] Load 50 messages initially
- [ ] Load 50 more when scrolling near bottom (200px trigger threshold)
- [ ] Loading skeleton at bottom during fetch
- [ ] "You've reached the end" indicator when all messages loaded
- [ ] Scroll position preserved when switching back to a folder
- [ ] Pull-to-refresh on mobile (swipe down)

### Right-Click Context Menu
- [ ] Reply / Reply All / Forward
- [ ] Mark as read/unread
- [ ] Flag/Unflag
- [ ] Move to → (submenu with folders)
- [ ] Label → (submenu with labels)
- [ ] Delete
- [ ] Archive
- [ ] Open in new window
- [ ] Print
- [ ] Report spam / Report phishing

---

## 3. MESSAGE VIEWER — EVERY NUANCE

### HTML Email Rendering
- [ ] DOMPurify sanitizes ALL HTML (prevent XSS)
- [ ] External images blocked by default, "Load images" button at top
- [ ] "Always load images from this sender" option (remembers per sender)
- [ ] Inline images display correctly (match Content-ID to inline attachments)
- [ ] Email CSS scoped to viewer (doesn't leak into app UI)
- [ ] Dark mode: optionally invert email background (configurable, default off)
- [ ] Links in emails open in new tab (target="_blank", rel="noopener")
- [ ] Hover over link shows URL preview tooltip
- [ ] Phone numbers auto-detected and linkable
- [ ] Plain text emails rendered with proper line breaks and monospace font
- [ ] Extremely long emails have "Show full message" truncation (expand on click)
- [ ] Tracking pixels stripped silently
- [ ] Print-friendly view (strips app chrome, shows just the email)

### Attachments in Viewer
- [ ] Attachment bar below email header showing all attachments
- [ ] Image attachments show thumbnail preview
- [ ] Click attachment to download
- [ ] "Download all" button for multiple attachments (downloads as zip)
- [ ] "Preview" for images, PDFs, text files (inline viewer, not download)
- [ ] "Save to OneDrive" option (if Files.ReadWrite scope)
- [ ] File type icon for each attachment
- [ ] File size shown

### Thread View
- [ ] Thread messages listed chronologically (oldest first)
- [ ] Each message collapsible (click header to expand/collapse)
- [ ] Most recent message expanded by default, others collapsed
- [ ] Collapsed messages show: sender, date, first line preview
- [ ] "Expand all" / "Collapse all" toggle
- [ ] Scroll to newest message on thread open
- [ ] Thread count in header: "5 messages in this conversation"

### Actions
- [ ] Action toolbar: Reply, Reply All, Forward, Archive, Delete, Move, Flag, Label, More
- [ ] "More" dropdown: Print, View source, Report spam, Block sender, Create rule
- [ ] Actions also available via keyboard shortcuts
- [ ] Action toolbar is sticky (stays visible when scrolling long emails)
- [ ] After delete: auto-advance to next/previous message (configurable)
- [ ] After archive: auto-advance to next message

### Message Header
- [ ] From: sender name + email (click email to copy)
- [ ] To: recipient list (collapsed if > 3, "and 4 others" expand)
- [ ] CC: visible if present
- [ ] Date: relative ("2 hours ago") + absolute on hover ("Feb 21, 2026 3:42 PM")
- [ ] Subject: full subject line
- [ ] Labels/categories shown as text badges
- [ ] Priority icon if high/low importance
- [ ] Account indicator: color dot showing which account received this

---

## 4. SIDEBAR — EVERY NUANCE

### Folder Interactions
- [ ] Click folder to navigate (loads message list for that folder)
- [ ] Right-click folder for context menu: Rename, Delete, Mark all read, Add to favorites
- [ ] Drag message onto folder to move
- [ ] Drag folder onto another folder to nest (make subfolder)
- [ ] Double-click folder name to inline rename
- [ ] "New folder" button at bottom of folder section
- [ ] Nested folders collapsible with arrow toggle
- [ ] Folder collapse state persists across sessions

### Unread Counts
- [ ] Counts update in real-time (via Supabase Realtime or sync)
- [ ] Bold count number when unread > 0
- [ ] Counts reflect actual unread, not approximate
- [ ] Total unread across all folders shown on app favicon/tab
- [ ] Per-account unread count shown on account switcher

### Account Switcher
- [ ] Dropdown or pill-style selector at top of sidebar
- [ ] "All Accounts" option (unified inbox)
- [ ] Each account shows: avatar/initials, email, status dot
- [ ] Status dot colors: green (active), yellow (syncing), red (error/needs reauth)
- [ ] "Add Account" at bottom of account list
- [ ] Long-press or right-click account for: Settings, Reauth, Disconnect
- [ ] Account color stripe on left side of switcher
- [ ] Currently active account is highlighted

### Sidebar Resize & Collapse
- [ ] Drag edge to resize sidebar width (min 200px, max 320px)
- [ ] Sidebar width persists across sessions
- [ ] Collapse button: collapses to 48px icon-only view
- [ ] In collapsed state: just folder icons, hover shows tooltip with name
- [ ] Keyboard shortcut to toggle sidebar: [ or Ctrl/⌘+\

---

## 5. SEARCH — EVERY NUANCE

### Search Bar
- [ ] Always visible in top nav
- [ ] Focus with / or Ctrl/⌘+F or ⌘+K
- [ ] Placeholder: "Search emails, contacts, commands..."
- [ ] Typing shows instant dropdown with top 5 results
- [ ] Results grouped: Messages, Contacts, Commands
- [ ] Press Enter to see full results page
- [ ] Escape clears search and returns to previous view
- [ ] Search history (last 10 searches) shown when focused with empty query

### Search Operators (type in search bar)
- [ ] `from:john@example.com` — filter by sender
- [ ] `to:sarah@example.com` — filter by recipient
- [ ] `subject:budget` — search subject only
- [ ] `has:attachment` — only messages with attachments
- [ ] `is:unread` — only unread messages
- [ ] `is:flagged` — only flagged messages
- [ ] `in:inbox` or `in:sent` — specific folder
- [ ] `before:2025-01-01` and `after:2025-01-01` — date range
- [ ] `label:client` — messages with specific label
- [ ] Operators are auto-suggested as user types
- [ ] Operators render as visual chips (colored badges)

### Search Results Page
- [ ] Results show: sender, subject, matching snippet (highlighted), date
- [ ] Search terms highlighted in yellow in snippets
- [ ] Filter sidebar: Date range, Has attachment, Is unread, Folder, Account, Label
- [ ] Sort results by: Relevance (default), Date
- [ ] "Search in all accounts" or "Search in [specific account]"
- [ ] Clicking result opens message in viewer
- [ ] "No results found" state with suggestions

---

## 6. NOTIFICATIONS — EVERY NUANCE

### Browser Notifications
- [ ] Permission request on first use (not on page load — after user action)
- [ ] New email notification shows: sender, subject, preview (first 100 chars)
- [ ] Click notification opens the email in EaseMail
- [ ] Notification only for truly new emails (not old synced messages)
- [ ] No notification for emails from yourself
- [ ] No notification for spam/junk folder
- [ ] Respect "Do Not Disturb" schedule if configured
- [ ] Group notifications: "3 new emails" instead of 3 separate notifications

### In-App Notifications
- [ ] Toast notifications for actions: "Message sent", "Moved to Archive", "Draft saved"
- [ ] Toast position: bottom-center or bottom-right
- [ ] Toast auto-dismiss: 5 seconds (configurable actions stay longer)
- [ ] Toast stack: multiple toasts stack vertically (max 3 visible)
- [ ] Error toasts are red and don't auto-dismiss (require manual close)
- [ ] "Undo" button on destructive action toasts (delete, move, archive)
- [ ] Undo actually reverses the action (move back, undelete, etc.)

### Badge Counts
- [ ] Browser tab title shows unread count: "(5) EaseMail"
- [ ] Favicon dynamically shows unread badge (red dot or number)
- [ ] Update in real-time as new mail arrives

---

## 7. KEYBOARD NAVIGATION — EVERY NUANCE

### Global
- [ ] All keyboard shortcuts work regardless of focus (unless typing in input)
- [ ] Shortcuts disabled when composer is active (typing mode)
- [ ] Shortcuts disabled when any input/textarea is focused
- [ ] ? shows shortcut overlay panel
- [ ] Shortcuts are discoverable: tooltips on buttons show shortcut keys

### Message List Navigation
- [ ] j / ↓ — move to next message
- [ ] k / ↑ — move to previous message
- [ ] o / Enter — open selected message in reading pane
- [ ] x — toggle checkbox selection on current message
- [ ] * then a — select all
- [ ] * then n — deselect all
- [ ] Navigation wraps: pressing j on last message stays on last

### Message Actions (when message selected/open)
- [ ] r — reply
- [ ] a — reply all
- [ ] f — forward
- [ ] e — archive
- [ ] # — delete (move to trash)
- [ ] ! — report spam
- [ ] s — toggle star/flag
- [ ] u — toggle read/unread
- [ ] v — move to folder (opens folder picker)
- [ ] l — apply label (opens label picker)
- [ ] Shift+i — mark as read
- [ ] Shift+u — mark as unread

### Navigation
- [ ] g then i — go to inbox
- [ ] g then s — go to sent
- [ ] g then d — go to drafts
- [ ] g then t — go to trash
- [ ] / — focus search bar
- [ ] c — compose new email
- [ ] Escape — close current view, deselect, go back

---

## 8. PERFORMANCE — EVERY NUANCE

### Optimistic Updates
- [ ] Mark as read: UI updates instantly, Graph API call in background
- [ ] Flag/unflag: UI updates instantly, Graph API call in background
- [ ] Move message: message disappears from list instantly, Graph API in background
- [ ] Delete: message disappears instantly, Graph API in background
- [ ] If background API call fails: REVERT the UI change and show error toast
- [ ] Send email: "Sent" toast immediately (actual send may be in undo window)

### Caching
- [ ] Message list cached in Zustand store (persisted to sessionStorage)
- [ ] Switching folders uses cached data first, then refreshes from DB
- [ ] Message body cached after first read (don't re-fetch on return)
- [ ] Contact autocomplete results cached for 5 minutes
- [ ] Folder tree cached, refreshed on sync

### Loading States
- [ ] Skeleton screens for message list (matches exact row layout)
- [ ] Skeleton screen for message body (matches header + body layout)
- [ ] Skeleton screen for sidebar folders
- [ ] Minimum skeleton display: 100ms (prevent flash for fast loads)
- [ ] No skeleton for actions (optimistic updates handle this)
- [ ] Transition: skeleton → real content with 100ms opacity fade

### Perceived Performance
- [ ] Message list renders first 20 items immediately, rest loads on scroll
- [ ] Clicking message shows cached preview instantly, full body loads after
- [ ] Route changes are instant (client-side navigation, no full page reload)
- [ ] Folder switch: show previous message list while loading new one (swap on ready)
- [ ] Search: show results as they come in (streaming, not wait-for-all)

---

## 9. ERROR HANDLING — EVERY NUANCE

### Network Errors
- [ ] Offline detection: show banner "You're offline. Changes will sync when you reconnect."
- [ ] Offline: reading cached emails still works
- [ ] Offline: compose and save draft locally (sync when back online)
- [ ] Offline: send queued (sends when back online)
- [ ] Reconnect: auto-sync all pending changes, show "Back online" toast

### API Errors
- [ ] Graph API 401: trigger token refresh silently, retry once
- [ ] Graph API 429: show "Too many requests, retrying..." (exponential backoff)
- [ ] Graph API 500: show "Microsoft service error, retrying..." (retry 3x with backoff)
- [ ] Supabase error: show "Database error" toast with retry button
- [ ] Never show raw error messages to user (always human-readable)
- [ ] Log all errors to Sentry with context (user, account, action, payload)

### Account Errors
- [ ] Token expired: yellow banner on affected account "Account needs reconnection"
- [ ] Banner is per-account (other accounts still work)
- [ ] "Reconnect" button on banner triggers reauth flow
- [ ] After 3 failed refreshes: red banner "Account disconnected"
- [ ] Account error state shown in sidebar (red dot on account)

### Compose Errors
- [ ] Send failure: keep compose window open, show error, retry button
- [ ] Draft save failure: show "Save failed" in composer, retry after 10s
- [ ] Attachment upload failure: show error on specific attachment, retry button
- [ ] Recipient validation failure: red border on invalid chip, tooltip with error
- [ ] "Message too large" error (body + attachments exceed limit)

---

## 10. ACCESSIBILITY — EVERY NUANCE

- [ ] Full keyboard navigation (tab order is logical)
- [ ] Focus ring visible on all interactive elements (2px coral outline)
- [ ] Screen reader announcements for: new email count, action results, errors
- [ ] ARIA roles: navigation, main, complementary (sidebar), toolbar
- [ ] ARIA labels on all icon-only buttons
- [ ] Live regions for toast notifications (polite) and errors (assertive)
- [ ] Reduced motion: respect prefers-reduced-motion (no animations)
- [ ] High contrast: ensure all text passes 4.5:1 contrast ratio
- [ ] Focus trap in modals and command palette
- [ ] Skip-to-content link (hidden until focused)
- [ ] Alt text on all images (avatars: "{name}'s avatar")
- [ ] Email body viewer has role="article" with accessible name

---

## 11. EDGE CASES — EVERY NUANCE

### Empty States
- [ ] Empty inbox: friendly illustration + "You're all caught up" message
- [ ] Empty folder: "No messages in this folder"
- [ ] Empty search: "No results found for '{query}'" + suggestions
- [ ] No accounts connected: "Connect your Microsoft account to get started" + button
- [ ] Empty contacts: "No contacts yet. They'll appear as you send and receive email."
- [ ] Empty drafts: "No drafts"

### Long Content
- [ ] Subject line > 200 chars: truncated with ellipsis in list, full in viewer
- [ ] Email body > 100KB: "Show full message" link (prevents rendering lag)
- [ ] 50+ recipients: collapsed to "John, Sarah, and 48 others" with expand
- [ ] 20+ attachments: scrollable attachment bar
- [ ] Very long folder name: truncated in sidebar with tooltip on hover
- [ ] 100+ nested folders: virtual scrolling in folder tree

### Internationalization
- [ ] Unicode in subject lines renders correctly (emoji, CJK, Arabic, etc.)
- [ ] RTL text in email body renders correctly
- [ ] UTF-8 attachment filenames display correctly
- [ ] Date formatting respects user's locale setting
- [ ] Time formatting: 12hr or 24hr based on preference

### Browser Compatibility
- [ ] Works in Chrome (latest 2 versions)
- [ ] Works in Firefox (latest 2 versions)
- [ ] Works in Safari (latest 2 versions)
- [ ] Works in Edge (latest 2 versions)
- [ ] No critical feature breaks on mobile Safari (iOS)
- [ ] No critical feature breaks on mobile Chrome (Android)

---

## 12. SETTINGS — EVERY NUANCE

### Auto-save Settings
- [ ] Every settings change saves immediately (no "Save" button needed)
- [ ] Show "Saved" confirmation briefly after each change
- [ ] If save fails: revert UI to previous value, show error

### Account Settings (per account)
- [ ] Change display color (for multi-account visual distinction)
- [ ] Set as default "Send from" account
- [ ] Change sort order (drag to reorder)
- [ ] Enable/disable sync
- [ ] Force full re-sync button
- [ ] View sync health: last sync time, messages synced, errors
- [ ] Disconnect account (with confirmation)

### Notification Settings
- [ ] Master toggle: all notifications on/off
- [ ] Per-type: new email, calendar reminder, Teams message
- [ ] Per-account: enable/disable notifications per account
- [ ] Sound toggle
- [ ] Do Not Disturb schedule (e.g., 10pm - 8am)

### Security Settings
- [ ] Active sessions list (with device info)
- [ ] Revoke session button
- [ ] Two-factor authentication (via Supabase Auth)
- [ ] Connected accounts list with last activity
- [ ] Data export button (GDPR)
- [ ] Delete account button (with confirmation, 30-day grace period)

---

## 13. CALENDAR-SPECIFIC NUANCE (Agent 9)

- [ ] Double-click empty time slot to create event
- [ ] Drag to select time range to create event
- [ ] Drag event to different time to reschedule
- [ ] Drag event edge to extend/shorten duration
- [ ] Multi-day events span across day cells in month view
- [ ] Recurring event shows recurrence icon
- [ ] Edit single occurrence vs entire series dialog
- [ ] Delete single occurrence vs entire series dialog
- [ ] Time zone display for events in different time zones
- [ ] "Busy" indicators on day cells with events in month view
- [ ] Mini month picker for quick navigation
- [ ] Today button: jump back to today
- [ ] Week starts on Sunday or Monday (configurable)
- [ ] Working hours highlight (e.g., 9am-5pm) in week/day view
- [ ] All-day events in a separate top section in week/day view
- [ ] Event colors match account colors (multi-account distinction)
- [ ] "Add to calendar" from email (detect meeting invitations)
- [ ] Response buttons in email for calendar invitations: Accept/Tentative/Decline

---

## 14. TEAMS-SPECIFIC NUANCE (Agent 10)

- [ ] Typing indicator: "John is typing..."
- [ ] Read receipts: double checkmark for read messages
- [ ] @mention highlighting in chat messages
- [ ] Emoji reactions on messages (click to react)
- [ ] Rich text in chat messages (bold, italic, links, code blocks)
- [ ] File sharing in chat (attach and preview)
- [ ] Unread badge on Teams section in sidebar
- [ ] "Mark as read" on chat
- [ ] Mute chat (no notifications)
- [ ] Pin important chats to top
- [ ] Last message preview in chat list truncated
- [ ] Group chat shows participant avatars (stacked)
- [ ] "John left the chat" / "Sarah added Mike" system messages styled differently
- [ ] Presence updates in real-time (dot color changes live)

---

## 15. CONTACTS-SPECIFIC NUANCE (Agent 11)

- [ ] Contact avatar: photo if available, initials in account color if not
- [ ] Click email to compose new email to that contact
- [ ] Click phone to initiate call (tel: link on mobile)
- [ ] "Last contacted X days ago" relative time
- [ ] Contact card accessible from: email header, autocomplete, contacts page
- [ ] Merge duplicate contacts (same person, different emails)
- [ ] "Also known as" for contacts with multiple emails
- [ ] Contact notes (private to user, not synced to Graph)
- [ ] Recent emails with contact shown in contact detail
- [ ] "Send email" quick action from contact card

---

## HOW TO USE THIS FILE

For Claude Code agents: When building a component (e.g., Step 5.6 Composer),
read the relevant section(s) of this file (Section 1: Composer) and implement
ALL listed features in that step. Don't leave any for "later" — there is no later.

For Daniel at manual checkpoints: Use the relevant sections as your test script.
Walk through every checkbox. If ANY are missing, add them to BUILD-STATE.md
error log and have the agent fix them before proceeding.

For each section, the parent agent is:
- Sections 1, 4, 5, 6, 7, 8, 9, 10, 11, 12 → Agent 5 (UI Shell)
- Section 2 → Agent 5 (UI Shell, Step 5.4)
- Section 3 → Agent 5 (UI Shell, Step 5.5)
- Section 13 → Agent 9 (Calendar)
- Section 14 → Agent 10 (MS Teams)
- Section 15 → Agent 11 (Contacts Hub)
