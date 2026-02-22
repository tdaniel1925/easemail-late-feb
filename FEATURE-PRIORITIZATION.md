# FEATURE PRIORITIZATION — EaseMail v3.0

> **Purpose:** The micro-features files list 1,238 features. This document defines which features are P0 (must-have for MVP), P1 (should-have), and P2 (nice-to-have for later versions).

---

## Priority Levels

| Level | Definition | Build When |
|-------|------------|------------|
| **P0** | Must-have for MVP. Without this, the product is broken or unusable. | Build in initial step |
| **P1** | Should-have for quality product. Improves UX but product works without it. | Build in polish phase after P0 |
| **P2** | Nice-to-have. Power user features, edge cases, advanced workflows. | Build in v2 / v3 after launch |

---

## Email Core Features (MICRO-FEATURES.md)

### Section 1: Composer

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Rich text editor (Tiptap) | **P0** | Core functionality — cannot send email without it |
| Bold, italic, underline | **P0** | Basic formatting — users expect this |
| Bullets, numbered lists | **P0** | Common email formatting |
| Hyperlinks | **P0** | Essential |
| Attachments (upload, drag-drop) | **P0** | Core functionality |
| Send button | **P0** | Obviously |
| Discard draft button | **P0** | Users need escape hatch |
| Auto-save draft (3s debounce) | **P0** | Prevents data loss — critical |
| To/CC/BCC fields | **P0** | Core functionality |
| Subject field | **P0** | Core functionality |
| Account selector ("Send from") | **P0** | Multi-account core feature |
| Reply, Reply All, Forward | **P0** | Core functionality |
|  |  |  |
| Text color picker | **P1** | Nice formatting but not essential |
| Font family picker | **P1** | Most users use default |
| Font size picker | **P1** | Most users use default |
| Code block formatting | **P1** | Useful for dev teams, not essential |
| Blockquote formatting | **P1** | Useful but not critical |
| Horizontal rule | **P1** | Decorative |
| Clear formatting button | **P1** | Power user feature |
| Emoji picker | **P1** | Fun but not essential (can type emoji) |
| Tables | **P1** | Advanced formatting |
| Indent/outdent | **P1** | Nice to have |
|  |  |  |
| Schedule send | **P2** | Advanced feature — build after MVP |
| Undo send (delay send) | **P2** | Nice feature but complex to implement |
| Read receipt request | **P2** | Few users use this |
| Delivery receipt request | **P2** | Few users use this |
| Set importance flag | **P2** | Rarely used |
| Markdown mode (write in MD, render HTML) | **P2** | Power user feature |
| Inline image resize | **P2** | Nice UX polish |
| Link preview cards | **P2** | Nice UX polish |
| Mention autocomplete (@name) | **P2** | Useful for teams but not critical |

### Section 2: Message List

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Display messages in list | **P0** | Core functionality |
| Show: from, subject, preview, date | **P0** | Essential metadata |
| Unread indicator (bold subject) | **P0** | Core functionality |
| Star/flag message | **P0** | Common user action |
| Checkbox selection | **P0** | Bulk actions require this |
| Infinite scroll / pagination | **P0** | Performance — cannot load all messages at once |
| Click message → open in reading pane | **P0** | Core interaction |
| Mark as read/unread | **P0** | Core action |
| Delete message | **P0** | Core action |
| Move to folder (via menu) | **P0** | Core action |
| Avatar display | **P0** | Visual clarity |
| Date/time formatting (relative) | **P0** | UX |
|  |  |  |
| Attachment icon indicator | **P1** | Useful visual cue |
| Importance icon (high/low) | **P1** | Some users filter by this |
| Conversation threading (collapse/expand) | **P1** | Gmail-style threading — nice but complex |
| Select all checkbox | **P1** | Useful for bulk actions |
| Bulk actions (mark read, delete, move) | **P1** | Power user feature |
| Drag-and-drop to folder | **P1** | Nice UX but mouse-only |
| Keyboard navigation (j/k) | **P1** | Power user feature |
| Multi-select (Cmd+click, Shift+click) | **P1** | Advanced selection |
| Preview pane toggle | **P1** | Layout flexibility |
|  |  |  |
| Swipe gestures (mobile) | **P2** | Mobile-specific, build after desktop |
| Quick actions on hover (archive, delete, snooze) | **P2** | Nice UX polish |
| Color-coded categories | **P2** | Visual polish |
| Density toggle (compact/comfortable/spacious) | **P2** | Layout customization |
| Custom sorting (by sender, size, etc.) | **P2** | Advanced filtering |
| Group by date headers | **P2** | Visual organization |
| Pinned messages at top | **P2** | Power user feature |
| Snooze message | **P2** | Advanced feature — requires background job |

