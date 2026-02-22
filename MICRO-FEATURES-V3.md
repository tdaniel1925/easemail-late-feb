# MICRO-FEATURES-V3.md — Third Pass: Contacts, Settings, Teams, Calendar, CRM, Admin

> **Covers every area OUTSIDE of core email that was under-specified.**
> Merge into the .forge package alongside V1 and V2.

---

## 27. CONTACTS — FULL NUANCE

### Contact List View
- [ ] Alphabetical index strip on right edge (A-Z, click to jump)
- [ ] Letter headers between groups ("A", "B", "C"...)
- [ ] Contact avatar: photo if available, colored initials if not (uses account color or contact-specific color)
- [ ] Avatar initials: first letter of first name + first letter of last name
- [ ] If only email known (no name): show first 2 letters of email username
- [ ] Contact row shows: avatar, name, email, company, last contacted date
- [ ] Hover reveals quick actions: email, chat, call, more (...)
- [ ] Select multiple contacts with checkboxes for bulk actions
- [ ] Bulk actions: add to group, export, delete, merge

### Contact Detail Panel
- [ ] Left column: list, Right column: detail (same pattern as email)
- [ ] Header: large avatar (64px), full name (editable inline), job title, company
- [ ] Presence indicator if MS Teams connected (green/yellow/red/gray dot)
- [ ] "Last contacted: 3 days ago" with relative timestamp
- [ ] Quick action bar: "Send Email", "Start Chat", "Schedule Meeting", "Call"
- [ ] Send Email opens composer pre-filled with To: this contact
- [ ] Start Chat opens Teams new chat pre-filled with this contact
- [ ] Schedule Meeting opens calendar event pre-filled with this attendee
- [ ] Call opens tel: link (mobile) or copies phone number (desktop)

### Contact Detail Tabs
- [ ] **Overview tab:** email(s), phone(s), company, title, address, birthday, notes
- [ ] Multiple emails supported: "Work: john@company.com", "Personal: john@gmail.com"
- [ ] Multiple phones: "Mobile: +1...", "Office: +1..."
- [ ] **Activity tab:** timeline of all interactions (emails sent/received, meetings, chats)
- [ ] Activity items are clickable (opens the email/event/chat)
- [ ] Filter activity by type: emails, meetings, chats, notes
- [ ] "Load more" pagination on activity (show last 20 by default)
- [ ] **Files tab:** all attachments sent to/from this contact
- [ ] Files sorted by date, filterable by type (PDF, images, docs)
- [ ] Click to download, preview for images/PDFs
- [ ] **CRM tab:** (if CRM enabled) linked deals, company, tags, custom fields
- [ ] **Notes tab:** private notes about this contact (rich text, only visible to you)

### Contact Editing
- [ ] Click any field to edit inline (not a separate edit mode)
- [ ] Auto-save on blur (leave field)
- [ ] "Saving..." indicator during save
- [ ] Add custom fields: "Custom: LinkedIn URL", "Custom: Account Number"
- [ ] Delete contact with confirmation: "This will remove the contact from EaseMail. It will NOT delete them from Outlook."
- [ ] "Edit in Outlook" link opens the Graph web interface for advanced editing

### Contact Merge / Deduplication
- [ ] Auto-detect potential duplicates: same name + different email, same email + different name
- [ ] "Possible duplicates" section in Contacts page
- [ ] Merge wizard: select primary record, preview merged result, confirm
- [ ] Merge combines: all emails, all phones, all interaction history
- [ ] Merge is reversible for 30 days ("Undo merge" in activity log)
- [ ] Manual merge: select 2+ contacts → "Merge contacts" button

### Contact Search
- [ ] Search bar at top of contacts page
- [ ] Searches: name, email, company, phone, notes, tags
- [ ] Instant results as you type (debounced 200ms)
- [ ] Highlight matching text in results
- [ ] "No results" state with suggestion: "Try searching by email or company name"
- [ ] Filter toggles: "Has email", "Has phone", "Has company", "Recently contacted"

### Contact Import
- [ ] "Import" button in contacts toolbar
- [ ] Support: CSV, vCard (.vcf), Outlook export (.csv)
- [ ] CSV import wizard:
  - [ ] File upload (drag-and-drop or file picker)
  - [ ] Column mapping screen: "Match your columns to EaseMail fields"
  - [ ] Auto-detect common column names: "Name", "Email", "Phone", "Company"
  - [ ] Manual mapping for unrecognized columns
  - [ ] Preview first 5 rows
  - [ ] Duplicate handling: "Skip duplicates", "Update existing", "Create duplicates"
  - [ ] Import progress bar
  - [ ] Summary: "Imported 87 contacts, skipped 3 duplicates, 2 errors"
  - [ ] Error details downloadable as CSV
