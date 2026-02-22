# MICRO-FEATURES-V2.md — Second Pass Additions

> **Features missed in the first pass. Merge these into MICRO-FEATURES.md.**
> Sourced from: Outlook 2025 updates, Superhuman feature set, Gmail power-user patterns,
> and "what would a real user do for 8 hours" simulation.

---

## 16. MISSING COMPOSER FEATURES

### Forgotten Attachment Detection
- [ ] Scan email body for phrases like "see attached", "I've attached", "please find attached", "attachment included", "enclosed", "attaching"
- [ ] If body contains attachment phrases but no attachment added: show warning before send
- [ ] Warning is a modal: "It looks like you meant to attach a file. Send anyway?" with "Attach File" and "Send Without" buttons
- [ ] Also detect: "see the file", "here's the document", "I'm sending you", "attached is"
- [ ] Works in both new compose and replies

### Snippets / Quick Text
- [ ] Create reusable text snippets (like Superhuman's Snippets or Outlook's Quick Parts)
- [ ] Insert with keyboard shortcut: type `/` then snippet name
- [ ] Snippets support variables: `{first_name}`, `{company}`, `{today}`, `{my_name}`, `{my_email}`
- [ ] Variables auto-fill from recipient contact data when available
- [ ] Snippet management in Settings
- [ ] Snippets are tenant-scoped (shared with team) or user-private
- [ ] Snippets different from Templates: snippets are inline text blocks, templates are full emails

### Inline Image Resize
- [ ] After pasting/inserting an image inline, click to select it
- [ ] Drag handles on corners to resize
- [ ] Right-click image: "Small", "Medium", "Large", "Original size"
- [ ] Alt text editor on right-click
- [ ] "Remove image" option

### Link Preview
- [ ] When inserting a link, option to show as: "Text link", "Button", or "Card preview"
- [ ] Card preview auto-fetches Open Graph data (title, description, image) for the URL
- [ ] Can remove preview and keep just the link

### Emoji Picker
- [ ] Emoji button in toolbar or shortcut (: + start typing)
- [ ] Search emoji by name
- [ ] Frequently used section at top
- [ ] Skin tone selector
- [ ] Inserts Unicode emoji (not image)

### Smart Send Time
- [ ] "Best time to send" suggestion based on recipient's historical open patterns
- [ ] Small indicator: "Recipients are most responsive at 9:30 AM EST"
- [ ] One-click to schedule for suggested time
- [ ] Only shows if enough data exists (> 5 emails to this recipient)

### CC/BCC Smart Suggestions
- [ ] When replying to a thread with multiple participants, warn if someone was dropped
- [ ] "John was in the previous emails but isn't included. Add them?" suggestion bar
- [ ] When adding a recipient, suggest others who are frequently emailed together
- [ ] "You usually CC your-boss@company.com when emailing this client. Add?" 

### Confidential / Sensitivity Mode
- [ ] Option to mark email as "Confidential" or "Do Not Forward"
- [ ] Uses Graph API sensitivity labels
- [ ] Visual indicator in composer: "This email is marked Confidential"

---

## 17. MISSING MESSAGE LIST FEATURES

### Snooze
- [ ] Right-click or button: "Snooze" message
- [ ] Quick options: "Later today (3 PM)", "Tomorrow (8 AM)", "This weekend", "Next week", "Pick date/time"
- [ ] Snoozed messages disappear from inbox
- [ ] Return to inbox at scheduled time (appear as new, at top)
- [ ] "Snoozed" folder in sidebar shows all snoozed messages
- [ ] Can cancel snooze from Snoozed folder
- [ ] Badge count on Snoozed folder

### Pin Messages
- [ ] Pin important messages to top of folder
- [ ] Pinned section at top of message list (separator line below)
- [ ] Pin persists across sessions
- [ ] Can pin up to 10 messages per folder
- [ ] Pin via right-click, keyboard shortcut (p), or toolbar button

### Sweep / Bulk Clean
- [ ] Right-click sender → "Sweep": options for "Delete all from this sender", "Keep latest, delete rest", "Move all from this sender to..."
- [ ] "Clean up folder" action: removes redundant messages in conversations (keeps latest only)
- [ ] "Delete all older than..." option on folders

### Read Receipts / Tracking
- [ ] Request read receipt when sending (optional toggle)
- [ ] Track when recipient opens email (pixel tracking, opt-in per message)
- [ ] Show "Opened" indicator on sent messages: "Opened 3 times, last at 2:45 PM"
- [ ] Team visibility: if teammate is CC'd, they can see open status too
- [ ] Privacy: this is opt-in and clearly disclosed to users

