# ADDITIONAL-AGENTS.md — EaseMail v3.0 Expansion Modules

> **Agents 9-11: Calendar, MS Teams, Contacts**
> These agents run AFTER Agent 5 (UI Shell) is complete and stable.
> They follow the same build rules: one step at a time, test gate per step, manual checkpoint.

---

## UPDATED AGENT MAP

```
Agents 1-5: CORE (sequential) ─── MUST BE COMPLETE FIRST
  │
  ├── Agent 6: AI Layer (parallel)
  ├── Agent 7: Teams/CRM (parallel)  ← internal EaseMail teams
  ├── Agent 8: White-Label (parallel)
  │
  └── PHASE 2 (after core is stable)
      ├── Agent 9: Calendar Module (parallel)
      ├── Agent 10: MS Teams Integration (parallel)
      └── Agent 11: Contacts Hub (parallel)
```

---

## ADDITIONAL GRAPH API SCOPES REQUIRED

Add these to the FULL_SCOPES in the auth flow:

```
# Calendar
Calendars.ReadWrite          # Read + create/update/delete events
Calendars.ReadWrite.Shared   # Access shared/delegated calendars

# MS Teams
Chat.Read                    # Read Teams chat messages
Chat.ReadWrite               # Send Teams chat messages
ChannelMessage.Read.All      # Read channel messages (admin consent)
Team.ReadBasic.All           # List teams user belongs to
OnlineMeetings.ReadWrite     # Create/manage Teams meetings
Presence.Read                # Read user's presence status
Presence.Read.All            # Read others' presence

# Contacts (expanded)
Contacts.ReadWrite           # Full contact CRUD
People.Read                  # People API (smart suggestions)
People.Read.All              # Org-wide people search
```

**Important:** These scopes require re-consent. When a user upgrades to a plan
that includes Calendar/Teams, trigger a re-auth flow that requests the additional
scopes. The token service already handles this — just pass the expanded scope array.

---

## ADDITIONAL DATABASE SCHEMA