- [ ] vCard import: drag .vcf file onto contacts page
- [ ] vCard supports single and multi-contact files

### Contact Export
- [ ] "Export" button in contacts toolbar
- [ ] Export selected contacts or all contacts
- [ ] Export formats: CSV, vCard (.vcf)
- [ ] CSV includes all fields including custom fields
- [ ] Option: "Include interaction history" (adds columns for email count, last contacted)

### Contact Suggestions
- [ ] "Suggested contacts" section: people you email frequently but haven't added as contacts
- [ ] Source: inferred from email headers (To/From/CC that aren't in your contacts)
- [ ] "Add" button on each suggestion → creates contact with name + email pre-filled
- [ ] "Dismiss" button → hides suggestion permanently
- [ ] Suggestions refresh weekly

---

## 28. SETTINGS — FULL NUANCE

### Settings Navigation
- [ ] Left sidebar with setting categories, right panel with settings content
- [ ] Categories: General, Accounts, Appearance, Signatures, Templates, Labels, Rules, Notifications, Keyboard Shortcuts, Team, CRM, Security, Billing, About
- [ ] Deep link URLs: /settings/general, /settings/accounts, etc.
- [ ] Settings search bar at top: type to filter settings across all categories
- [ ] Each setting has descriptive subtitle explaining what it does
- [ ] Settings auto-save immediately on change (no "Save" button)
- [ ] Brief "Saved ✓" confirmation on each change (subtle, not obtrusive)

### General Settings
- [ ] **Language:** dropdown (English only at launch, structure for i18n)
- [ ] **Timezone:** dropdown with search, auto-detected on first use
- [ ] **Date format:** MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- [ ] **Time format:** 12-hour, 24-hour
- [ ] **Week starts on:** Sunday, Monday
- [ ] **Default send behavior:** Send immediately, 10-second undo, 30-second undo
- [ ] **Auto-advance after action:** Next message, Previous message, Return to list
- [ ] **Conversation view:** on/off toggle
- [ ] **Message preview lines:** 0, 1, 2 lines
- [ ] **Confirm before delete:** on/off toggle
- [ ] **Desktop notifications:** on/off toggle
- [ ] **Notification sound:** on/off toggle + sound picker

### Appearance Settings
- [ ] **Theme:** Light, Dark, System (follows OS)
- [ ] Live preview as you toggle between themes
- [ ] **Density:** Compact (68px rows), Comfortable (84px rows), Spacious (96px rows)
- [ ] Live preview of density change
- [ ] **Reading pane position:** Right, Bottom, Off
- [ ] Visual diagram showing each option
- [ ] **Sidebar width:** slider (200px - 320px)
- [ ] **Font size:** Small (12px), Medium (13px), Large (14px)
- [ ] Applies to message list and viewer, NOT to email body rendering
- [ ] **Show sender avatar:** on/off toggle
- [ ] **Accent color:** color picker (coral default, allow customization)

### Account Settings (per account)
- [ ] List of all connected accounts with status dot
- [ ] Click account to expand settings panel
- [ ] **Display name override:** change how this account appears in sidebar (e.g., "Work" instead of full email)
- [ ] **Account color:** color picker (for multi-account visual distinction)
- [ ] **Default signature:** dropdown of signatures for this account
- [ ] **Default reply behavior:** Reply or Reply All
- [ ] **Send as default:** toggle "Use this account for new emails"
- [ ] **Sync settings:**
  - [ ] Auto-sync: on/off
  - [ ] Sync frequency: Every 15s, 30s, 1min, 5min
  - [ ] Sync window: Last 7 days, 30 days, 90 days, All
  - [ ] Force full re-sync button
- [ ] **Health status:** expandable panel
  - [ ] Token status: "Valid, expires in 47 minutes"
  - [ ] Last sync: "2 minutes ago"
  - [ ] Messages synced: "12,847"
  - [ ] Folders synced: "23"
  - [ ] Webhook status: "Active, renews in 2 days"
  - [ ] Error log: last 5 errors with timestamps
- [ ] **Disconnect account:** red button with confirmation modal
  - [ ] "This will remove all synced data for this account. Your emails in Microsoft will NOT be affected."
  - [ ] Type account email to confirm (prevent accidental disconnect)

### Signature Settings
- [ ] List of all signatures with preview
- [ ] "New signature" button
- [ ] Rich text editor for signature body (Tiptap, same as composer)
- [ ] Signature name (for identification, not displayed in email)
- [ ] "Set as default for:" dropdown (All accounts, specific account, or none)
- [ ] Image upload for signature logos
- [ ] Variables supported: `{name}`, `{email}`, `{phone}`, `{title}`, `{company}`
- [ ] Preview: shows rendered signature
- [ ] Reorder signatures (drag-and-drop)
- [ ] Delete signature with confirmation
- [ ] "Insert before quoted text" toggle (position in replies)

### Template Settings
- [ ] List of all templates grouped by category
- [ ] Template editor: name, category, subject line, body (rich text), variables
- [ ] Variables: `{recipient_name}`, `{recipient_company}`, `{today}`, `{my_name}`, custom vars
- [ ] Preview with sample data
- [ ] "Shared with team" toggle (vs private)
- [ ] Usage count shown per template
- [ ] Duplicate template button
- [ ] Import/export templates as JSON

### Label Settings
- [ ] List of all labels with color swatches
- [ ] "New label" button: name + color picker
- [ ] 12-16 color options (pre-selected palette matching design system)
- [ ] Edit label name/color inline
- [ ] Delete label: "This will remove the label from all messages. The messages will NOT be deleted."
- [ ] Reorder labels (drag-and-drop, affects display order in label picker)
- [ ] "Nest label" option (sub-labels): Clients > Acme Corp, Clients > Widget Inc

### Rule Settings
- [ ] List of all mail rules with on/off toggle per rule
- [ ] "New rule" button opens rule builder
- [ ] Rule builder:
  - [ ] Name field
  - [ ] Conditions section: add condition rows
    - [ ] Field: From, To, CC, Subject, Body, Has Attachment, Importance, Size
    - [ ] Operator: Contains, Equals, Starts with, Ends with, Does not contain
    - [ ] Value: text input
    - [ ] AND/OR logic between conditions
  - [ ] Actions section: add action rows
    - [ ] Move to folder (folder picker)
    - [ ] Apply label (label picker)
    - [ ] Mark as read
    - [ ] Flag
    - [ ] Forward to (email input)
    - [ ] Delete
    - [ ] Auto-reply with template (template picker)
  - [ ] "Stop processing subsequent rules" toggle
  - [ ] Priority: drag to reorder (higher = runs first)
- [ ] "Run rule now" button: applies rule to existing messages in a folder
  - [ ] Progress indicator: "Processing... 245 of 1,203 messages"
  - [ ] Summary: "Rule applied to 87 messages"
- [ ] "Sync to Outlook" toggle: creates corresponding rule in Graph API
- [ ] Import rules from Outlook (if Graph API supports)

### Notification Settings
- [ ] **Master toggle:** All notifications on/off
- [ ] **Per category:**
  - [ ] New email: on/off
  - [ ] Calendar reminder: on/off
  - [ ] Teams message: on/off
  - [ ] Shared inbox assignment: on/off
  - [ ] Follow-up reminder: on/off
  - [ ] System alerts (sync errors, token expiry): always on (can't disable)
- [ ] **Per account:** toggle notifications on/off per connected account
- [ ] **Sound:**
  - [ ] Master sound toggle
  - [ ] Sound picker: 6 options (subtle chime, pop, ding, etc.)
  - [ ] Play preview button next to each sound
  - [ ] Different sound per notification type (optional, default same)
- [ ] **Do Not Disturb:**
  - [ ] Schedule: start time, end time (e.g., 10:00 PM - 8:00 AM)
  - [ ] Days: checkboxes for each day of week
  - [ ] "Enable DND now" quick toggle (overrides schedule)
  - [ ] During DND: notifications queued, delivered when DND ends
  - [ ] Exception: urgent/high-importance emails still notify during DND (configurable)

### Keyboard Shortcut Settings
- [ ] Full list of all shortcuts organized by category
- [ ] Current binding shown next to each action
- [ ] Click to customize binding (record new key combination)
- [ ] Conflict detection: "This shortcut is already assigned to [action]. Override?"
- [ ] Preset profiles: "Gmail style", "Outlook style", "Superhuman style", "Custom"
- [ ] "Reset to defaults" button
- [ ] Printable cheatsheet: "Download PDF" button
- [ ] "Enable keyboard shortcuts" master toggle

---

## 29. MS TEAMS — FULL NUANCE

### Teams Sidebar Section
- [ ] "Teams" section in sidebar below email folders (collapsible)
- [ ] Section header: "TEAMS" with unread badge count
- [ ] List of recent chats sorted by last message time
- [ ] Each chat shows: avatar (or group avatar stack), name/topic, preview, time, unread dot
- [ ] Unread chats: bold name + coral dot (same pattern as email)
- [ ] "New Chat" button at top of Teams section
- [ ] "View all chats" link to full Teams page

### Chat View
- [ ] Selecting a chat replaces reading pane with chat view (OR opens in a panel)
- [ ] Chat header: participant name(s), presence dot, "Video Call" and "Audio Call" buttons
- [ ] Group chat header: topic/title (editable), participant count, "See members" expand
- [ ] Message list: chronological, newest at bottom
- [ ] Auto-scroll to bottom on open and new messages
- [ ] Scroll up to load older messages (infinite scroll upward)
- [ ] Date separators: "Today", "Yesterday", "February 14, 2026"
- [ ] "New messages" divider line when returning to chat with unread

### Chat Message Display
- [ ] Avatar (32px) + name + timestamp per message
- [ ] Consecutive messages from same sender: collapse (hide avatar/name, show only timestamp on hover)
- [ ] Message body: supports rich text (bold, italic, code, links, lists)
- [ ] Code blocks: syntax-highlighted, monospace, dark background
- [ ] @mentions: highlighted with user's name as clickable chip
- [ ] Links: clickable, with URL preview card if Open Graph data available
- [ ] Images: inline display, click to full-screen lightbox
- [ ] File attachments: card with file icon, name, size, "Download" button
- [ ] Reactions row below message: emoji reaction bubbles with count
- [ ] Hover over message: action bar appears (React, Reply, More)
- [ ] "More" menu: Copy text, Pin message, Forward, Delete (own messages only)

### Chat Message Compose
- [ ] Text input at bottom of chat (auto-growing textarea)
- [ ] Rich text formatting toolbar (toggle): bold, italic, code, link, bulleted list, numbered list
- [ ] @mention: type @ then start typing name → autocomplete dropdown
- [ ] Emoji: emoji button or `: ` shortcut
- [ ] Attach file: paperclip button or drag-and-drop
- [ ] GIF picker (optional, via Giphy or Tenor API if desired)
- [ ] Send: Enter key sends, Shift+Enter for new line
- [ ] Configurable: Enter sends vs Ctrl+Enter sends (in settings)
- [ ] Typing indicator: "John is typing..." shown above input
- [ ] "Edit" last sent message: press Up arrow on empty input to edit
- [ ] "Delete" message: right-click → delete (removes for everyone)

### New Chat
- [ ] "New Chat" opens dialog: search for person(s) by name/email
- [ ] Autocomplete from contacts (same as email autocomplete, with presence)
- [ ] Select single person: 1:1 chat
- [ ] Select multiple people: group chat, prompt for topic name
- [ ] If chat already exists with that person: navigate to existing chat
- [ ] Start typing immediately after selecting recipient

### Teams & Channels View
- [ ] Separate page or sidebar section for Teams (organizational teams, not 1:1 chats)
- [ ] List of joined Teams with expand arrow
- [ ] Expand Team: shows channels
- [ ] Channel shows: name, unread badge
- [ ] Click channel: shows channel messages (same UI as chat but with thread support)
- [ ] Channel messages support threaded replies (click "Reply" to expand thread inline)
- [ ] "General" channel always at top
- [ ] Favorite channels: star to pin to top

### Presence Display Rules
- [ ] 🟢 Available: solid green dot
- [ ] 🟡 Away/Be Right Back: solid yellow dot
- [ ] 🔴 Busy/In a Call/In a Meeting/Presenting: solid red dot
- [ ] 🟣 Do Not Disturb: solid red dot with horizontal line
- [ ] ⚫ Offline/Unknown: gray dot (hollow circle)
- [ ] Status message: shown on hover tooltip ("In a meeting until 3 PM")
- [ ] Presence refreshes every 60 seconds for visible contacts
- [ ] Presence shown in: chat list, contact cards, email autocomplete, message headers, calendar attendee lists

### Teams Notifications
- [ ] New chat message: toast notification with sender + preview
- [ ] @mention in channel: toast notification
- [ ] Click notification: navigates to the chat/channel
- [ ] Badge count on Teams sidebar section header
- [ ] Muted chats: no notifications, no unread count
- [ ] Mute toggle: right-click chat → "Mute" / "Unmute"

### Teams Meeting Integration
- [ ] Calendar events with Teams meeting show "Join" button
- [ ] "Join" button visible: 5 minutes before meeting start until meeting end
- [ ] Join opens Teams meeting in browser (link to teams.microsoft.com)
- [ ] Meeting chat accessible from event detail view (synced from Teams)
- [ ] "Create Teams Meeting" toggle when creating calendar events
- [ ] When toggled on: Graph API creates online meeting and embeds join URL

---

## 30. CALENDAR — FULL NUANCE

### Calendar Navigation
- [ ] Tab/section in main nav: "Calendar" (📅 icon)
- [ ] View switcher: Day, Week, Work Week, Month (segmented button)
- [ ] "Today" button: immediately scrolls/navigates to current date
- [ ] Date navigation: left/right arrows for prev/next period
- [ ] Current date header: "February 2026" or "Week of Feb 16-22, 2026"
- [ ] Mini calendar in sidebar (month grid, click any date to navigate)
- [ ] Mini calendar highlights: today (coral circle), selected date (coral fill), days with events (dot below)

### Day View
- [ ] Time column on left: 12 AM - 11 PM (24 slots)
- [ ] Default visible range: 7 AM - 7 PM (scrollable to see full 24 hours)
- [ ] Working hours highlighted (configurable, default 9 AM - 5 PM): lighter background
- [ ] Non-working hours: slightly dimmed
- [ ] Current time: horizontal coral line that moves in real-time
- [ ] Events as blocks: positioned by start/end time, width fills column
- [ ] Overlapping events: side-by-side columns (up to 4 overlap, then "+X more" overflow)
- [ ] All-day events: horizontal bars in header section above time grid
- [ ] Click empty time slot: quick event creation (pre-fills time)
- [ ] Drag on empty time slots: select duration → event creation
- [ ] 15-minute grid snap (configurable: 5, 10, 15, 30, 60 min)

### Week View
- [ ] 7 columns (or 5 for Work Week), each one a day
- [ ] Same time grid as day view, but narrower columns
- [ ] Column headers: "Mon 16", "Tue 17", etc. (today header highlighted in coral)
- [ ] Events color-coded by account (uses connected_account.color)
- [ ] Click event to see detail popup
- [ ] Double-click event to edit
- [ ] Drag event to different time/day to reschedule
- [ ] Drag bottom edge of event to change duration
- [ ] "New event" by clicking empty slot or ⌘+N keyboard shortcut

### Month View
- [ ] Traditional calendar grid: 6 rows × 7 columns
- [ ] Day cells show: date number, up to 3 event bars
- [ ] Event bars: colored by account, show subject text (truncated)
- [ ] Overflow: "+2 more" link opens day detail popover
- [ ] Today's cell: coral number circle
- [ ] Days outside current month: dimmed
- [ ] Click day number: navigates to Day View for that date
- [ ] Click empty area in cell: create new event on that date
- [ ] Drag event between days: reschedule (changes date, keeps time)

### Event Detail Popup
- [ ] Appears on single click of event (positioned near event, not modal)
- [ ] Shows: title, time (start-end with duration), location, organizer
- [ ] Online meeting: "Join Meeting" button (prominent, coral)
- [ ] Attendees: avatar row (first 5), "+X more" expand
- [ ] Response status: "Accepted ✓" / "Tentative ?" / "Declined ✗"
- [ ] Quick actions: "Edit", "Delete", "RSVP" (Accept/Tentative/Decline)
- [ ] "Open full details" link → expands to full edit view
- [ ] Click outside popup to dismiss

### Event Create/Edit Form
- [ ] **Title:** text input (large, prominent)
- [ ] **Date/Time:** date picker + time picker (start and end)
  - [ ] Date picker: calendar dropdown, today button
  - [ ] Time picker: dropdown with 15-min increments, or type custom time
  - [ ] All-day toggle: hides time pickers, shows date range
  - [ ] Duration shown: "1 hour", "30 minutes" (auto-calculated)
- [ ] **Location:** text input with autocomplete (Google Places or manual text)
- [ ] **Online meeting:** toggle "Add Teams meeting" → generates join URL
- [ ] **Calendar selector:** dropdown of calendars from all accounts (shows account + calendar name)
- [ ] **Attendees:**
  - [ ] Autocomplete from contacts (with presence indicators)
  - [ ] Required vs Optional toggle per attendee
  - [ ] Show free/busy status next to each attendee (fetched from Graph)
  - [ ] Scheduling assistant: visual time grid showing everyone's availability
  - [ ] "Find a time" button: auto-suggest next available slot for all attendees
- [ ] **Recurrence:** dropdown
  - [ ] Options: None, Daily, Weekly, Monthly, Yearly, Custom
  - [ ] Custom: every X days/weeks/months, on specific days, end after X occurrences or by date
- [ ] **Reminder:** dropdown: None, 0 min, 5 min, 10 min, 15 min, 30 min, 1 hr, 1 day, 1 week
- [ ] **Description:** rich text editor (same Tiptap as email composer)
- [ ] **Show as:** Free, Tentative, Busy, Out of Office, Working Elsewhere
- [ ] **Sensitivity:** Normal, Personal, Private, Confidential
- [ ] **Category/Color:** select category (maps to Outlook categories)
- [ ] **Attachments:** file upload for event attachments
- [ ] Save button: "Save" (own event) or "Send invitations" (event with attendees)
- [ ] Cancel button: "Discard changes?" confirmation if edits made

### Recurring Event Handling
- [ ] Editing recurring event: "Edit this event" / "Edit all events in series" / "Edit this and following" dialog
- [ ] Deleting recurring event: same three options
- [ ] Exceptions shown differently: italic text or special icon on modified occurrences
- [ ] Master event shows recurrence pattern: "Every Tuesday, until March 2026"

### Calendar Account Management
- [ ] "My Calendars" section in calendar sidebar: list of calendars per account
- [ ] Checkbox next to each calendar: toggle visibility
- [ ] Calendar color dot: matches account color (or custom per calendar)
- [ ] "Other Calendars" section: shared/subscribed calendars
- [ ] "Add calendar" button: subscribe to shared calendar
- [ ] Right-click calendar: rename, change color, hide, properties

### Calendar Integration with Email
- [ ] Email containing meeting invitation: "Accept / Tentative / Decline" buttons in email viewer
- [ ] Clicking Accept: sends response via Graph, updates calendar event
- [ ] Calendar event summary shown inline in email (date, time, location, attendees)
- [ ] "Add to calendar" button when email body contains detected date/time
- [ ] Email sidebar widget: "Today's agenda" showing next 3 events

---

## 31. CRM — FULL NUANCE

### CRM Dashboard
- [ ] Overview page: total contacts, active deals, deals by stage, revenue forecast
- [ ] Pipeline visualization: horizontal stage bars (lead → qualified → proposal → negotiation → won/lost)
- [ ] Click stage to see deals in that stage
- [ ] "Recent activity" feed: last 10 interactions across all contacts
- [ ] Quick stats: "12 new contacts this month", "3 deals closing this week"

### CRM Contact View (extends Contact Detail)
- [ ] CRM tab on contact detail shows: linked company, deals, tags, custom fields
- [ ] "Link to company" dropdown (search/create companies)
- [ ] "Create deal" button → opens deal creation pre-linked to this contact
- [ ] Tags: clickable chips, click to filter contacts by tag
- [ ] "Add tag" inline: type tag name, autocomplete from existing tags, Enter to add
- [ ] Custom fields: key-value pairs, "Add field" button
- [ ] Common custom fields suggested: "Account Number", "Industry", "LinkedIn", "Birthday"

### Deal Management
- [ ] Deal list view: table with columns: Title, Contact, Company, Value, Stage, Close Date, Owner
- [ ] Sortable by any column
- [ ] Filterable by: stage, owner, date range, value range
- [ ] Deal detail view: title, value, probability, expected close, stage
- [ ] Stage progression: visual pipeline with current stage highlighted
- [ ] Click stage to advance deal (with confirmation)
- [ ] Activity timeline on deal: all emails, notes, calls, meetings related to this deal
- [ ] "Link email" action in email viewer → link message to a deal
- [ ] Kanban view: drag deals between stage columns
- [ ] Deal won/lost: prompt for reason and notes

### Company Management
- [ ] Company list: name, domain, contact count, deal count
- [ ] Company detail: name, domain, industry, size, website, address, notes
- [ ] "Contacts at this company" list (auto-linked by email domain)
- [ ] "Deals with this company" list
- [ ] Company logo: auto-fetched from domain (using clearbit logo API or similar)
- [ ] "View website" link opens in new tab

### CRM Activity Logging
- [ ] Auto-log: every email sent to/from a CRM contact creates an activity
- [ ] Auto-log: every meeting with a CRM contact creates an activity
- [ ] Manual log: "Log call", "Log note", "Log meeting" buttons on contact detail
- [ ] Call log: date, duration, summary notes
- [ ] Note: rich text, private vs shared toggle
- [ ] Activities sortable by date, filterable by type
- [ ] Activity shown on contact detail, deal detail, and company detail

### CRM Sidebar in Email View
- [ ] When viewing an email, right sidebar shows CRM context for the sender
- [ ] Sidebar shows: contact card (name, company, title), recent deals, recent activity
- [ ] "Not a CRM contact yet — Add?" prompt for unknown senders
- [ ] Click to expand to full contact detail
- [ ] Sidebar collapsible to save horizontal space
- [ ] Sidebar only appears if CRM module is enabled (Team/Enterprise plan)

---

## 32. WHITE-LABEL / BRANDING — FULL NUANCE

### Branding Settings Page
- [ ] Live preview panel on right showing changes in real-time
- [ ] **Logo upload:** drag-and-drop or file picker, max 2MB, PNG/SVG/JPG
  - [ ] Light mode logo
  - [ ] Dark mode logo (separate upload, falls back to light logo)
  - [ ] Logo dimensions: auto-scaled to max 180px × 48px
  - [ ] Preview in sidebar context
- [ ] **Favicon:** upload, auto-generate from logo if not provided, 32×32 or 64×64
- [ ] **Colors:**
  - [ ] Primary color: color picker with hex input
  - [ ] Secondary color: color picker
  - [ ] Accent color: color picker
  - [ ] Auto-generate dark mode variants from selected colors
  - [ ] Preview: "Your app will look like this" thumbnail
  - [ ] "Reset to default" button per color
- [ ] **Login page:**
  - [ ] Background image upload (max 5MB, recommended 1920×1080)
  - [ ] Tagline text input (displayed on login page)
  - [ ] "Preview login page" button
- [ ] **Email branding:**
  - [ ] "From name" for system emails (e.g., "Acme Law Firm" instead of "EaseMail")
  - [ ] Email footer HTML editor (added to all system emails)
  - [ ] Footer preview

### Custom Domain
- [ ] Input field: "Custom domain" (e.g., mail.acmelaw.com)
- [ ] Instructions panel: "Add this CNAME record to your DNS"
  - [ ] Record type: CNAME
  - [ ] Host: mail (or whatever subdomain)
  - [ ] Value: {tenant-slug}.easemail.app
  - [ ] TTL: 3600
- [ ] "Verify domain" button: checks DNS resolution
- [ ] Status: "Pending verification", "Verified ✓", "Verification failed"
- [ ] Auto-retry verification every hour for 48 hours
- [ ] SSL certificate auto-provisioned via Let's Encrypt after verification
- [ ] After verification: app accessible at custom domain

### Remove EaseMail Branding
- [ ] Enterprise plan toggle: "Hide EaseMail branding"
- [ ] Removes: "Powered by EaseMail" from footer, login page, system emails
- [ ] EaseMail logo in sidebar replaced by tenant logo
- [ ] Favicon replaced by tenant favicon
- [ ] Tab title: "{Tenant Name}" instead of "EaseMail"

---

## 33. ADMIN & TEAM MANAGEMENT — FULL NUANCE

### Team Settings (sidebar: Settings → Team)
- [ ] **Members list:** table with name, email, role, status, last active, joined date
- [ ] **Invite member:** email input + role selector (Admin/Member)
  - [ ] Send invitation email (from EaseMail or white-labeled domain)
  - [ ] Pending invitations list with "Resend" and "Cancel" options
  - [ ] Invitation expires after 7 days
- [ ] **Edit member:** change role, deactivate, remove
  - [ ] Deactivate: prevents login, preserves data
  - [ ] Remove: deactivates + starts 30-day data deletion countdown
  - [ ] Can't remove yourself, can't remove last owner
- [ ] **Role descriptions:** hover tooltip explaining what each role can do
- [ ] **Seat usage:** "4 of 10 seats used" progress bar
  - [ ] Upgrade prompt when approaching limit
  - [ ] Block invite when at limit: "Upgrade plan to add more members"

### Shared Inbox Management
- [ ] List of shared inboxes with: name, email, team, assignment count
- [ ] Create shared inbox:
  - [ ] Name (e.g., "Support", "Claims")
  - [ ] Connect to: dropdown of connected accounts (the Microsoft account that receives these emails)
  - [ ] Assign to team: dropdown of teams
  - [ ] Auto-assignment strategy: Round Robin, Load Balanced, Manual
  - [ ] Description (optional)
- [ ] Edit shared inbox settings
- [ ] Delete shared inbox (with confirmation, emails stay in the connected account)
- [ ] Assignment statistics: per-member counts, average response time

### Shared Inbox Usage
- [ ] Shared inboxes appear in sidebar under "SHARED" section
- [ ] Click shared inbox: shows message list with assignment status
- [ ] Assignment column: avatar of assigned person, or "Unassigned"
- [ ] Status column: Open, In Progress, Waiting, Resolved
- [ ] "Assign to me" button on unassigned messages
- [ ] "Assign to..." dropdown to assign to teammate
- [ ] Internal note button: add note visible only to team
- [ ] Note indicator: small icon on messages with internal notes
- [ ] "Collision detection:" when viewing a message, show "Sarah is also viewing this" or "Marcus is drafting a reply" banner
- [ ] Resolve: "Mark as resolved" button → moves to resolved section
- [ ] Reopen: "Reopen" button on resolved items
- [ ] Filter: All, Mine, Unassigned, Resolved
- [ ] SLA indicator: time since received vs target response time (green/yellow/red)

---

## 34. BILLING & SUBSCRIPTION — FULL NUANCE

### Billing Page (Settings → Billing, owner/admin only)
- [ ] **Current plan:** plan name, price, billing cycle (monthly/annual)
- [ ] **Seats:** "4 of 10 used" with member names
- [ ] **Next billing date:** "March 1, 2026"
- [ ] **Payment method:** card ending in 4242, "Update" link
- [ ] **Billing history:** table of past invoices with "Download PDF" links
- [ ] **Change plan:** plan comparison table
  - [ ] Feature comparison grid
  - [ ] Price per seat
  - [ ] "Current plan" badge on active plan
  - [ ] "Upgrade" / "Downgrade" buttons
  - [ ] Proration preview: "You'll be charged $X for the remainder of this period"
- [ ] **Cancel subscription:** 
  - [ ] "Cancel plan" link at bottom (red text, not prominent)
  - [ ] Cancellation flow: reason selector, retention offer (discount), confirmation
  - [ ] "Your plan will remain active until [end of billing period]"
  - [ ] Data retention: 30 days after cancellation, then deleted
- [ ] **Annual discount:** "Save 17% with annual billing" toggle

### Usage Limits & Upgrade Prompts
- [ ] When feature is plan-gated (e.g., AI on Starter):
  - [ ] Show the feature UI but with overlay: "Upgrade to Professional for AI features"
  - [ ] "Upgrade" button opens plan comparison
  - [ ] Don't hide features entirely — show what they're missing
- [ ] When hitting account limit: "You've connected 1 of 1 accounts. Upgrade for more."
- [ ] When hitting seat limit: "All seats are in use. Upgrade to add team members."
- [ ] When hitting template limit: "You've used 10 of 10 templates. Upgrade for unlimited."

---

## 35. HELP & SUPPORT — FULL NUANCE

### Help Panel
- [ ] ? icon in sidebar footer opens help panel (slide-in from right)
- [ ] Search bar: search help articles
- [ ] Quick links: "Getting Started", "Keyboard Shortcuts", "Manage Accounts", "Billing FAQ"
- [ ] Articles rendered inline (don't navigate away from app)
- [ ] Article content: clean markdown rendering with images
- [ ] "Was this helpful?" thumbs up/down on each article
- [ ] "Contact support" link at bottom
- [ ] "Report a bug" link → opens pre-filled email to support@easemail.app

### Changelog / What's New
- [ ] "What's new" link in help panel
- [ ] Shows recent feature updates with dates and descriptions
- [ ] New features badge: small dot on ? icon when unseen updates exist
- [ ] Dismiss by opening the changelog
- [ ] Max 10 recent entries

### Status Page
- [ ] "Service status" link in help panel
- [ ] Links to external status page (status.easemail.app)
- [ ] Shows: EaseMail API, Microsoft Graph API, Supabase, AI Service
- [ ] Green/yellow/red indicators per service
- [ ] During outage: banner in app header "Some services are experiencing issues"

---

## 36. DATA EXPORT & COMPLIANCE — FULL NUANCE

### Data Export (GDPR)
- [ ] Settings → Security → "Export my data"
- [ ] Click "Export": generates ZIP containing:
  - [ ] user-profile.json (name, email, preferences)
  - [ ] connected-accounts.json (account metadata, NOT tokens)
  - [ ] messages.json (all synced messages metadata, NOT bodies for copyright reasons)
  - [ ] contacts.json (all contacts)
  - [ ] labels.json, templates.json, signatures.json
  - [ ] crm-data.json (contacts, deals, activities)
  - [ ] settings.json (all preferences)
- [ ] Processing takes time: "We're preparing your export. You'll receive an email when it's ready."
- [ ] Download link in email (expires in 48 hours)
- [ ] Available to any user for their own data

### Account Deletion
- [ ] Settings → Security → "Delete my account"
- [ ] Confirmation flow:
  - [ ] "This will permanently delete all your data including emails, contacts, and settings."
  - [ ] "Your Microsoft email accounts will NOT be affected."
  - [ ] Type "DELETE" to confirm
  - [ ] 30-day grace period: "Your account is scheduled for deletion on [date]. Sign in before then to cancel."
- [ ] During grace period: can sign in and cancel deletion
- [ ] After grace period: all data permanently removed

### Tenant Admin: Data Retention
- [ ] Settings → Security → "Data retention" (owner/admin only)
- [ ] Message retention: 30 days, 90 days, 1 year, 5 years, Unlimited
- [ ] "Purge messages older than retention period" runs nightly
- [ ] Legal hold: "Hold all data for [user/account]" — prevents any deletion
- [ ] Legal hold list: shows all active holds
- [ ] Compliance export: admin can export any user's data (with audit log entry)