### Follow-Up Reminders
- [ ] When sending an email, option: "Remind me if no reply in X days"
- [ ] Quick options: 1 day, 3 days, 1 week, 2 weeks, custom
- [ ] If no reply received by deadline: message returns to inbox with "No reply" flag
- [ ] Can cancel follow-up reminder
- [ ] "Waiting for reply" section in sidebar (optional)

### Message Preview Customization
- [ ] Settings: show 1 line, 2 lines, or no preview text
- [ ] Settings: show/hide sender avatar
- [ ] Settings: show/hide attachment indicator
- [ ] Settings: compact date format ("2h") vs full date ("Feb 21, 2:34 PM")

---

## 18. MISSING MESSAGE VIEWER FEATURES

### Find in Message (Ctrl/⌘+F)
- [ ] Find text within the currently open email body
- [ ] Highlight all occurrences
- [ ] Navigate between occurrences (up/down arrows or Enter/Shift+Enter)
- [ ] Show count: "3 of 7 matches"
- [ ] Close with Escape
- [ ] Does NOT trigger browser's native find (scoped to email body only)

### Quick Actions from Email Content
- [ ] Detect dates/times in email body → "Add to calendar" button
- [ ] Detect addresses → "Open in Maps" link
- [ ] Detect flight numbers → "Track flight" link
- [ ] Detect package tracking numbers → "Track package" link
- [ ] Detect phone numbers → clickable tel: link
- [ ] Detect meeting links (Zoom, Teams, Google Meet) → "Join Meeting" button

### Email Source / Headers
- [ ] "View source" shows raw email headers + HTML
- [ ] "View headers" for deliverability debugging (SPF, DKIM, DMARC results)
- [ ] Useful for your legal/insurance clients who need email forensics

### Message Translation
- [ ] "Translate" button for emails not in user's language
- [ ] Auto-detect language
- [ ] Translate to user's preferred language (configurable)
- [ ] Show original/translated toggle
- [ ] Uses Claude API for high-quality translation

### Save as PDF
- [ ] "Save as PDF" option in More menu
- [ ] Generates clean PDF of email (header + body + attachment list)
- [ ] Includes date, from, to, subject in PDF header
- [ ] Downloads to user's device

---

## 19. MISSING NAVIGATION & UX FEATURES

### Split Inbox (Superhuman-style)
- [ ] Inbox split into sections: "Important", "Other", "Newsletters"
- [ ] Sections configurable: add/remove splits
- [ ] AI-powered categorization determines which section (uses priority score)
- [ ] Custom splits: "From VIP list", "Has attachment", "From team"
- [ ] Section counts shown
- [ ] Can collapse/expand sections
- [ ] Drag message between sections to reclassify (AI learns from this)