```sql
-- ================================================================
-- CALENDAR EVENTS (synced from Graph per account)
-- ================================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL, -- which calendar this belongs to
  -- Event details
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  location_display TEXT,
  location_address JSONB,
  -- Online meeting
  is_online_meeting BOOLEAN DEFAULT false,
  online_meeting_provider TEXT, -- 'teamsForBusiness', 'skypeForBusiness', etc.
  online_meeting_url TEXT,
  -- Timing
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  timezone TEXT,
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- Graph recurrence object
  series_master_id TEXT, -- links occurrences to master
  -- Attendees
  organizer_email TEXT,
  organizer_name TEXT,
  attendees JSONB DEFAULT '[]', -- [{email, name, status, type}]
  -- status: 'accepted', 'declined', 'tentative', 'notResponded'
  -- type: 'required', 'optional', 'resource'
  -- Status
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  response_status TEXT DEFAULT 'notResponded'
    CHECK (response_status IN ('accepted', 'declined', 'tentative', 'notResponded')),
  show_as TEXT DEFAULT 'busy'
    CHECK (show_as IN ('free', 'tentative', 'busy', 'oof', 'workingElsewhere', 'unknown')),
  importance TEXT DEFAULT 'normal'
    CHECK (importance IN ('low', 'normal', 'high')),
  sensitivity TEXT DEFAULT 'normal'
    CHECK (sensitivity IN ('normal', 'personal', 'private', 'confidential')),
  -- Categories
  categories TEXT[] DEFAULT '{}',
  -- Reminders
  reminder_minutes INTEGER DEFAULT 15,
  is_reminder_on BOOLEAN DEFAULT true,
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Indexing
  UNIQUE(account_id, graph_id)
);

CREATE INDEX idx_events_account_time ON calendar_events(account_id, start_at, end_at);
CREATE INDEX idx_events_calendar ON calendar_events(account_id, calendar_id, start_at);
CREATE INDEX idx_events_recurring ON calendar_events(series_master_id) WHERE series_master_id IS NOT NULL;

-- ================================================================
-- CALENDARS (per account — users can have multiple calendars)
-- ================================================================
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT, -- hex color from Graph
  is_default BOOLEAN DEFAULT false,
  is_removable BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT true,
  can_share BOOLEAN DEFAULT false,
  owner_email TEXT, -- for shared calendars
  owner_name TEXT,
  -- Sync
  is_visible BOOLEAN DEFAULT true, -- user can toggle visibility
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, graph_id)
);

-- ================================================================
-- CALENDAR SYNC STATE (separate from mail sync)
-- ================================================================
CREATE TABLE calendar_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  delta_link TEXT,
  sync_window_start TIMESTAMPTZ, -- only sync events within this window
  sync_window_end TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle'
    CHECK (sync_status IN ('idle', 'syncing', 'error', 'backoff')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, calendar_id)
);

-- ================================================================
-- MS TEAMS — CHATS
-- ================================================================
CREATE TABLE teams_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL, -- Graph chat ID
  chat_type TEXT NOT NULL
    CHECK (chat_type IN ('oneOnOne', 'group', 'meeting')),
  topic TEXT, -- group chat topic / meeting subject
  -- Participants
  participants JSONB DEFAULT '[]', -- [{userId, displayName, email}]
  -- Last activity
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender TEXT,
  -- Status
  unread_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, graph_id)
);

CREATE INDEX idx_chats_account_recent ON teams_chats(account_id, last_message_at DESC);

-- ================================================================
-- MS TEAMS — CHAT MESSAGES
-- ================================================================
CREATE TABLE teams_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES teams_chats(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  -- Message content
  sender_id TEXT,
  sender_name TEXT,
  sender_email TEXT,
  body_html TEXT,
  body_text TEXT,
  message_type TEXT DEFAULT 'message'
    CHECK (message_type IN ('message', 'systemEvent', 'unknownFutureValue')),
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  -- Reactions
  reactions JSONB DEFAULT '[]', -- [{type, user, createdAt}]
  -- Threading
  reply_to_id TEXT, -- if this is a reply
  -- Status
  importance TEXT DEFAULT 'normal',
  is_deleted BOOLEAN DEFAULT false,
  -- Timestamps
  sent_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, graph_id)
);

CREATE INDEX idx_teams_messages_chat ON teams_messages(chat_id, sent_at DESC);

-- ================================================================
-- MS TEAMS — TEAMS & CHANNELS (the org Teams, not EaseMail teams)
-- ================================================================
CREATE TABLE ms_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, graph_id)
);

CREATE TABLE ms_teams_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES ms_teams(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT DEFAULT 'standard'
    CHECK (channel_type IN ('standard', 'private', 'shared')),
  is_favorite BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, graph_id)
);

-- ================================================================
-- MS TEAMS — PRESENCE (real-time status)
-- ================================================================
CREATE TABLE teams_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_graph_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  availability TEXT DEFAULT 'offline'
    CHECK (availability IN (
      'available', 'busy', 'doNotDisturb', 'beRightBack',
      'away', 'offline', 'unknown'
    )),
  activity TEXT, -- 'InACall', 'InAMeeting', 'Presenting', etc.
  status_message TEXT,
  expiry_at TIMESTAMPTZ, -- when custom status expires
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_graph_id)
);

-- ================================================================
-- CONTACTS HUB (unified across all accounts)
-- ================================================================
-- Note: account_contacts already exists in base schema for per-account contacts
-- This table is the UNIFIED view across accounts + manual + CRM

CREATE TABLE contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- system groups: 'All', 'Frequent', 'Recent'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE contact_group_members (
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, contact_id)
);

-- Contact interaction tracking (for smart suggestions)
CREATE TABLE contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  interaction_type TEXT NOT NULL
    CHECK (interaction_type IN (
      'email_sent', 'email_received', 'email_cc',
      'meeting_organized', 'meeting_attended',
      'teams_chat', 'teams_call',
      'manual_view'
    )),
  interaction_at TIMESTAMPTZ DEFAULT NOW(),
  -- Aggregated scores (updated by background job)
  -- These power the smart autocomplete
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_email ON contact_interactions(user_id, contact_email, interaction_at DESC);
CREATE INDEX idx_interactions_user_recent ON contact_interactions(user_id, interaction_at DESC);

-- Contact frequency scores (materialized for fast autocomplete)
CREATE TABLE contact_frequency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  -- Scores
  total_interactions INTEGER DEFAULT 0,
  last_7_days INTEGER DEFAULT 0,
  last_30_days INTEGER DEFAULT 0,
  last_90_days INTEGER DEFAULT 0,
  recency_score REAL DEFAULT 0, -- decayed score, higher = more recent
  frequency_score REAL DEFAULT 0, -- higher = more frequent
  combined_score REAL DEFAULT 0, -- weighted combination for ranking
  last_interaction_at TIMESTAMPTZ,
  -- Source tracking
  sources TEXT[] DEFAULT '{}', -- which accounts this contact appears in
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_email)
);

CREATE INDEX idx_frequency_user_score ON contact_frequency(user_id, combined_score DESC);

-- ================================================================
-- RLS for new tables
-- ================================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ms_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ms_teams_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_frequency ENABLE ROW LEVEL SECURITY;

-- RLS policies follow same pattern: own_accounts for account-scoped,
-- tenant for tenant-scoped
CREATE POLICY "own_events" ON calendar_events
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_calendars" ON calendars
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_chats" ON teams_chats
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_teams" ON ms_teams
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_contact_groups" ON contact_groups
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "own_interactions" ON contact_interactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_frequency" ON contact_frequency
  FOR ALL USING (user_id = auth.uid());
```