### Section 3: Message Viewer

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Display HTML email body (sanitized) | **P0** | Core functionality |
| Show from, to, cc, date | **P0** | Essential metadata |
| Download attachments | **P0** | Core functionality |
| Reply button | **P0** | Core action |
| Forward button | **P0** | Core action |
| Delete button | **P0** | Core action |
| Mark as unread button | **P0** | Common action |
| Star/flag button | **P0** | Common action |
| Display inline images | **P0** | Modern email standard |
|  |  |  |
| Show full headers (toggle) | **P1** | Advanced users / debugging |
| View original source | **P1** | Advanced users / debugging |
| Print message | **P1** | Some users need this |
| Block sender | **P1** | Spam management |
| Report phishing | **P1** | Security feature |
| Show quoted text (collapse/expand) | **P1** | Clean UI |
| Previous/next message navigation | **P1** | Nice UX |
|  |  |  |
| Translate message | **P2** | Advanced feature — requires translation API |
| Text-to-speech | **P2** | Accessibility but niche |
| Dark reader mode (invert colors) | **P2** | Reading comfort |

### Section 4: Folder Tree

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Display folders (Inbox, Sent, Drafts, Trash) | **P0** | Core navigation |
| Show unread count per folder | **P0** | Essential feedback |
| Click folder → filter message list | **P0** | Core interaction |
| Nested folders | **P0** | Outlook parity |
| Create custom folder | **P1** | Common user action |
| Rename folder | **P1** | Common user action |
| Delete custom folder | **P1** | Common user action |
| Favorite folders (star icon) | **P1** | Power user feature |
| Collapse/expand nested folders | **P1** | Clean UI |
|  |  |  |
| Drag-and-drop folders to reorder | **P2** | Nice UX but not essential |
| Folder color coding | **P2** | Visual customization |
| Smart folders (virtual folders based on rules) | **P2** | Advanced feature |

### Section 5: Search

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Full-text search across all accounts | **P0** | Core functionality |
| Search by from, to, subject | **P0** | Common filters |
| Search by date range | **P0** | Common filter |
| Search "has attachment" | **P0** | Common filter |
| Display results in message list | **P0** | Core interaction |
| Clear search button | **P0** | UX |
|  |  |  |
| Search within specific folder | **P1** | Advanced filtering |
| Search by attachment filename | **P1** | Power user feature |
| Search by label/category | **P1** | Advanced filtering |
| Save search as smart folder | **P2** | Power user feature |
| Search suggestions (autocomplete) | **P2** | Nice UX |
| Natural language search (AI-powered) | **P2** | Advanced AI feature |

---

## AI Features (MICRO-FEATURES-V2.md)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| AI draft email (from instruction) | **P0** | Flagship AI feature — justifies Professional plan price |
| Thread summarization | **P0** | High-value feature — saves time |
| Smart reply suggestions (3 options) | **P1** | Nice feature but not critical |
| Priority scoring (background) | **P1** | Useful but subtle — users might not notice |
| Auto-categorization | **P1** | Useful but not visible enough to justify cost |
| Sentiment detection | **P2** | Interesting but low impact |
| Grammar check before send | **P2** | Nice polish but users have Grammarly |
| Template generation from past emails | **P2** | Advanced feature |
| AI-powered search | **P2** | Natural language queries — nice but complex |

---

## Shared Inbox Features (MICRO-FEATURES-V3.md)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Create shared inbox | **P0** | Core Team plan feature |
| Assign conversation to user | **P0** | Core collaboration feature |
| Status tracking (open/assigned/resolved) | **P0** | Workflow management |
| Internal notes on conversations | **P0** | Team communication |
| Team members see shared inbox in sidebar | **P0** | Visibility |
|  |  |  |
| Collision detection ("X is viewing") | **P1** | Nice UX but not critical for MVP |
| Auto-assignment (round robin) | **P1** | Workflow automation |
| SLA tracking (response time targets) | **P2** | Enterprise feature |
| Team performance dashboard | **P2** | Analytics — build after MVP |

---

