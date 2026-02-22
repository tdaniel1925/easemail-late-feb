# MODULARITY-AND-GAPS.md — Final Audit & Modular Architecture

> **Purpose:** Close every gap between micro-features and actual implementation.
> Ensure every feature has: a database table (if needed), an API route, a UI location,
> and a build step. Also defines the modular plugin system for future features.

---

## PART 1: GAP AUDIT — FEATURES WITH NO BACKING INFRASTRUCTURE

The following features appear in MICRO-FEATURES V1/V2/V3 but are missing from
PROJECT-SPEC.md (no database schema, no API route, no build step assigned).
Each gap is closed below with the required schema, route, and agent assignment.

---

### GAP 1: Snooze

**Problem:** Snooze is in MICRO-FEATURES-V2 (Section 17) but has no table, no API, no build step.

**Database:**
```sql
CREATE TABLE snoozed_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  original_folder_id UUID NOT NULL REFERENCES account_folders(id),
  snooze_until TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'snoozed' CHECK (status IN ('snoozed', 'returned', 'cancelled')),
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);
ALTER TABLE snoozed_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_snoozes" ON snoozed_messages FOR ALL USING (user_id = auth.uid());
CREATE INDEX idx_snooze_pending ON snoozed_messages(snooze_until) WHERE status = 'snoozed';
```

**API Routes:**
- `POST /api/mail/messages/[messageId]/snooze` — snooze message (body: { until: ISO date })
- `DELETE /api/mail/messages/[messageId]/snooze` — cancel snooze
- `GET /api/mail/snoozed` — list snoozed messages

**Background Job:** `unsnooze-messages` — runs every 60s, finds messages where `snooze_until <= NOW()`, moves them back to inbox, marks as unread.

**Agent Assignment:** Agent 5, Step 5.4 (Message List) for UI, Agent 4 for API route.

---

### GAP 2: Scheduled Send

**Problem:** Schedule send in MICRO-FEATURES V1 (Section 1) but no table or background job.

**Database:**
```sql
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  draft_graph_id TEXT, -- Graph draft ID (the message is saved as draft first)
  -- Email content (backup in case draft is lost)
  to_recipients JSONB NOT NULL DEFAULT '[]',
  cc_recipients JSONB DEFAULT '[]',
  bcc_recipients JSONB DEFAULT '[]',
  subject TEXT,
  body_html TEXT,
  attachment_ids UUID[] DEFAULT '{}',
  -- Schedule
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_scheduled" ON scheduled_messages FOR ALL USING (user_id = auth.uid());
CREATE INDEX idx_scheduled_pending ON scheduled_messages(scheduled_for) WHERE status = 'scheduled';
```

**API Routes:**
- `POST /api/mail/schedule` — create scheduled message
- `GET /api/mail/scheduled` — list scheduled messages
- `PATCH /api/mail/scheduled/[id]` — reschedule or edit
- `DELETE /api/mail/scheduled/[id]` — cancel scheduled send

**Background Job:** `send-scheduled-messages` — runs every 30s, finds messages where `scheduled_for <= NOW()`, sends via Graph, updates status.

**Agent Assignment:** Agent 4 for API, Agent 5, Step 5.6 (Composer) for UI.

---

### GAP 3: Snippets / Quick Text

**Problem:** Snippets in MICRO-FEATURES-V2 (Section 16) but no table.