---

## AGENT 9: CALENDAR MODULE (Steps 9.1-9.8)

### Step 9.1 — Calendar Sync
**Build:** `lib/graph/calendar.ts`:
- `syncCalendars(accountId)` — fetch all calendars for account, upsert to calendars table
- `syncEvents(accountId, calendarId, startDate, endDate)` — fetch events within window
- Delta sync support with calendar-specific delta link
- Handles recurring events (expand instances vs store pattern)
- Sync window: 1 month back, 6 months forward (configurable)

**Graph endpoints:**
```
GET /me/calendars                                    — list calendars
GET /me/calendars/{id}/events                        — list events
GET /me/calendars/{id}/calendarView?startDateTime=&endDateTime= — events in range
GET /me/calendars/{id}/events/delta                  — incremental sync
```

**Test Gate 9.1:**
```typescript
describe('Calendar Sync', () => {
  test('syncs all calendars for account', async () => {
    const result = await syncCalendars(testAccountId)
    expect(result.length).toBeGreaterThan(0)
    const cals = await getCalendars(testAccountId)
    const hasDefault = cals.some(c => c.is_default)
    expect(hasDefault).toBe(true)
  })

  test('syncs events within time window', async () => {
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixMonthsOut = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    const result = await syncEvents(testAccountId, defaultCalId, monthAgo, sixMonthsOut)
    expect(result.synced).toBeGreaterThanOrEqual(0)
  })

  test('handles recurring events', async () => {
    const events = await getEvents(testAccountId)
    const recurring = events.filter(e => e.is_recurring)
    // Recurring events should have series_master_id populated
    recurring.forEach(e => {
      if (e.series_master_id) {
        expect(e.series_master_id).toBeDefined()
      }
    })
  })

  test('delta sync captures new events', async () => {
    const state = await getCalendarSyncState(testAccountId, defaultCalId)
    expect(state.delta_link).toBeDefined()
  })
})
```