### Focused Inbox
- [ ] Toggle: "Focused" / "Other" view (like Outlook's Focused Inbox)
- [ ] AI determines what's focused vs other
- [ ] Move message from Other to Focused to train the model
- [ ] Optional: disable entirely and see all messages

### Quick Steps / One-Click Actions
- [ ] User-defined multi-action shortcuts
- [ ] Example: "Archive + Mark Read + Label as Processed" in one click
- [ ] Configurable in Settings
- [ ] Appear as buttons in message toolbar
- [ ] Keyboard shortcut assignable per quick step

### Recent Items
- [ ] "Recent" section: last 10 viewed messages (quick return)
- [ ] "Recent contacts" in compose autocomplete (separate from frequency-ranked)
- [ ] "Recently used labels" at top of label picker
- [ ] "Recently used folders" at top of move-to picker

### Breadcrumb Navigation
- [ ] When deep in: Account → Folder → Subfolder → Message
- [ ] Breadcrumb trail at top: "Work Account > Projects > Q1 Budget > Message from John"
- [ ] Click any breadcrumb to navigate back to that level
- [ ] Back button (or Backspace key) goes up one level

---

## 20. MISSING MULTI-ACCOUNT FEATURES

### Move/Copy Between Accounts
- [ ] Move message from Account A's inbox to Account B's folder
- [ ] Copy message between accounts (keep in both)
- [ ] Warning: "This will download and re-upload the message via two different accounts"
- [ ] Preserves attachments, formatting, headers

### Per-Account Settings
- [ ] Default font/style per account (law firm account uses formal formatting)
- [ ] Default signature per account (auto-switches)
- [ ] Default reply behavior per account (reply vs reply all)
- [ ] Notification preferences per account (disable for newsletters account)
- [ ] Sync frequency per account (VIP account syncs every 15s, others every 5min)

### Account Health Dashboard
- [ ] Per-account: token status, last refresh, expiration countdown
- [ ] Per-account: sync status per folder, last sync time, items synced
- [ ] Per-account: webhook status, last notification received
- [ ] Per-account: error log (last 10 errors)
- [ ] Per-account: storage usage (cached attachments)
- [ ] Global: total API calls today, throttle status
- [ ] Accessible from Settings → Accounts → [Account] → Health

### Unified Search Scope Indicator
- [ ] When searching, clearly show: "Searching across all accounts" or "Searching in Work Account only"
- [ ] Toggle between all accounts and specific account
- [ ] Results show which account each result came from (account color dot)

---

## 21. MISSING SYNC & RELIABILITY FEATURES

### Sync Status Indicator
- [ ] Subtle indicator in bottom-left corner or top bar: "Synced 30s ago"
- [ ] During sync: "Syncing..." with subtle spinner
- [ ] On error: "Sync error" with retry button
- [ ] Per-account sync status visible in account switcher (small icon)
- [ ] Click indicator to see detailed sync health

### Conflict Resolution
- [ ] If message is modified in both EaseMail and Outlook simultaneously: last-write-wins with notification
- [ ] If draft is edited in both EaseMail and Outlook: show conflict dialog "This draft was modified in Outlook. Use Outlook version or keep yours?"
- [ ] If folder is deleted in Outlook while user is viewing it in EaseMail: redirect to inbox with toast "Folder was deleted externally"

### Retry Queue
- [ ] Failed actions (send, move, flag) queued for automatic retry
- [ ] Retry with exponential backoff (1s, 2s, 4s, 8s, max 60s)
- [ ] Max 5 retries per action
- [ ] Failed actions visible in a "Pending Actions" indicator (if any)
- [ ] User can manually retry or cancel pending actions

---

## 22. MISSING AI FEATURES (Superhuman-inspired)

### Auto Summarize
- [ ] One-line summary visible below subject in message list (without opening)
- [ ] Summary updates as new messages arrive in thread
- [ ] Summary style: factual, one sentence, action-oriented
- [ ] Example: "John approved the budget but requested changes to Q3 projections"
- [ ] Toggle on/off per user preference
- [ ] Only generated for messages > 100 words or threads > 3 messages

### Ask AI (Chat with your inbox)
- [ ] Sidebar chat: "Find the email where John mentioned the budget deadline"
- [ ] "Summarize all emails from Acme Corp this month"
- [ ] "Draft a follow-up to Sarah about the contract we discussed last Tuesday"
- [ ] AI has context of your email history (searches locally first, then uses Claude)
- [ ] Results link to specific messages

### AI-Powered Labels (Auto Labels)
- [ ] AI automatically labels every incoming email: "Action needed", "FYI", "Waiting on", "Newsletter", "Marketing", "Cold pitch"
- [ ] Labels visible in message list as subtle text tags
- [ ] User can correct labels (AI learns from corrections)
- [ ] Custom label rules via natural language: "Label emails about invoices from clients as 'Billing'"

### Writing Tone Matching
- [ ] AI analyzes your past emails to learn your writing style
- [ ] Drafts match your tone per recipient (more formal with CEO, casual with team)
- [ ] "Match my tone" toggle (default on)
- [ ] Can override per-draft: "Write this one more formally"

### Auto Follow-Up Drafts
- [ ] If you sent an email 3+ days ago with no reply, AI drafts a follow-up
- [ ] Draft appears in inbox with "Auto Draft" badge
- [ ] User reviews, edits, and sends (never auto-sends without approval)
- [ ] Configurable: enable/disable, days before follow-up, which accounts

---

## 23. MISSING MOBILE-SPECIFIC FEATURES

- [ ] Swipe right on message: Archive (configurable)
- [ ] Swipe left on message: Delete (configurable)
- [ ] Swipe actions configurable: Flag, Mark read, Snooze, Move
- [ ] Pull-to-refresh
- [ ] Long-press message for context menu
- [ ] Bottom navigation bar: Inbox, Search, Compose, Calendar, Settings
- [ ] Compose button: floating action button (FAB) bottom-right
- [ ] Message viewer: swipe left/right to navigate between messages
- [ ] Dark mode follows system
- [ ] Haptic feedback on actions
- [ ] Badge count on app icon

---

## 24. MISSING SECURITY & COMPLIANCE FEATURES

### Phishing / Spam Detection
- [ ] Visual warning banner on suspected phishing emails: "This email may be a phishing attempt"
- [ ] Warning triggers: sender domain doesn't match display name, suspicious links, urgency language
- [ ] "Report phishing" button sends to Microsoft (via Graph)
- [ ] "Block sender" adds to blocked sender list
- [ ] Blocked sender list manageable in Settings

### Email Encryption Indicators
- [ ] Show lock icon on encrypted messages
- [ ] "Sent via TLS" indicator for transport encryption
- [ ] If S/MIME or message encryption detected, show appropriate badge

### Audit Trail (for legal/compliance clients)
- [ ] Log all email actions: read, send, delete, move, forward
- [ ] Log includes: timestamp, user, account, message ID, action
- [ ] Exportable as CSV for compliance
- [ ] Retention policy configurable by tenant admin
- [ ] Accessible from Settings → Security → Audit Log

### Data Retention Policy
- [ ] Tenant admin can set message retention: "Keep messages for X months then auto-delete"
- [ ] Legal hold: prevent deletion of specific messages/conversations
- [ ] GDPR data export: export all user data as JSON/ZIP
- [ ] GDPR deletion: remove all user data (with 30-day grace period)

---

## 25. MISSING ONBOARDING FEATURES

### First-Run Experience
- [ ] Step 1: "Connect your Microsoft account" (one-click OAuth)
- [ ] Step 2: "Choose your look" — theme, density, reading pane position
- [ ] Step 3: "Import your preferences" — keyboard shortcut style (Gmail/Outlook/Custom)
- [ ] Step 4: "Set up your signature" — rich text editor
- [ ] Step 5: "Quick tour" — highlight overlay pointing to key UI areas
- [ ] Step 6: "You're ready!" — go to inbox
- [ ] Can skip any step
- [ ] Can redo onboarding from Settings

### Feature Discovery
- [ ] Subtle tooltips on first use of features: "Tip: Press / for search"
- [ ] "What's new" changelog overlay on version updates
- [ ] Keyboard shortcut hints on hover (button tooltips show shortcut key)
- [ ] Empty state messages that teach: "Drag messages here to organize" on empty custom folders

### Help & Support
- [ ] ? icon in sidebar opens help panel
- [ ] Searchable help articles (embedded, not external link)
- [ ] "Send feedback" link → creates email to support@easemail.app
- [ ] Keyboard shortcut cheatsheet (printable PDF)
- [ ] Status page link showing service health

---

## 26. MISSING QUALITY OF LIFE FEATURES

### Print
- [ ] Print single message (strips app chrome, clean layout)
- [ ] Print thread (all messages in conversation, chronological)
- [ ] Print includes: header info (from, to, date, subject), body, attachment names
- [ ] Print preview before sending to printer
- [ ] Keyboard shortcut: Ctrl/⌘+P

### Quick Reply (without opening full composer)
- [ ] At bottom of reading pane: inline reply text box
- [ ] Type quick response and hit Enter/Send
- [ ] Uses same account as the email was received on
- [ ] "Expand" button to open full composer with CC/BCC, formatting, etc.
- [ ] Inline reply auto-saves as draft

### Message Timestamps
- [ ] Relative time by default: "2 min ago", "3 hours ago", "Yesterday", "Feb 14"
- [ ] Hover shows absolute: "Saturday, February 21, 2026 at 3:42:18 PM CST"
- [ ] Messages older than 7 days show date, older than 1 year show date + year
- [ ] Sent items show "Sent at..." not "Received at..."

### Folder Colors
- [ ] Assign custom colors to folders (Outlook 2025 feature)
- [ ] Color appears as icon color in sidebar
- [ ] Helps with visual folder identification
- [ ] 12-color palette to choose from

### Notification Sound Customization
- [ ] Choose from 5-6 notification sounds
- [ ] Different sound for: new email, calendar reminder, Teams message
- [ ] Volume control
- [ ] "None" option per category

### Data Usage / Storage Info
- [ ] Settings → Storage: show cached data size per account
- [ ] "Clear cache" button per account
- [ ] "Clear all cached data" button
- [ ] Show Supabase storage usage (attachments, avatars)