**Database:**
```sql
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL, -- trigger text (e.g., "thanks")
  shortcut TEXT, -- slash command: "/thanks"
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL, -- plain text version
  variables JSONB DEFAULT '[]', -- [{name, description, default_value}]
  is_shared BOOLEAN DEFAULT true, -- visible to all tenant members
  use_count INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_snippets" ON snippets FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

**API Routes:**
- `GET /api/snippets` — list snippets (with search)
- `POST /api/snippets` — create snippet
- `PATCH /api/snippets/[id]` — update snippet
- `DELETE /api/snippets/[id]` — delete snippet
- `POST /api/snippets/[id]/expand` — expand variables and return rendered HTML

**Agent Assignment:** Agent 5, Step 5.6 (Composer) for inline insertion, Step 5.8 (Settings) for management.

---

### GAP 4: Pinned Messages

**Problem:** Pin messages in MICRO-FEATURES-V2 (Section 17) but no table.

**Database:**
```sql
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES account_folders(id),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_pins" ON pinned_messages FOR ALL USING (user_id = auth.uid());
```

**API Routes:**
- `POST /api/mail/messages/[messageId]/pin` — pin message
- `DELETE /api/mail/messages/[messageId]/pin` — unpin message

**Agent Assignment:** Agent 5, Step 5.4 (Message List).

---

### GAP 5: Follow-Up Reminders

**Problem:** Follow-up reminders in MICRO-FEATURES-V2 (Section 17) but no table or job.

**Database:**
```sql
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL, -- when to remind if no reply
  status TEXT DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'replied', 'reminded', 'cancelled')),
  replied_at TIMESTAMPTZ, -- set when a reply is detected
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_reminders" ON follow_up_reminders FOR ALL USING (user_id = auth.uid());
CREATE INDEX idx_followup_pending ON follow_up_reminders(remind_at) WHERE status = 'waiting';
```

**Background Jobs:**
- `check-follow-ups` — runs every 5min:
  1. For each 'waiting' reminder where `remind_at <= NOW()`:
  2. Check if a reply exists in the thread (search by conversation_id for newer messages)
  3. If reply found: set status = 'replied'
  4. If no reply: set status = 'reminded', return message to inbox with "No reply" indicator

**API Routes:**
- `POST /api/mail/messages/[messageId]/follow-up` — set follow-up reminder
- `DELETE /api/mail/messages/[messageId]/follow-up` — cancel reminder
- `GET /api/mail/follow-ups` — list pending follow-ups

**Agent Assignment:** Agent 4 for API, Agent 5 for UI.

---

### GAP 6: Read Receipts / Open Tracking

**Problem:** Read receipts in MICRO-FEATURES-V2 (Section 17) but no table.

**Database:**
```sql
CREATE TABLE message_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  -- Graph read receipt
  read_receipt_requested BOOLEAN DEFAULT false,
  -- Pixel tracking (optional, more reliable)
  tracking_pixel_id TEXT UNIQUE, -- UUID embedded in tracking pixel URL
  open_count INTEGER DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  opens JSONB DEFAULT '[]', -- [{timestamp, ip, user_agent}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE message_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tracking" ON message_tracking FOR ALL
  USING (message_id IN (
    SELECT m.id FROM messages m
    JOIN connected_accounts ca ON m.account_id = ca.id
    WHERE ca.user_id = auth.uid()
  ));
```

**API Routes:**
- `GET /api/tracking/pixel/[trackingId].gif` — 1×1 transparent pixel, logs open event (public, no auth)
- `GET /api/mail/messages/[messageId]/tracking` — get tracking data

**Agent Assignment:** Agent 4 for API, Agent 5, Step 5.5 (Message Viewer) and Step 5.6 (Composer) for UI.

---

### GAP 7: Blocked Senders

**Problem:** Block sender in MICRO-FEATURES V1/V2 but no table.

**Database:**
```sql
CREATE TABLE blocked_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- blocked email address
  domain TEXT, -- optionally block entire domain
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);
ALTER TABLE blocked_senders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_blocks" ON blocked_senders FOR ALL USING (user_id = auth.uid());
```

**Behavior:**
- Messages from blocked senders: auto-move to Junk on sync
- Blocked senders list manageable in Settings → Security
- Block from message viewer: "Block sender" in More menu
- Sync to Graph API junk rules if possible

**API Routes:**
- `POST /api/mail/block` — block sender (body: { email } or { domain })
- `DELETE /api/mail/block/[id]` — unblock
- `GET /api/mail/blocked` — list blocked senders

---

### GAP 8: Audit Log

**Problem:** Audit trail in MICRO-FEATURES-V2 (Section 24) but no table.

**Database:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'email.send', 'email.delete', 'account.connect', etc.
  resource_type TEXT, -- 'message', 'account', 'contact', 'deal', etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}', -- action-specific data
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- No RLS — accessed via admin API only (service role)
CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
```

**Actions to log:**
- email.send, email.delete, email.move, email.forward
- account.connect, account.disconnect, account.reauth
- contact.create, contact.delete, contact.merge
- deal.create, deal.update, deal.close
- user.invite, user.remove, user.role_change
- settings.change (with before/after values)
- data.export, data.delete_request

**API Routes:**
- `GET /api/admin/audit-log` — list audit entries (admin/owner only, paginated, filterable)
- `GET /api/admin/audit-log/export` — export as CSV

**Agent Assignment:** Cross-cutting — the audit logging function is called from EVERY agent's API routes. Create `lib/audit.ts` utility in Agent 1 (Foundation).