### Step 9.2 — Calendar API Routes
**Build:**
- `GET /api/calendar/events/route.ts` — list events with date range, account filter
  - Supports unified view (all accounts) or per-account
  - Returns events sorted by start_at
  - Supports recurring event expansion
- `POST /api/calendar/events/route.ts` — create event via Graph
- `PATCH /api/calendar/events/[eventId]/route.ts` — update event
- `DELETE /api/calendar/events/[eventId]/route.ts` — delete/cancel event
- `POST /api/calendar/events/[eventId]/respond/route.ts` — accept/decline/tentative
- `GET /api/calendar/free-busy/route.ts` — check availability for scheduling

**Test Gate 9.2:**
```typescript
describe('Calendar API', () => {
  test('list events returns events in range', async () => {
    const res = await fetch('/api/calendar/events?startDate=2025-01-01&endDate=2025-12-31')
    const data = await res.json()
    expect(Array.isArray(data.events)).toBe(true)
  })

  test('create event via Graph', async () => {
    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        accountId: testAccountId,
        subject: '[EaseMail Test] Calendar Event',
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 90000000).toISOString(),
        attendees: [],
      })
    })
    expect(res.status).toBe(201)
    const event = await res.json()
    expect(event.graph_id).toBeDefined()
    // Cleanup
    await fetch(`/api/calendar/events/${event.id}`, { method: 'DELETE' })
  })

  test('respond to event invitation', async () => {
    // Find an event with pending response
    const res = await fetch(`/api/calendar/events/${testEventId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response: 'accepted', comment: 'See you there' })
    })
    expect(res.status).toBe(200)
  })
})
```

### Step 9.3 — Calendar UI: Month/Week/Day Views
**Build:** Calendar page with three view modes:
- **Month view:** Grid showing days, events as compact bars, click to expand day
- **Week view:** 7-column time grid (7am-9pm visible), events as positioned blocks
- **Day view:** Single column time grid with full event detail
- Unified view: events from all accounts, color-coded by account color
- Per-account toggle: show/hide calendars with checkboxes
- Current time indicator (red line in week/day view)
- Click empty slot to create event
- Drag event to reschedule

**Design specs (following UI-DESIGN-SYSTEM.md):**
```
Month view:
  - Day cell: min-height 100px, border-subtle borders
  - Today: bg-accent-subtle background
  - Event bar: 20px height, 4px radius, account color, text-xs
  - Overflow: "+3 more" link

Week view:
  - Time column: 48px wide, text-xs, text-tertiary
  - Hour row: 60px height, border-subtle top border
  - Event block: account color left border (3px), bg-surface-secondary
  - Current time: 2px coral line spanning full width

Day view:
  - Same as week but single column, events show full detail