## CRM Features (MICRO-FEATURES-V3.md)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Auto-create contact from email | **P0** | Core CRM feature |
| Contact detail view (name, email, company) | **P0** | Core CRM feature |
| Link email to contact | **P0** | Core CRM feature |
| Activity timeline (email history) | **P0** | Core CRM feature |
|  |  |  |
| Create deals | **P1** | Sales pipeline — useful but not MVP |
| Deal stages (lead → qualified → closed) | **P1** | Sales workflow |
| Link deal to contact/company | **P1** | Relationship mapping |
| Company records | **P1** | B2B CRM |
|  |  |  |
| Custom fields on contacts/deals | **P2** | Advanced customization |
| Deal value tracking | **P2** | Sales analytics |
| Revenue reporting | **P2** | Analytics |
| Task management | **P2** | Beyond email scope |

---

## Calendar Features (ADDITIONAL-AGENTS.md)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Sync calendar from Graph API | **P0** | Core calendar feature |
| Month view | **P0** | Standard calendar view |
| Create event | **P0** | Core action |
| Edit event | **P0** | Core action |
| Delete event | **P0** | Core action |
| Display in sidebar (today's events) | **P0** | Context while reading email |
|  |  |  |
| Week view | **P1** | Alternate view |
| Day view | **P1** | Detailed view |
| Event reminders | **P1** | Notifications |
| Multi-account calendar merge | **P1** | Useful but complex |
|  |  |  |
| Recurring events | **P2** | Complex logic |
| Calendar sharing | **P2** | Collaboration feature |
| Meeting room booking | **P2** | Enterprise feature |

---

## Teams Chat Features (ADDITIONAL-AGENTS.md)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Sync Teams chats | **P1** | Nice integration but not critical for email MVP |
| Display chat list | **P1** | UI integration |
| Send message in Teams | **P1** | Core interaction |
| View message history | **P1** | Context |
|  |  |  |
| Presence indicators | **P2** | Real-time feature |
| Typing indicators | **P2** | Real-time feature |
| Channel integration | **P2** | Advanced Teams feature |

---

## Settings & Admin (MICRO-FEATURES-V3.md)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Connect/disconnect account | **P0** | Core multi-account feature |
| Set default account | **P0** | UX |
| Theme toggle (light/dark) | **P0** | Modern UX standard |
| Create email signature | **P0** | Professional communication |
| Create email template | **P1** | Productivity feature |
| Keyboard shortcuts list | **P1** | Power user feature |
| Notification preferences | **P1** | User control |
|  |  |  |
| Custom labels/categories | **P2** | Advanced organization |
| Mail rules (auto-file, auto-label) | **P2** | Automation |
| Blocked senders list | **P2** | Spam management |
| Import/export data | **P2** | Data portability (GDPR requirement — build for launch but not MVP) |

---

## Build Strategy

### MVP (Minimum Viable Product) — P0 Features Only

**Goal:** Launch a working multi-account email client with AI drafting and thread summarization.

**What's included:**
- Email core: compose, read, reply, forward, delete, folders, search
- Multi-account management
- AI drafting and summarization (Professional plan only)
- Basic settings (accounts, signatures, theme)

**What's NOT included (build later):**
- Shared inboxes (Team plan)
- CRM (Team plan)
- Calendar (nice-to-have)
- Teams chat (nice-to-have)
- Advanced features (snooze, schedule send, rules, etc.)

**Timeline:** ~4-6 weeks if following the 42-step build plan

### Post-MVP (P1 Features) — Version 1.1

**Goal:** Polish the product to compete with superhuman/Linear-quality email clients.

**Add:**
- Conversation threading
- Bulk actions
- Keyboard navigation
- Smart replies (AI)
- Shared inboxes (basic)
- CRM (basic)

**Timeline:** +2-3 weeks

### Post-Launch (P2 Features) — Version 2.0+

**Goal:** Advanced features for power users and Enterprise customers.

**Add:**
- Snooze/schedule send
- Mail rules
- Calendar full integration
- Teams chat
- CRM advanced (deals, pipeline)
- Analytics dashboards

**Timeline:** Build based on user feedback and feature requests

---

## Recommendation

**Start with P0 features only.** Resist the temptation to build P1/P2 features during the initial build. They slow you down and introduce bugs.

**After MVP launch:** Get user feedback, see which features are most requested, then build P1 features in order of user demand (not in order of "what's cool").

**Remember:** A polished product with 20 features beats a buggy product with 200 features.