---

### GAP 9: Quick Steps

**Problem:** Quick Steps in MICRO-FEATURES-V2 (Section 19) but no table.

**Database:**
```sql
CREATE TABLE quick_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'zap', -- lucide icon name
  keyboard_shortcut TEXT, -- e.g., "Ctrl+Shift+1"
  actions JSONB NOT NULL DEFAULT '[]',
  -- Example: [{"type": "markRead"}, {"type": "move", "folderId": "..."}, {"type": "label", "labelId": "..."}]
  sort_order INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quick_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_quicksteps" ON quick_steps FOR ALL USING (user_id = auth.uid());
```

**API Routes:**
- `GET /api/mail/quick-steps` — list quick steps
- `POST /api/mail/quick-steps` — create
- `PATCH /api/mail/quick-steps/[id]` — update
- `DELETE /api/mail/quick-steps/[id]` — delete
- `POST /api/mail/quick-steps/[id]/execute` — execute on selected messages

---

### GAP 10: Split Inbox / Focused Inbox Configuration

**Problem:** Split Inbox and Focused Inbox in MICRO-FEATURES-V2 (Section 19) but no table for user configuration.

**Database:**
```sql
CREATE TABLE inbox_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Important", "Newsletters", "Notifications"
  sort_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  -- Filter criteria (what goes in this split)
  filter_type TEXT NOT NULL CHECK (filter_type IN ('ai', 'rule')),
  -- For 'ai': the AI categorization label that maps to this split
  ai_category TEXT, -- matches messages.ai_category
  -- For 'rule': custom rule
  rule_conditions JSONB DEFAULT '[]',
  -- Visual
  icon TEXT DEFAULT 'inbox',
  color TEXT,
  -- Stats
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inbox_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_splits" ON inbox_splits FOR ALL USING (user_id = auth.uid());
```

**Default splits created on user onboarding:**
1. "Important" (ai_category = 'important') — emails needing action
2. "Other" (ai_category = 'other') — everything else
3. "Newsletters" (ai_category = 'newsletter') — detected newsletters

---

### GAP 11: Out of Office / Auto-Replies

**Problem:** Referenced in PROJECT-SPEC.md feature list but no API route or UI detail.

**API Routes:**
- `GET /api/accounts/[accountId]/auto-reply` — get auto-reply settings (via Graph: `/me/mailboxSettings/automaticRepliesSetting`)
- `PATCH /api/accounts/[accountId]/auto-reply` — update auto-reply settings

**UI Location:** Settings → Accounts → [Account] → "Out of Office" section:
- [ ] Toggle: on/off
- [ ] Schedule: start date/time, end date/time (or "Until I turn it off")
- [ ] Internal reply message (to people in your organization)
- [ ] External reply message (to people outside your organization)
- [ ] "Send replies only to contacts" toggle
- [ ] Rich text editor for both messages
- [ ] Preview: "Here's what people will see"
- [ ] Status shown on account in sidebar: "🏖 OOO until Feb 28"

---

### GAP 12: Undo Queue System

**Problem:** Undo send is described but the general undo system (undo delete, undo move, undo archive) needs a proper queue.

**Implementation (in-memory, not database):**
```typescript
// lib/undo-queue.ts
interface UndoAction {
  id: string;
  type: 'send' | 'delete' | 'move' | 'archive' | 'flag' | 'read';
  description: string; // "Message moved to Archive"
  execute: () => Promise<void>; // the forward action (already done optimistically)
  reverse: () => Promise<void>; // the undo action
  expiresAt: number; // timestamp when undo window closes
  timeout: NodeJS.Timeout; // timer to execute after window
}

class UndoQueue {
  private queue: Map<string, UndoAction>;
  enqueue(action: UndoAction): void; // add to queue, start timer
  undo(id: string): Promise<void>; // cancel timer, execute reverse
  flush(id: string): Promise<void>; // immediately execute forward action
}
```

**Behavior:**
- Every destructive action (delete, move, archive, send) goes through the undo queue
- Toast shows "Undo" button linked to the action ID
- If user clicks Undo: reverse is called, UI reverts
- If undo window expires: forward action commits (for send: actually sends via Graph)
- Queue is per-session (in-memory), not persisted to DB

---

## PART 2: MISSING USER JOURNEYS (End-to-End Verification)

I walked through every user journey and found these uncovered paths:

### Journey: Brand New User (First Time Ever)
1. ✅ Lands on marketing page → Sign up
2. ✅ Creates Supabase auth account
3. ⚠️ **GAP: Tenant creation** — When does the tenant get created? FIRST user creates a tenant automatically.
4. ✅ Connects Microsoft account
5. ✅ Onboarding wizard
6. ✅ Initial sync
7. ✅ Lands in inbox

**Fix:** Add to Step 2.1 (NextAuth): On first sign-up with no existing tenant, auto-create a Starter tenant with the user as owner.

### Journey: User Invited to Existing Tenant
1. Receives invitation email with magic link
2. ⚠️ **GAP: Invitation acceptance flow** — clicks link, creates account, auto-joins tenant
3. Connects Microsoft account
4. Onboarding (abbreviated — skip team setup)
5. Lands in inbox

**Fix needed:**
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_invitations" ON invitations FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

**API Routes:**
- `POST /api/team/invite` — send invitation
- `GET /api/auth/invite/[token]` — validate invitation token
- `POST /api/auth/invite/[token]/accept` — accept invitation, create user in tenant

### Journey: User Loses Internet Mid-Compose
1. User is composing an email
2. Internet drops
3. ⚠️ Auto-save fails → show "Save failed, will retry" (NOT lose the draft)
4. User keeps typing (all local)
5. Internet returns
6. Auto-save resumes, syncs to Graph
7. ⚠️ **GAP: Local draft storage** — need to persist draft to localStorage/IndexedDB as fallback

**Fix:** In composer auto-save logic, always save to Zustand store (in-memory) AND attempt Graph API save. If Graph fails, queue for retry. Draft content is never lost as long as the tab is open.

### Journey: Token Expires During Active Use
1. User is reading email
2. Token expires (background refresh failed)
3. ⚠️ User tries to perform action (reply, move, etc.)
4. API returns 401
5. Show per-account yellow banner: "Work account needs reconnection"
6. ⚠️ Other accounts still work normally
7. User clicks "Reconnect" → reauth flow → banner disappears

**Already covered** in spec — verified. ✅

### Journey: User Upgrades Plan
1. User on Starter clicks AI feature → sees upgrade prompt
2. Clicks "Upgrade" → billing page → selects Professional
3. ⚠️ **GAP: Feature flag refresh** — after payment, features must activate immediately
4. User returns to inbox → AI features now available

**Fix:** After Stripe webhook confirms subscription change:
1. Update tenant.plan and tenant.features in DB
2. Broadcast via Supabase Realtime to all connected clients
3. Client Zustand store updates feature flags
4. UI re-renders showing newly available features
5. No page refresh needed

---

## PART 3: MODULAR PLUGIN ARCHITECTURE

### Why Modularity Matters
EaseMail needs to support:
1. Adding new features without touching core code
2. Enabling/disabling features per plan
3. Third-party integrations in the future (Salesforce, HubSpot, Slack, etc.)
4. White-label clients who want custom modules

### Module Registry System

```typescript
// lib/modules/registry.ts

interface EaseMailModule {
  id: string;                    // 'calendar', 'teams', 'crm', 'ai', 'whitelabel'
  name: string;                  // 'Calendar'
  description: string;
  version: string;
  requiredPlan: 'starter' | 'professional' | 'team' | 'enterprise';

  // Feature flags this module provides
  features: string[];            // ['calendar.view', 'calendar.create', 'calendar.sync']

  // Database migrations this module requires
  migrations: string[];          // ['009_calendar_tables.sql']

  // API routes this module registers
  routes: ModuleRoute[];

  // Sidebar items this module adds
  sidebarItems: SidebarItem[];

  // Settings pages this module adds
  settingsPages: SettingsPage[];

  // Background jobs this module registers
  backgroundJobs: BackgroundJob[];

  // Hooks into core events
  hooks: {
    onNewMessage?: (message: Message) => Promise<void>;      // AI processing
    onMessageSend?: (message: Message) => Promise<void>;     // Audit logging
    onContactView?: (contact: Contact) => Promise<void>;     // CRM sidebar
    onComposerOpen?: (context: ComposeContext) => Promise<void>; // AI suggestions
    onSearch?: (query: string) => Promise<SearchResult[]>;   // Extended search
  };

  // Initialization
  initialize: () => Promise<void>;
  teardown: () => Promise<void>;
}

// Module registry
class ModuleRegistry {
  private modules: Map<string, EaseMailModule> = new Map();

  register(module: EaseMailModule): void;
  unregister(moduleId: string): void;
  isEnabled(moduleId: string, tenantPlan: string): boolean;
  getModule(moduleId: string): EaseMailModule | undefined;
  getEnabledModules(tenantPlan: string): EaseMailModule[];

  // Execute hooks across all enabled modules
  async executeHook<T extends keyof EaseMailModule['hooks']>(
    hook: T,
    ...args: Parameters<NonNullable<EaseMailModule['hooks'][T]>>
  ): Promise<void>;
}

export const moduleRegistry = new ModuleRegistry();
```