```

**Test Gate 9.3:** Month, week, and day views render with events. Can toggle between views.

### Step 9.4 — Event Creation/Edit Modal
**Build:**
- Modal for creating/editing events
- Fields: title, date/time pickers, location, description (rich text), attendees (autocomplete from contacts), online meeting toggle, recurrence picker, reminder, calendar selector (which account/calendar)
- "Create Teams Meeting" toggle (creates online meeting link via Graph)
- Attendee availability checking (free/busy lookup)

**Test Gate 9.4:** Can create event with attendees. Teams meeting link generated when toggled.

### Step 9.5 — Calendar Sidebar in Email View
**Build:** Optional sidebar panel in the email view showing:
- Today's upcoming events (next 3)
- Click event to see details
- "Schedule Meeting" quick action from email (pre-fills attendees from email recipients)

**Test Gate 9.5:** Calendar sidebar shows upcoming events. "Schedule Meeting" pre-fills correctly.

### Step 9.6 — Calendar Notifications & Reminders
**Build:**
- Browser notification X minutes before event (based on reminder_minutes)
- Toast notification for event updates (moved, cancelled, new invitation)
- Badge on calendar nav item for pending invitations

**Test Gate 9.6:** Reminder notification fires at correct time.

### Step 9.7 — Calendar Webhooks
**Build:**
- Graph webhook subscription for calendar changes per account
- Same pattern as mail webhooks: create, renew, handle notifications
- Webhook triggers targeted calendar sync

**Test Gate 9.7:** Creating an event in Outlook appears in EaseMail within 30 seconds.

### Step 9.8 — Multi-Account Calendar Merge
**Build:**
- Unified calendar view merging events from all connected accounts
- Account color coding (uses connected_account.color)
- Per-account calendar visibility toggles
- Conflict detection: highlight overlapping events across accounts
- "Which account?" selector when creating events

**Test Gate 9.8:** Events from multiple accounts display correctly with different colors.

### 🛑 MANUAL CHECKPOINT 9
**Daniel verifies:**
- [ ] Calendars synced from all connected Microsoft accounts
- [ ] Month, week, day views all render correctly
- [ ] Events color-coded by account
- [ ] Can create event (appears in Outlook)
- [ ] Can respond to invitation (accept/decline)
- [ ] Can create Teams meeting from calendar
- [ ] Recurring events display correctly
- [ ] Calendar sidebar in email view shows today's events
- [ ] "Schedule Meeting" from email pre-fills attendees
- [ ] Multi-account calendar merge shows all events
- [ ] Webhook pushes new events within 30 seconds

**Sign off: _______________ Date: _______________**

---

## AGENT 10: MS TEAMS INTEGRATION (Steps 10.1-10.7)

### Step 10.1 — Teams Chat Sync
**Build:** `lib/graph/teams.ts`:
- `syncChats(accountId)` — fetch all chats (1:1, group, meeting)
- `syncChatMessages(accountId, chatId)` — fetch messages for a chat
- Store in teams_chats and teams_messages tables
- Delta sync support for real-time message updates

**Graph endpoints:**
```
GET /me/chats                                  — list all chats
GET /me/chats/{id}/messages                    — messages in a chat
GET /me/chats/{id}/messages/delta              — incremental sync
POST /me/chats/{id}/messages                   — send message
GET /me/joinedTeams                            — list teams
GET /teams/{id}/channels                       — list channels
GET /teams/{id}/channels/{id}/messages         — channel messages
```

**Test Gate 10.1:**
```typescript
describe('Teams Chat Sync', () => {
  test('syncs all chats for account', async () => {
    const result = await syncChats(testAccountId)
    expect(result.length).toBeGreaterThanOrEqual(0)
    const chats = await getChats(testAccountId)
    chats.forEach(chat => {
      expect(['oneOnOne', 'group', 'meeting']).toContain(chat.chat_type)
    })
  })

  test('syncs messages for a chat', async () => {
    const chats = await getChats(testAccountId)
    if (chats.length > 0) {
      const result = await syncChatMessages(testAccountId, chats[0].graph_id)
      expect(result.synced).toBeGreaterThanOrEqual(0)
    }
  })
})
```

### Step 10.2 — Teams & Channels Sync
**Build:**
- `syncTeams(accountId)` — fetch joined Teams
- `syncChannels(accountId, teamId)` — fetch channels per Team
- Store in ms_teams and ms_teams_channels tables

**Test Gate 10.2:** Teams and channels synced and stored correctly.

### Step 10.3 — Presence Sync
**Build:** `lib/graph/presence.ts`:
- `getPresence(accountId, userIds)` — batch fetch presence for multiple users
- `subscribeToPresence(accountId, userIds)` — subscribe to presence changes
- Cache presence in teams_presence table (refresh every 60s for active contacts)
- Show presence dots in contact autocomplete and email headers

**Graph endpoints:**
```
POST /communications/getPresencesByUserId      — batch presence
GET /communications/presences/{userId}         — single presence
POST /subscriptions                            — presence change subscription
```

**Test Gate 10.3:**
```typescript
describe('Presence', () => {
  test('fetches presence for known users', async () => {
    const presences = await getPresence(testAccountId, [knownUserId])
    expect(presences.length).toBe(1)
    expect(['available', 'busy', 'doNotDisturb', 'away', 'offline', 'unknown'])
      .toContain(presences[0].availability)
  })
})
```

### Step 10.4 — Teams Chat UI
**Build:** New section in sidebar: "Teams" (collapsible)
- Chat list: recent chats sorted by last message, unread count
- Chat view: message thread with sender names, timestamps, reactions
- Compose: text input at bottom, supports @mentions, emoji
- Chat types distinguished visually: 1:1 shows avatar, group shows group icon, meeting shows calendar icon
- Presence dots on participant avatars

**Design specs:**
```
Chat list item:
  - Height: 56px
  - Avatar: 28px (or group icon)
  - Presence dot: 8px circle, positioned bottom-right of avatar
  - Name: text-md, font-medium
  - Preview: text-sm, text-secondary, truncate 1 line
  - Time: text-xs, text-tertiary

Chat message:
  - NOT bubble style (this isn't WhatsApp)
  - Flat layout like Slack/Teams:
    [Avatar] Sender Name  10:42 AM
             Message text here
  - Sender: text-sm, font-medium
  - Message: text-base, text-primary
  - Time: text-xs, text-tertiary, inline after name
```

**Test Gate 10.4:** Chat list renders. Can view chat messages. Can send a message.

### Step 10.5 — Send Teams Message API
**Build:**
- `POST /api/teams/chats/[chatId]/messages/route.ts` — send chat message
- `POST /api/teams/chats/route.ts` — start new chat (1:1 or group)
- Support @mentions (resolve user from contacts)
- Support file attachments

**Test Gate 10.5:** Can send message via API. Message appears in MS Teams.

### Step 10.6 — Teams Meeting Integration
**Build:**
- "Create Teams Meeting" from calendar event creation
- "Join Meeting" button for events with online meeting URLs
- Meeting chat accessible from the event detail view
- `POST /me/onlineMeetings` — create Teams meeting via Graph

**Test Gate 10.6:** Can create Teams meeting. Join link is valid.

### Step 10.7 — Cross-Module Presence
**Build:**
- Show presence indicators in:
  - Email compose autocomplete (contact suggestions show availability)
  - Message viewer header (sender's current status)
  - Shared inbox assignment (show who's available)
  - Calendar attendee list (who's free right now)
- Presence dot colors: green (available), yellow (away), red (busy/DND), gray (offline)

**Test Gate 10.7:** Presence dots appear in email compose, message header, and calendar.

### 🛑 MANUAL CHECKPOINT 10
**Daniel verifies:**
- [ ] Teams chats synced from Microsoft account
- [ ] Chat list in sidebar shows recent conversations
- [ ] Can read chat messages in thread view
- [ ] Can send chat message (appears in MS Teams)
- [ ] Teams and channels listed
- [ ] Presence dots show correct status for contacts
- [ ] Presence visible in email compose autocomplete
- [ ] Can create Teams meeting from calendar
- [ ] "Join Meeting" button works
- [ ] Real-time updates: new chat messages appear within seconds

**Sign off: _______________ Date: _______________**

---

## AGENT 11: CONTACTS HUB (Steps 11.1-11.6)

### Step 11.1 — Unified Contact Sync
**Build:** `lib/graph/contacts-hub.ts`:
- Merge contacts from all connected accounts into unified view
- Deduplicate by email address (keep most complete record)
- Track which accounts a contact appears in (sources array)
- Auto-create contacts from email interactions (inferred contacts)
- Sync Graph contacts + People API suggestions

**Graph endpoints:**
```
GET /me/contacts                               — Outlook contacts
GET /me/people                                 — People API (smart suggestions)
GET /me/people/?$search=                       — People search
```

**Test Gate 11.1:**
```typescript
describe('Unified Contact Sync', () => {
  test('merges contacts from multiple accounts', async () => {
    await syncAllContacts(testUserId)
    const contacts = await getUnifiedContacts(testUserId)
    // Should have no duplicate emails
    const emails = contacts.map(c => c.email)
    const uniqueEmails = [...new Set(emails)]
    expect(emails.length).toBe(uniqueEmails.length)
  })

  test('tracks contact sources', async () => {
    const contact = await getContactByEmail(testUserId, knownEmail)
    expect(contact.sources.length).toBeGreaterThan(0)
  })
})
```

### Step 11.2 — Contact Interaction Tracking
**Build:**
- Log every email sent/received as an interaction
- Log every meeting with a contact
- Log every Teams chat message
- Background job to compute frequency scores (runs hourly):
  - last_7_days, last_30_days, last_90_days counts
  - Recency score (exponential decay, recent interactions weighted more)
  - Frequency score (total interactions weighted by recency)
  - Combined score for autocomplete ranking

**Test Gate 11.2:** Interaction logging works. Frequency scores computed and queryable.

### Step 11.3 — Smart Autocomplete
**Build:** `GET /api/contacts/autocomplete/route.ts`:
- Input: partial query (name or email)
- Returns top 8 matches ranked by:
  1. Exact match boost
  2. Combined frequency score
  3. Name/email prefix match
- Searches across: unified contacts, People API, inferred contacts
- Shows presence status if available
- Shows account source (which account the contact is from)
- Response time: < 100ms (query contact_frequency table, not Graph API)

**Test Gate 11.3:**
```typescript
describe('Smart Autocomplete', () => {
  test('returns results ranked by frequency', async () => {
    const results = await autocomplete(testUserId, 'john')
    expect(results.length).toBeGreaterThan(0)
    // First result should have highest combined_score
    if (results.length > 1) {
      expect(results[0].combined_score).toBeGreaterThanOrEqual(results[1].combined_score)
    }
  })

  test('responds within 100ms', async () => {
    const start = Date.now()
    await autocomplete(testUserId, 'test')
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(100)
  })
})
```

### Step 11.4 — Contacts UI: List & Detail View
**Build:** Contacts page:
- Left panel: searchable contact list, grouped alphabetically
- Right panel: contact detail card
  - Name, email, phone, company, title
  - Presence indicator
  - Account sources (which Microsoft accounts)
  - Quick actions: send email, start chat, schedule meeting
  - Activity timeline (recent emails, meetings, chats with this contact)
  - CRM data if linked (deals, notes)
  - Groups/tags

**Design specs:**
```
Contact list item:
  - Height: 48px
  - Avatar: 32px round with initials
  - Presence dot: 8px
  - Name: text-md, font-medium
  - Email: text-sm, text-secondary
  - Company: text-xs, text-tertiary

Contact detail card:
  - Header: large avatar (64px), name (text-xl), title & company
  - Quick action buttons: row of icon buttons (email, chat, calendar, call)
  - Tabbed sections: Activity, Details, CRM, Notes
```

**Test Gate 11.4:** Contact list renders. Detail view shows full info. Quick actions work.

### Step 11.5 — Contact Groups & Tags
**Build:**
- Create, edit, delete contact groups
- Add/remove contacts from groups
- System groups: "All", "Frequent" (top 50 by score), "Recent" (last 30 days)
- Tags on contacts (free-form, tenant-scoped)
- Filter contact list by group or tag

**Test Gate 11.5:** Can create group, add contacts, filter by group.

### Step 11.6 — Contact Import/Export
**Build:**
- Import contacts from CSV (map columns to fields)
- Export contacts to CSV
- Import from vCard (.vcf)
- Duplicate detection on import (match by email, offer merge)

**Test Gate 11.6:** Can import CSV of 100 contacts. Duplicates detected and flagged.

### 🛑 MANUAL CHECKPOINT 11
**Daniel verifies:**
- [ ] Contacts unified across all connected accounts
- [ ] No duplicate contacts (same email)
- [ ] Smart autocomplete in compose uses frequency ranking
- [ ] Autocomplete responds in < 100ms
- [ ] Presence dots visible on contacts
- [ ] Contact detail shows activity timeline (emails, meetings, chats)
- [ ] Quick actions work (send email, start chat, schedule meeting)
- [ ] Contact groups work (create, add members, filter)
- [ ] CSV import/export works
- [ ] CRM data visible on contact if linked

**Sign off: _______________ Date: _______________**

---

## UPDATED BUILD-STATE.md ADDITIONS

Add these rows to BUILD-STATE.md:

```markdown
| 9.1 | Calendar Sync | ⬜ | ⬜ | |
| 9.2 | Calendar API Routes | ⬜ | ⬜ | |
| 9.3 | Calendar Views (Month/Week/Day) | ⬜ | ⬜ | |
| 9.4 | Event Creation/Edit Modal | ⬜ | ⬜ | |
| 9.5 | Calendar Sidebar in Email | ⬜ | ⬜ | |
| 9.6 | Calendar Notifications | ⬜ | ⬜ | |
| 9.7 | Calendar Webhooks | ⬜ | ⬜ | |
| 9.8 | Multi-Account Calendar Merge | ⬜ | ⬜ | |
| CP9 | **MANUAL CHECKPOINT 9** | ⬜ | ⬜ | |
| 10.1 | Teams Chat Sync | ⬜ | ⬜ | |
| 10.2 | Teams & Channels Sync | ⬜ | ⬜ | |
| 10.3 | Presence Sync | ⬜ | ⬜ | |
| 10.4 | Teams Chat UI | ⬜ | ⬜ | |
| 10.5 | Send Teams Message API | ⬜ | ⬜ | |
| 10.6 | Teams Meeting Integration | ⬜ | ⬜ | |
| 10.7 | Cross-Module Presence | ⬜ | ⬜ | |
| CP10 | **MANUAL CHECKPOINT 10** | ⬜ | ⬜ | |
| 11.1 | Unified Contact Sync | ⬜ | ⬜ | |
| 11.2 | Contact Interaction Tracking | ⬜ | ⬜ | |
| 11.3 | Smart Autocomplete | ⬜ | ⬜ | |
| 11.4 | Contacts List & Detail UI | ⬜ | ⬜ | |
| 11.5 | Contact Groups & Tags | ⬜ | ⬜ | |
| 11.6 | Contact Import/Export | ⬜ | ⬜ | |
| CP11 | **MANUAL CHECKPOINT 11** | ⬜ | ⬜ | |
```

---

## UPDATED BACKGROUND JOBS

Add to the Supabase Edge Functions schedule:

| Job | Schedule | Purpose |
|-----|----------|---------|
| sync-calendars | Every 5min | Delta sync calendars for all active accounts |
| sync-teams-chats | Every 60s | Delta sync Teams chats for active accounts |
| refresh-presence | Every 60s | Refresh presence for active contacts |
| compute-contact-scores | Every 1hr | Recalculate frequency scores for autocomplete |
| renew-calendar-webhooks | Every 1hr | Renew calendar webhook subscriptions |
| renew-teams-webhooks | Every 1hr | Renew Teams webhook subscriptions |

---

## UPDATED PLAN FEATURES

| Feature | Starter | Professional | Team | Enterprise |
|---------|---------|-------------|------|------------|
| Calendar | 1 account | 5 accounts | 10 accounts | Unlimited |
| MS Teams | ❌ | ✅ (read-only) | ✅ (full) | ✅ (full) |
| Contacts Hub | Basic | Smart autocomplete | + Groups + CRM | + Import/Export |
| Presence | ❌ | ✅ | ✅ | ✅ |