### Core Modules (built-in)

| Module ID | Required Plan | Sidebar Item | Description |
|-----------|--------------|--------------|-------------|
| `email` | starter | ✅ Mail | Core email (always enabled) |
| `contacts` | starter | ✅ Contacts | Basic contact management |
| `ai` | professional | — (embedded) | AI drafting, summarization, labels |
| `calendar` | professional | ✅ Calendar | Calendar sync and management |
| `teams-chat` | team | ✅ Teams | MS Teams chat integration |
| `crm` | team | ✅ CRM | Contact/deal management |
| `shared-inbox` | team | ✅ (in sidebar) | Shared inbox management |
| `whitelabel` | enterprise | — (settings) | Custom branding |

### How Modules Integrate

**Sidebar:** Each module registers sidebar items. The sidebar renderer queries enabled modules and renders their items in order.

```typescript
// Example: Calendar module sidebar registration
const calendarModule: EaseMailModule = {
  id: 'calendar',
  sidebarItems: [{
    id: 'calendar',
    label: 'Calendar',
    icon: 'Calendar',
    path: '/calendar',
    position: 'main', // 'main' | 'bottom'
    sortOrder: 20, // after mail (10), before teams (30)
    badge: () => getPendingInvitationCount(), // dynamic badge
  }],
  // ...
};
```

**Settings:** Each module registers settings pages. The settings navigation auto-includes them.

**API Routes:** Next.js App Router dynamic routes. Modules register their route handlers.

**Hooks:** When core events fire (new message, send, etc.), the registry calls all registered hooks. This is how AI processing triggers on new messages, audit logging triggers on sends, and CRM sidebar data loads on contact view.

### Adding a Future Module (Example: Slack Integration)

To add Slack integration in the future, you'd create:

```
lib/modules/slack/
  ├── index.ts          (module definition implementing EaseMailModule)
  ├── slack-client.ts   (Slack API client)
  ├── sync.ts           (channel/message sync)
  └── ui/
      ├── SlackSidebar.tsx
      └── SlackSettings.tsx

supabase/migrations/
  └── 015_slack_tables.sql

app/api/slack/
  └── [...slack]/route.ts
```

Register it:
```typescript
import { slackModule } from '@/lib/modules/slack';
moduleRegistry.register(slackModule);
```

It automatically gets: sidebar item, settings page, background jobs, hook integration.
No changes needed to core email, calendar, teams, or any other module.

### Feature Flag System

```typescript
// lib/features.ts

// Checks if a feature is available for the current tenant
function isFeatureEnabled(feature: string, tenant: Tenant): boolean {
  // Check plan-level features
  const planFeatures = PLAN_FEATURES[tenant.plan];
  if (!planFeatures.includes(feature)) return false;

  // Check tenant-specific overrides (for custom enterprise deals)
  if (tenant.features[feature] === false) return false;
  if (tenant.features[feature] === true) return true;

  return planFeatures.includes(feature);
}

// Usage in components
function AIButton() {
  const { tenant } = useTenant();
  if (!isFeatureEnabled('ai.draft', tenant)) {
    return <UpgradePrompt feature="ai.draft" />;
  }
  return <Button onClick={generateDraft}>AI Draft</Button>;
}

// Usage in API routes
async function POST(req: Request) {
  const tenant = await getTenant(req);
  if (!isFeatureEnabled('ai.draft', tenant)) {
    return Response.json({ error: 'Upgrade required' }, { status: 403 });
  }
  // ... proceed
}
```

### Plan Features Map

```typescript
const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'email.*',           // all email features
    'contacts.basic',    // basic contact list
    'folders.*',         // all folder management
    'search.basic',      // basic search
    'rules.basic',       // up to 10 rules
    'templates.basic',   // up to 10 templates
    'signatures.*',      // unlimited signatures
    'labels.basic',      // up to 20 labels
    'settings.*',        // all settings
  ],
  professional: [
    '...starter',
    'ai.*',              // all AI features
    'calendar.*',        // full calendar
    'contacts.advanced', // smart autocomplete, frequency scoring
    'search.advanced',   // advanced filters, AI search
    'accounts.multi',    // up to 5 accounts
    'rules.unlimited',
    'templates.unlimited',
    'labels.unlimited',
    'snooze.*',
    'scheduled_send.*',
    'read_receipts.*',
    'follow_up.*',
    'snippets.*',
    'quick_steps.*',
    'split_inbox.*',
  ],
  team: [
    '...professional',
    'teams_chat.*',      // MS Teams integration
    'crm.*',             // full CRM
    'shared_inbox.*',    // shared inboxes
    'contacts.groups',   // contact groups
    'contacts.import',   // CSV import/export
    'accounts.multi_10', // up to 10 accounts
    'audit_log.*',
    'presence.*',
  ],
  enterprise: [
    '...team',
    'whitelabel.*',      // custom branding
    'custom_domain.*',   // custom domain
    'accounts.unlimited',
    'sso.*',             // future: SAML SSO
    'data_retention.*',  // retention policies
    'legal_hold.*',      // legal holds
    'api_access.*',      // future: API access for integrations
    'priority_support',
  ],
};
```

---

## PART 4: UPDATED BACKGROUND JOBS (COMPLETE LIST)

| Job | Schedule | Module | Purpose |
|-----|----------|--------|---------|
| `token-refresh` | Every 60s | email (core) | Proactively refresh expiring tokens |
| `sync-inbox` | Every 30s | email (core) | Delta sync inbox for all active accounts |
| `sync-folders` | Every 5min | email (core) | Delta sync non-inbox folders |
| `renew-mail-webhooks` | Every 1hr | email (core) | Renew Graph mail subscriptions |
| `unsnooze-messages` | Every 60s | email (core) | Return snoozed messages to inbox |
| `send-scheduled-messages` | Every 30s | email (core) | Send scheduled emails |
| `check-follow-ups` | Every 5min | email (core) | Check for unreplied follow-ups |
| `cleanup-deleted` | Daily 2am | email (core) | Purge soft-deleted messages >30 days |
| `ai-process` | On new message | ai | Summarize, score, categorize new messages |
| `sync-calendars` | Every 5min | calendar | Delta sync calendars |
| `renew-calendar-webhooks` | Every 1hr | calendar | Renew calendar subscriptions |
| `sync-teams-chats` | Every 60s | teams-chat | Delta sync Teams chats |
| `refresh-presence` | Every 60s | teams-chat | Refresh presence for active contacts |
| `renew-teams-webhooks` | Every 1hr | teams-chat | Renew Teams subscriptions |
| `compute-contact-scores` | Every 1hr | contacts | Recalculate frequency scores |
| `process-invitations` | Every 5min | core | Expire old invitations |
| `stripe-webhook-handler` | On event | billing | Process subscription changes |
| `auto-draft-followups` | Every 1hr | ai | Generate AI follow-up drafts |

---

## PART 5: FINAL FILE INVENTORY

After this pass, the complete .forge package contains:

| File | Purpose | Lines |
|------|---------|-------|
| PROJECT-SPEC.md | Architecture, schema, gates, build steps (Agents 1-8) | ~2,400 |
| BUILD-STATE.md | Progress tracker for all 73 build steps | ~120 |
| CLAUDE-CODE-INSTRUCTIONS.md | Exact prompts for Claude Code per step | ~230 |
| UI-DESIGN-SYSTEM.md | Visual design rules, components, anti-patterns | ~620 |
| ADDITIONAL-AGENTS.md | Agents 9-11: Calendar, Teams, Contacts | ~950 |
| MICRO-FEATURES.md | V1: 458 features (email core) | ~670 |
| MICRO-FEATURES-V2.md | V2: 239 features (missed email + AI) | ~390 |
| MICRO-FEATURES-V3.md | V3: 541 features (contacts, settings, teams, CRM, admin) | ~790 |
| MODULARITY-AND-GAPS.md | Gap closure, 12 missing tables, plugin architecture | ~this file |

**Totals:**
- 1,238+ micro-features
- 73 build steps across 11 agents
- 11 manual checkpoints
- 50+ database tables
- 18 background jobs
- Modular plugin system for future extensibility
