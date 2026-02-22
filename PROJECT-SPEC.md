# PROJECT-SPEC.md — EaseMail v3.0

> **AI-Powered Multi-Account Email Client for Professional Services**
> Version: 3.0 | Status: SPEC COMPLETE
> Author: BotMakers Inc. | Target: SaaS Subscription Product
> Stack: Next.js 14 (App Router) + Supabase + Microsoft Graph API + Claude API
> Build Method: Claude Code with Task Subagents — 8 agents, 42 build steps, 42 test gates

---

## WHY THIS BUILD IS DIFFERENT

Previous EaseMail builds failed because Claude Code generated the entire app in ~7 prompts
with no validation between steps. The result: thousands of lines of confident-looking code
riddled with silent failures at every integration point.

**This spec is also a build system.** It enforces:

1. **42 atomic build steps** — each step produces ONE testable unit of functionality
2. **Automated test gates** — every step includes a test script that MUST pass before proceeding
3. **Manual checkpoints** — 8 major stages where Daniel verifies in browser before sign-off
4. **No skipping** — BUILD-STATE.md tracks pass/fail for every step; agents cannot proceed on failure
5. **Error isolation** — when something breaks, you know EXACTLY which step introduced the bug

**Rule for Claude Code agents:** You MUST run the test for your current step. If it fails,
fix your code until it passes. Do NOT proceed to the next step. Do NOT generate code for
future steps. One step at a time.

---

## EXECUTIVE SUMMARY

EaseMail is a multi-tenant SaaS email client connecting to Microsoft 365/Outlook via Graph API.
It targets professional services firms (legal, insurance, healthcare, accounting) — initially
BotMakers clients, expanding to general SaaS market.

**Core capabilities:**
- Multi-account management (personal + work + shared accounts per user)
- Full Outlook-parity email operations (folders, rules, categories, search, attachments)
- AI-powered drafting, summarization, smart replies, priority scoring
- Shared team inboxes with assignment, collision detection, internal notes
- CRM integration (contacts → deals → activity tracking)
- White-label branding per tenant
- Real-time sync via Graph API delta queries + webhooks

**Monetization:** Monthly SaaS per seat
| Plan | Price | Accounts | AI | Teams | White-label |
|------|-------|----------|----|-------|-------------|
| Starter | $9/seat/mo | 1 | No | No | No |
| Professional | $19/seat/mo | 5 | Yes | No | No |
| Team | $29/seat/mo | 10 | Yes | Yes | No |
| Enterprise | $49/seat/mo | Unlimited | Yes | Yes | Yes |

---

## GATE 0 — IDENTITY

### Brand
- **Name:** EaseMail
- **Tagline:** "Your inbox, simplified. Your team, connected."
- **Domain:** easemail.app (production) / app.easemail.app (main app)
- **Tenant subdomains:** {slug}.easemail.app

### Design Language
- **Style:** Ledger-style UI — rounded cards, mesh gradient accents, clean whitespace
- **Primary:** Coral `#FF7F50`
- **Secondary:** Deep Navy `#0D1B2A`
- **Accent:** Soft Teal `#20B2AA`
- **Success:** `#10B981` | Warning: `#F59E0B` | Error: `#EF4444`
- **Background Light:** `#FAFBFC` | Dark: `#0F1419`
- **Surface Light:** `#FFFFFF` | Dark: `#1A1F2E`
- **Font UI:** Inter | Font Mono: Geist Mono
- **Radius:** 12px cards, 8px buttons, 6px inputs
- **Dark mode:** System detection + manual toggle, stored in user preferences

### Target Personas
| Persona | Industry | Key Need |
|---------|----------|----------|
| Sarah, Attorney | Legal (15-person firm) | Multi-account, AI drafting, shared inbox for firm@ |
| Marcus, Agency Owner | Insurance | Team inbox for claims@, AI thread summarization |
| Priya, Firm Manager | Accounting | White-labeled email, AI templates, shared support@ |
| James, Admin | Healthcare | HIPAA-aware handling, AI triage, multi-account |

---

## GATE 1 — ENTITIES

### Entity Relationship Diagram

```
tenants ─────────────────────────────────────────────────────┐
  │                                                          │
  ├── users (many)                                           │
  │     ├── connected_accounts (many per user)               │
  │     │     ├── account_folders (synced from Graph)        │
  │     │     │     └── messages (synced from Graph)         │
  │     │     │           ├── attachments                    │
  │     │     │           └── message_labels (M2M)           │
  │     │     ├── account_contacts (synced from Graph)       │
  │     │     ├── account_tokens (one per account)           │
  │     │     ├── sync_state (one per folder)                │
  │     │     └── webhook_subscriptions                      │
  │     ├── user_preferences (one per user)                  │
  │     └── team_memberships (M2M with teams)                │
  │                                                          │
  ├── teams (many per tenant)                                │
  │     ├── shared_inboxes (many per team)                   │
  │     │     ├── inbox_assignments                          │
  │     │     └── inbox_notes (internal)                     │
  │     └── team_members                                     │
  │                                                          │
  ├── labels (tenant-scoped)                                 │
  ├── email_templates (tenant-scoped)                        │
  ├── email_signatures (per user + per account)              │
  ├── tenant_branding (one per tenant)                       │
  │                                                          │
  └── CRM module                                             │
        ├── crm_contacts (linked to account_contacts)        │
        ├── crm_companies                                    │
        ├── crm_deals                                        │
        ├── crm_activities (auto-logged from email)          │
        └── crm_notes                                        │
```

### Complete Database Schema

```sql
-- ================================================================
-- TENANTS
-- ================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'professional', 'team', 'enterprise')),
  max_seats INTEGER NOT NULL DEFAULT 1,
  max_accounts_per_user INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{
    "ai_enabled": false,
    "teams_enabled": false,
    "whitelabel_enabled": false,
    "crm_enabled": false,
    "max_shared_inboxes": 0,
    "max_templates": 10
  }',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- USERS
-- ================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  onboarded_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ================================================================
-- USER PREFERENCES
-- ================================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  density TEXT DEFAULT 'comfortable' CHECK (density IN ('compact', 'comfortable', 'spacious')),
  default_account_id UUID, -- FK added after connected_accounts created
  reading_pane TEXT DEFAULT 'right' CHECK (reading_pane IN ('right', 'bottom', 'off')),
  notifications_enabled BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  conversation_view BOOLEAN DEFAULT true, -- group by thread
  auto_advance TEXT DEFAULT 'next' CHECK (auto_advance IN ('next', 'previous', 'list')),
  signature_id UUID, -- FK added after signatures created
  ai_tone TEXT DEFAULT 'professional'
    CHECK (ai_tone IN ('professional', 'friendly', 'concise', 'formal')),
  ai_auto_summarize BOOLEAN DEFAULT false,
  ai_smart_replies BOOLEAN DEFAULT true,
  keyboard_shortcuts BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'America/Chicago',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CONNECTED ACCOUNTS (heart of multi-account)
-- Each row = one Microsoft account connected via OAuth
-- ================================================================
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Microsoft identity
  microsoft_id TEXT NOT NULL, -- Graph API user ID
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tenant_id_ms TEXT, -- Microsoft tenant ID (for org accounts)
  account_type TEXT DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'work', 'shared')),
  -- Connection status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'needs_reauth', 'disabled', 'syncing', 'error')),
  status_message TEXT, -- human-readable error if status = error
  last_error_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  -- Display
  color TEXT DEFAULT '#FF7F50', -- account color for visual distinction
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false, -- default "send from" account
  -- Sync metadata
  initial_sync_complete BOOLEAN DEFAULT false,
  last_full_sync_at TIMESTAMPTZ,
  messages_synced INTEGER DEFAULT 0,
  -- Constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, microsoft_id)
);

-- ================================================================
-- ACCOUNT TOKENS (encrypted, separate from accounts for security)
-- ================================================================
CREATE TABLE account_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- encrypted at rest via Supabase vault
  refresh_token TEXT NOT NULL, -- encrypted at rest
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  -- Refresh tracking
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  refresh_failure_count INTEGER DEFAULT 0,
  last_refresh_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ACCOUNT FOLDERS (synced from Graph)
-- ================================================================
CREATE TABLE account_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL, -- Microsoft Graph folder ID
  parent_graph_id TEXT, -- for nested folders
  display_name TEXT NOT NULL,
  folder_type TEXT DEFAULT 'custom'
    CHECK (folder_type IN (
      'inbox', 'drafts', 'sentitems', 'deleteditems', 'junkemail',
      'archive', 'outbox', 'scheduled', 'custom'
    )),
  total_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  -- Custom folder settings
  is_favorite BOOLEAN DEFAULT false,
  custom_color TEXT,
  -- Sync
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, graph_id)
);

-- ================================================================
-- MESSAGES (synced from Graph, cached locally)
-- ================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES account_folders(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL, -- Microsoft Graph message ID
  internet_message_id TEXT, -- RFC 2822 Message-ID for threading
  conversation_id TEXT, -- Graph conversation ID for threading
  conversation_index BYTEA, -- for thread ordering
  -- Envelope
  subject TEXT,
  preview TEXT, -- first ~200 chars of body
  from_address TEXT,
  from_name TEXT,
  to_recipients JSONB DEFAULT '[]', -- [{email, name}]
  cc_recipients JSONB DEFAULT '[]',
  bcc_recipients JSONB DEFAULT '[]',
  reply_to JSONB DEFAULT '[]',
  -- Body (stored locally for fast access + AI processing)
  body_html TEXT,
  body_text TEXT, -- plain text extraction for AI
  body_content_type TEXT DEFAULT 'html' CHECK (body_content_type IN ('html', 'text')),
  -- Flags
  is_read BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false, -- soft delete before Graph sync
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
  -- Categories (Outlook categories synced)
  categories TEXT[] DEFAULT '{}',
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachment_count INTEGER DEFAULT 0,
  -- Dates
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- AI-generated fields
  ai_summary TEXT,
  ai_priority_score REAL, -- 0.0 to 1.0
  ai_category TEXT, -- auto-categorized
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ai_processed_at TIMESTAMPTZ,
  -- Indexing
  UNIQUE(account_id, graph_id)
);

-- Full-text search index
CREATE INDEX idx_messages_fts ON messages
  USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '')));

-- Query performance indexes
CREATE INDEX idx_messages_account_folder ON messages(account_id, folder_id, received_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_received ON messages(received_at DESC);
CREATE INDEX idx_messages_unread ON messages(account_id, is_read) WHERE is_read = false;

-- ================================================================
-- ATTACHMENTS
-- ================================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  is_inline BOOLEAN DEFAULT false,
  content_id TEXT, -- for inline images
  -- Storage: small attachments cached in Supabase Storage, large via Graph on-demand
  storage_path TEXT, -- Supabase Storage path if cached
  is_cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- LABELS (tenant-scoped, applied to messages)
-- ================================================================
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FF7F50',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE message_labels (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, label_id)
);

-- ================================================================
-- SYNC STATE (per folder per account)
-- ================================================================
CREATE TABLE sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES account_folders(id) ON DELETE CASCADE,
  delta_link TEXT, -- Graph API delta link for incremental sync
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle'
    CHECK (sync_status IN ('idle', 'syncing', 'error', 'backoff')),
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  messages_processed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, folder_id)
);

-- ================================================================
-- WEBHOOK SUBSCRIPTIONS (per account, auto-renewed)
-- ================================================================
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_subscription_id TEXT NOT NULL,
  resource TEXT NOT NULL, -- e.g. "me/mailFolders('Inbox')/messages"
  change_types TEXT[] NOT NULL DEFAULT '{created,updated,deleted}',
  expiration_at TIMESTAMPTZ NOT NULL,
  client_state TEXT NOT NULL, -- validation secret
  notification_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_notification_at TIMESTAMPTZ,
  renewal_failures INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- EMAIL SIGNATURES
-- ================================================================
CREATE TABLE email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES connected_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  body_html TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- EMAIL TEMPLATES (tenant-scoped)
-- ================================================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  subject TEXT,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- [{name, description, default_value}]
  category TEXT,
  is_shared BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ACCOUNT CONTACTS (synced from Graph)
-- ================================================================
CREATE TABLE account_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT,
  email TEXT NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  avatar_url TEXT,
  -- Frequency tracking for smart autocomplete
  email_count INTEGER DEFAULT 0,
  last_emailed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'graph' CHECK (source IN ('graph', 'manual', 'inferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, email)
);

-- ================================================================
-- TEAMS & SHARED INBOXES
-- ================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE shared_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Support", "Claims", "Billing"
  description TEXT,
  auto_assign_strategy TEXT DEFAULT 'round_robin'
    CHECK (auto_assign_strategy IN ('round_robin', 'load_balanced', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inbox_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_inbox_id UUID NOT NULL REFERENCES shared_inboxes(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shared_inbox_id, message_id)
);

CREATE TABLE inbox_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES inbox_assignments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- internal notes never sent to customer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CRM MODULE
-- ================================================================
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  job_title TEXT,
  phone TEXT,
  address JSONB,
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'email' CHECK (source IN ('email', 'manual', 'import')),
  -- Linked account contact
  account_contact_id UUID REFERENCES account_contacts(id) ON DELETE SET NULL,
  -- Metrics
  total_emails INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  stage TEXT DEFAULT 'lead'
    CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('email_sent', 'email_received', 'note', 'call', 'meeting', 'task')),
  subject TEXT,
  body TEXT,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TENANT BRANDING (white-label)
-- ================================================================
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Visual
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#FF7F50',
  secondary_color TEXT DEFAULT '#0D1B2A',
  accent_color TEXT DEFAULT '#20B2AA',
  -- Custom domain
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  -- Email branding
  email_from_name TEXT,
  email_footer_html TEXT,
  -- Login page
  login_background_url TEXT,
  login_tagline TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- MAIL RULES (synced from Graph + custom EaseMail rules)
-- ================================================================
CREATE TABLE mail_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_rule_id TEXT, -- null if EaseMail-only rule
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  -- Conditions (AND logic within, OR across condition groups)
  conditions JSONB NOT NULL DEFAULT '[]',
  -- Example: [{"field": "from", "operator": "contains", "value": "@lawfirm.com"},
  --           {"field": "subject", "operator": "startsWith", "value": "RE:"}]
  -- Actions
  actions JSONB NOT NULL DEFAULT '[]',
  -- Example: [{"type": "move", "folderId": "..."}, {"type": "label", "labelId": "..."},
  --           {"type": "flag"}, {"type": "markRead"}, {"type": "autoReply", "templateId": "..."}]
  stop_processing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- PERFORMANCE INDEXES
-- ================================================================
-- These indexes are critical for query performance at scale.
-- Every frequently-queried column combination should have an index.

-- CONNECTED ACCOUNTS
CREATE INDEX idx_connected_accounts_user ON connected_accounts(user_id, status);
CREATE INDEX idx_connected_accounts_email ON connected_accounts(email);
CREATE INDEX idx_connected_accounts_sync ON connected_accounts(user_id)
  WHERE initial_sync_complete = false;

-- ACCOUNT_FOLDERS
CREATE INDEX idx_folders_account ON account_folders(account_id, folder_type);
CREATE INDEX idx_folders_unread ON account_folders(account_id) WHERE unread_count > 0;
CREATE INDEX idx_folders_parent ON account_folders(parent_graph_id);

-- MESSAGES (most critical - will have millions of rows)
-- Note: Some indexes already defined inline with table creation
CREATE INDEX idx_messages_folder_received ON messages(folder_id, received_at DESC);
CREATE INDEX idx_messages_is_draft ON messages(account_id) WHERE is_draft = true;
CREATE INDEX idx_messages_flagged ON messages(account_id) WHERE is_flagged = true;
CREATE INDEX idx_messages_from ON messages(from_address, received_at DESC);
CREATE INDEX idx_messages_ai_priority ON messages(account_id, ai_priority_score DESC NULLS LAST);
CREATE INDEX idx_messages_has_attachments ON messages(account_id) WHERE has_attachments = true;

-- MESSAGE_LABELS (M2M junction table - needs covering index)
CREATE INDEX idx_message_labels_label ON message_labels(label_id, message_id);
CREATE INDEX idx_message_labels_created ON message_labels(created_at DESC);

-- ATTACHMENTS
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_cached ON attachments(message_id) WHERE is_cached = false;

-- ACCOUNT_CONTACTS (for autocomplete performance)
CREATE INDEX idx_contacts_account ON account_contacts(account_id, email);
CREATE INDEX idx_contacts_email_count ON account_contacts(account_id, email_count DESC);
CREATE INDEX idx_contacts_last_emailed ON account_contacts(last_emailed_at DESC NULLS LAST);
CREATE INDEX idx_contacts_name ON account_contacts(display_name text_pattern_ops);

-- SYNC_STATE
CREATE INDEX idx_sync_state_status ON sync_state(sync_status, next_retry_at);
CREATE INDEX idx_sync_state_account ON sync_state(account_id, last_sync_at);

-- WEBHOOK_SUBSCRIPTIONS
CREATE INDEX idx_webhooks_expiration ON webhook_subscriptions(expiration_at) WHERE is_active = true;
CREATE INDEX idx_webhooks_account ON webhook_subscriptions(account_id, is_active);

-- EMAIL_SIGNATURES
CREATE INDEX idx_signatures_user ON email_signatures(user_id, is_default);
CREATE INDEX idx_signatures_account ON email_signatures(account_id);

-- EMAIL_TEMPLATES
CREATE INDEX idx_templates_tenant ON email_templates(tenant_id, is_shared);
CREATE INDEX idx_templates_use_count ON email_templates(tenant_id, use_count DESC);
CREATE INDEX idx_templates_category ON email_templates(category);

-- TEAMS & SHARED INBOXES
CREATE INDEX idx_team_members_user ON team_members(user_id, team_id);
CREATE INDEX idx_shared_inboxes_team ON shared_inboxes(team_id);
CREATE INDEX idx_inbox_assignments_user ON inbox_assignments(assigned_to, status);
CREATE INDEX idx_inbox_assignments_message ON inbox_assignments(message_id);
CREATE INDEX idx_inbox_notes_message ON inbox_notes(message_id, created_at DESC);

-- CRM MODULE
CREATE INDEX idx_crm_contacts_tenant ON crm_contacts(tenant_id, email);
CREATE INDEX idx_crm_contacts_account_contact ON crm_contacts(account_contact_id);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_companies_tenant ON crm_companies(tenant_id, name);
CREATE INDEX idx_crm_deals_tenant ON crm_deals(tenant_id, stage, created_at DESC);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_crm_activities_tenant ON crm_activities(tenant_id, activity_type, performed_at DESC);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);

-- TENANT_BRANDING
CREATE INDEX idx_branding_domain ON tenant_branding(custom_domain) WHERE custom_domain IS NOT NULL;

-- MAIL_RULES
CREATE INDEX idx_mail_rules_account ON mail_rules(account_id, priority) WHERE is_enabled = true;

-- USER_PREFERENCES
-- (No additional indexes needed - user_id is unique)

-- LABELS
CREATE INDEX idx_labels_tenant ON labels(tenant_id, sort_order);

-- JOB_FAILURES (from Step 1.6)
-- (Indexes defined inline with table creation)

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_inboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_rules ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: Users access data through their tenant
-- Pattern: user → users.tenant_id → filter by tenant_id
CREATE POLICY "tenant_isolation" ON users
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "own_accounts" ON connected_accounts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_tokens" ON account_tokens
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_folders" ON account_folders
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_messages" ON messages
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_attachments" ON attachments
  FOR ALL USING (message_id IN (
    SELECT m.id FROM messages m
    JOIN connected_accounts ca ON m.account_id = ca.id
    WHERE ca.user_id = auth.uid()
  ));

-- Tenant-scoped policies (all tenant members can access)
CREATE POLICY "tenant_labels" ON labels
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_templates" ON email_templates
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_crm" ON crm_contacts
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Team-scoped policies
CREATE POLICY "team_access" ON shared_inboxes
  FOR ALL USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));
```

---

## GATE 2 — STATE CHANGES

### Account Lifecycle
```
[disconnected] → connect_account() → [syncing]
[syncing] → initial_sync_complete → [active]
[active] → token_expired → [needs_reauth]
[needs_reauth] → reauth_success → [active]
[needs_reauth] → reauth_failed_3x → [disabled]
[active] → user_disconnect → [disconnected] → DELETE
[any] → fatal_error → [error]
[error] → retry_success → [active]
```

### Message Lifecycle
```
[not_synced] → delta_sync → [synced]
[synced] → user_read → [read] (PATCH to Graph)
[synced] → user_flag → [flagged] (PATCH to Graph)
[synced] → user_move → [moved] (POST move to Graph)
[synced] → user_delete → [trashed] (POST move to Graph)
[trashed] → user_permanent_delete → [deleted] (DELETE from Graph)
[any] → graph_webhook_update → re-sync from Graph
```

### Draft Lifecycle
```
[empty] → user_starts_compose → [composing]
[composing] → auto_save_5s → [draft_saved] (POST/PATCH to Graph)
[draft_saved] → user_edits → [composing] → auto_save_5s → [draft_saved]
[draft_saved] → user_sends → [sending] → send_via_graph → [sent]
[composing] → user_discards → [deleted] (DELETE from Graph)
[sending] → send_failed → [draft_saved] + error notification
```

### Sync Engine State Machine
```
Per-folder sync:
[idle] → trigger (timer/webhook/manual) → [syncing]
[syncing] → delta_query_success → [processing]
[processing] → all_changes_applied → [idle] (update delta_link)
[syncing] → 401_error → refresh_token → retry
[syncing] → 429_throttled → [backoff] → exponential_wait → [syncing]
[syncing] → fatal_error → [error] → notify_user
[backoff] → wait_complete → [syncing]

Global sync orchestrator:
- Runs sync for each active account's folders
- Inbox syncs every 30 seconds
- Other folders sync every 5 minutes
- Webhook notifications trigger immediate targeted sync
- Manual refresh triggers all folders for that account
```

### Token Refresh State Machine
```
[valid] → check_expiry → if < 5min remaining → [refreshing]
[refreshing] → msal_refresh_success → [valid] (update tokens in DB)
[refreshing] → msal_refresh_failed → increment failure count
  → if failures < 3 → exponential_backoff → [refreshing]
  → if failures >= 3 → [expired] → set account status 'needs_reauth'
[expired] → user_reauths → new_oauth_flow → [valid]

CRITICAL: Token refresh is PROACTIVE, not reactive.
A background job checks all tokens every 60 seconds.
If a token expires in < 5 minutes, refresh it NOW.
Never wait for a 401 to trigger refresh.
```

---

## GATE 3 — PERMISSIONS

### Role Matrix

| Resource | Owner | Admin | Member | Guest |
|----------|-------|-------|--------|-------|
| Tenant settings | CRUD | RU | R | - |
| Billing | CRUD | R | - | - |
| Users | CRUD | CRUD | R (team only) | - |
| Own accounts | CRUD | CRUD | CRUD | - |
| Own messages | CRUD | CRUD | CRUD | R |
| Labels | CRUD | CRUD | RU | R |
| Templates | CRUD | CRUD | CRUD | R |
| Teams | CRUD | CRUD | R | - |
| Shared inboxes | CRUD | CRUD | RU (if member) | R |
| CRM contacts | CRUD | CRUD | CRUD | R |
| CRM deals | CRUD | CRUD | CRUD | - |
| Branding | CRUD | CRUD | R | - |
| Mail rules | - | - | CRUD (own) | - |

### API Authentication Flow
```
1. User hits app → Supabase Auth session cookie
2. API route checks auth.uid() → gets user + tenant
3. For Graph API calls: API route looks up connected_account → gets token
4. If token expired: proactive refresh (should already be refreshed by background job)
5. If refresh fails: return 401 to client → client shows reauth prompt
6. All Supabase queries filtered by RLS (tenant_id or user_id)
```

### Microsoft Graph Scopes Required
```
MINIMUM (Phase 1):
  Mail.ReadWrite, Mail.Send, User.Read, Contacts.Read,
  offline_access, openid, profile

FULL (All features):
  + MailboxSettings.ReadWrite, Contacts.ReadWrite, People.Read,
  + Calendars.Read, Files.Read, Files.ReadWrite, User.ReadBasic.All
```

---

## GATE 4 — DEPENDENCIES & AUTOMATION

### Tech Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | SSR + API routes |
| Auth | Supabase Auth + NextAuth.js | User auth + Microsoft OAuth |
| Database | Supabase PostgreSQL | All application data |
| Storage | Supabase Storage | Avatars, attachments, branding assets |
| Graph API | @microsoft/microsoft-graph-client | Email operations |
| MSAL | @azure/msal-node | OAuth token management |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Drafting, summarization, smart replies |
| UI | Tailwind CSS + shadcn/ui | Component library |
| Email Rendering | DOMPurify + custom sanitizer | Safe HTML email display |
| Rich Text Editor | Tiptap | Compose/reply editor |
| State Management | Zustand | Client-side state |
| Real-time | Supabase Realtime | Live updates across tabs |
| Jobs | Supabase Edge Functions (cron) | Token refresh, sync, webhook renewal |
| Payments | Stripe | Subscription billing |
| Deployment | Vercel | Hosting + edge functions |
| Monitoring | Sentry | Error tracking |

### Background Jobs (Supabase Edge Functions)
| Job | Schedule | Purpose |
|-----|----------|---------|
| token-refresh | Every 60s | Proactively refresh tokens expiring in < 5min |
| sync-inbox | Every 30s | Delta sync inbox for all active accounts |
| sync-folders | Every 5min | Delta sync non-inbox folders |
| renew-webhooks | Every 1hr | Renew Graph subscriptions expiring in < 12hrs |
| ai-process | On new message | Summarize, score priority, detect sentiment |
| cleanup-deleted | Daily 2am | Purge soft-deleted messages older than 30 days |

### Key Integrations
| Integration | Purpose | API |
|-------------|---------|-----|
| Microsoft Graph | Email, contacts, calendar, files | REST v1.0 |
| Anthropic Claude | AI features | Messages API |
| Stripe | Billing | Checkout + Webhooks |
| Supabase Realtime | Live sync notifications | WebSocket |
| Vercel | Deployment + edge | CLI + Git |
| Sentry | Error monitoring | SDK |

---

## GATE 5 — INTEGRATIONS & FEATURES

### Feature Inventory

#### Email Core (Outlook Parity)
- [ ] Multi-account management (connect, switch, disconnect, reauth)
- [ ] Unified inbox (all accounts merged by date)
- [ ] Per-account inbox view
- [ ] Folder tree with nested folders, counts, favorites
- [ ] Create, rename, move, delete custom folders
- [ ] Read messages with HTML rendering (safe, sanitized)
- [ ] Conversation/thread view with collapsible messages
- [ ] Compose new email with rich text editor (Tiptap)
- [ ] Reply, Reply All, Forward
- [ ] Draft auto-save (5-second debounce)
- [ ] Send with account selector ("Send from" dropdown)
- [ ] Attachments: upload, download, inline images, drag-and-drop
- [ ] Large attachment support (upload session for > 3MB)
- [ ] Mark read/unread, flag/unflag
- [ ] Move messages between folders (drag-and-drop + menu)
- [ ] Delete (move to trash) and permanent delete
- [ ] Search across all accounts (full-text + filters)
- [ ] Advanced search: from, to, date range, has attachment, folder
- [ ] Sort: date, from, subject, size, importance
- [ ] Categories/labels (Graph categories + EaseMail labels)
- [ ] Mail rules (create, edit, delete, sync with Graph)
- [ ] Auto-replies / Out of Office settings
- [ ] Email signatures (per account, rich text)
- [ ] Email templates with variable substitution
- [ ] Keyboard shortcuts (Gmail-style + Outlook-style profiles)
- [ ] Reading pane: right, bottom, or off
- [ ] Density: compact, comfortable, spacious
- [ ] Message preview length configurable
- [ ] Notification badges per account/folder
- [ ] Undo send (delay send by 5/10/30 seconds)
- [ ] Schedule send (pick date/time)
- [ ] Print message

#### AI Features (Professional plan+)
- [ ] AI email drafting (tone: professional, friendly, concise, formal)
- [ ] AI reply suggestions (3 options per message)
- [ ] Thread summarization (one-click summary of long threads)
- [ ] Priority scoring (0-1 score based on sender, content, urgency)
- [ ] Smart categorization (auto-label based on content analysis)
- [ ] Sentiment detection (positive, neutral, negative, urgent)
- [ ] AI-powered search (natural language → Graph query)
- [ ] Template generation from past emails
- [ ] Grammar/tone check before send
- [ ] Auto-summarize toggle (summarize every new message automatically)

#### Shared Inboxes (Team plan+)
- [ ] Create shared inbox linked to a connected account
- [ ] Assign conversations to team members
- [ ] Auto-assignment (round robin, load balanced, manual)
- [ ] Assignment status tracking (open → assigned → resolved → closed)
- [ ] Internal notes on conversations (never visible to customer)
- [ ] Collision detection (show when someone else is viewing/replying)
- [ ] SLA tracking (response time targets)
- [ ] Team performance dashboard (assignments, resolution time, volume)
- [ ] Snooze/remind on assignments
- [ ] Escalation rules

#### CRM (Team plan+)
- [ ] Contact management (auto-created from email interactions)
- [ ] Company management (auto-detected from email domains)
- [ ] Deal pipeline (lead → qualified → proposal → negotiation → won/lost)
- [ ] Activity timeline (auto-logged emails, manual notes, calls, meetings)
- [ ] Contact sidebar in email view (shows CRM data for sender)
- [ ] Link emails to deals
- [ ] Contact tags and custom fields
- [ ] Import/export contacts (CSV)
- [ ] Contact deduplication

#### White-Label (Enterprise plan+)
- [ ] Custom logo (light + dark)
- [ ] Custom color scheme (primary, secondary, accent)
- [ ] Custom favicon
- [ ] Custom domain (CNAME setup + verification)
- [ ] Branded login page (custom background, tagline)
- [ ] Branded email notifications
- [ ] Remove EaseMail branding
- [ ] Custom email footer

#### Platform
- [ ] User onboarding wizard (connect first account, choose preferences)
- [ ] Responsive design (desktop-first, tablet-friendly, mobile-functional)
- [ ] Dark mode (system + manual)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance (Lighthouse > 90)
- [ ] SEO (marketing pages only)
- [ ] Error pages (400, 403, 404, 500, offline)
- [ ] Data export (GDPR compliance)
- [ ] Account deletion flow
- [ ] Security: CSP headers, XSS prevention in email rendering, rate limiting
- [ ] Environment config (dev, staging, production)

---

## BUILD SYSTEM — SUBAGENT ARCHITECTURE

### Agent Map & Dependencies

```
AGENT 1: Foundation ──────────────────────────────┐
  (DB schema, env, project scaffold)              │
                                                   │
AGENT 2: Auth Engine ─────────────────────────┐    │
  (OAuth, tokens, multi-account connect)      │    │
  depends on: Agent 1                         │    │
                                              │    │
AGENT 3: Sync Engine ────────────────────┐    │    │
  (Delta sync, webhooks, background jobs)│    │    │
  depends on: Agent 1, Agent 2           │    │    │
                                         │    │    │
AGENT 4: Email API ─────────────────┐    │    │    │
  (CRUD routes, search, compose)    │    │    │    │
  depends on: Agent 1, Agent 2      │    │    │    │
                                    │    │    │    │
AGENT 5: UI Shell ──────────────────┤    │    │    │
  (Layout, sidebar, list, viewer,   │    │    │    │
   composer, account switcher)      │    │    │    │
  depends on: Agent 4               │    │    │    │
                                    │    │    │    │
  ┌─────────── PARALLEL PHASE ──────┤    │    │    │
  │                                 │    │    │    │
AGENT 6: AI Layer                   │    │    │    │
  depends on: Agent 4, Agent 5      │    │    │    │
                                    │    │    │    │
AGENT 7: Teams & CRM               │    │    │    │
  depends on: Agent 4, Agent 5      │    │    │    │
                                    │    │    │    │
AGENT 8: White-Label & Polish       │    │    │    │
  depends on: Agent 5               │    │    │    │
  └─────────────────────────────────┘    │    │    │
```

### Build Sequence: SEQUENTIAL (Agents 1-5) then PARALLEL (Agents 6-8)

---

## GATE 6 — SECURITY & COMPLIANCE

### Security Requirements (Production SaaS)

#### Authentication & Authorization
- [x] NextAuth with Microsoft OAuth 2.0
- [ ] Session tokens stored in httpOnly cookies (XSS protection)
- [ ] CSRF protection enabled on all forms
- [ ] JWT tokens rotated every 24 hours
- [ ] Account lockout after 5 failed login attempts
- [ ] 2FA/MFA support (via Microsoft Authenticator)
- [ ] Session timeout: 7 days idle, absolute 30 days
- [ ] Force logout on password change
- [ ] Admin ability to revoke user sessions remotely

#### Data Protection
- [ ] All tokens encrypted at rest (Supabase Vault or pgcrypto)
- [ ] All API requests over HTTPS only (enforce in middleware)
- [ ] Email bodies sanitized before rendering (DOMPurify)
- [ ] File upload validation (type, size, scan for malware)
- [ ] Max upload size: 25MB per file, 150MB total per message
- [ ] Secure attachment storage (Supabase Storage with signed URLs)
- [ ] Database connection pooling with SSL enforced
- [ ] Environment variables never exposed to client

#### OWASP Top 10 Protections
1. **Injection (SQL, XSS, etc.)**
   - [ ] All Supabase queries use parameterized statements
   - [ ] HTML sanitization on all user-generated content (DOMPurify)
   - [ ] Content Security Policy (CSP) headers configured
   - [ ] No `eval()` or `dangerouslySetInnerHTML` without sanitization

2. **Broken Authentication**
   - [ ] Passwords never stored (OAuth only)
   - [ ] Tokens expire and refresh properly
   - [ ] Session management via NextAuth (industry standard)

3. **Sensitive Data Exposure**
   - [ ] No PII in logs or error messages
   - [ ] Tokens masked in logs (`***TOKEN***`)
   - [ ] Error messages generic to users (detailed only in Sentry)

4. **XXE & Broken Access Control**
   - [ ] All API routes check user permissions
   - [ ] RLS (Row Level Security) enforced on all tables
   - [ ] Multi-tenant isolation verified (cannot access other tenant data)
   - [ ] No file upload parsing of XML

5. **Security Misconfiguration**
   - [ ] Production runs with `NODE_ENV=production`
   - [ ] Debug mode disabled in production
   - [ ] Directory listing disabled
   - [ ] Unused dependencies removed

6. **XSS (Cross-Site Scripting)**
   - [ ] All React components escape by default
   - [ ] Email HTML sanitized with DOMPurify before render
   - [ ] CSP headers prevent inline scripts

7. **Insecure Deserialization**
   - [ ] JSON parsing with schema validation (Zod)
   - [ ] No `eval()` on user input
   - [ ] Webhook payloads validated before processing

8. **Using Components with Known Vulnerabilities**
   - [ ] `npm audit` run weekly
   - [ ] Dependabot enabled on GitHub
   - [ ] Critical CVEs patched within 7 days

9. **Insufficient Logging & Monitoring**
   - [ ] All API errors logged to Sentry
   - [ ] Auth failures logged (with rate limit tracking)
   - [ ] Webhook failures logged
   - [ ] Token refresh failures logged
   - [ ] Audit log for admin actions (see below)

10. **SSRF (Server-Side Request Forgery)**
    - [ ] Webhook URLs validated (no localhost, no internal IPs)
    - [ ] Attachment fetch URLs validated
    - [ ] No user-controlled URLs in server-side fetch

#### Rate Limiting
- [ ] API routes: 100 requests/minute per user
- [ ] Authentication: 5 attempts/15 minutes per IP
- [ ] AI operations: 50 requests/hour per user (Professional plan)
- [ ] AI operations: 200 requests/hour per user (Team/Enterprise plans)
- [ ] Webhook endpoints: 1000/minute per account
- [ ] Implemented via Vercel Edge Config or Upstash Redis

#### Audit Logging (Admin Actions)
All admin and sensitive actions must be logged to a `audit_log` table:
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'user.created', 'account.connected', 'message.sent', etc.
  resource_type TEXT, -- 'user', 'account', 'message', etc.
  resource_id UUID,
  metadata JSONB, -- action-specific details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);
```

**Actions to log:**
- User login/logout
- Account connected/disconnected
- Permission changes
- Settings changes
- Shared inbox assignment changes
- CRM deal stage changes
- Template/snippet creation
- Tenant plan changes

#### GDPR Compliance
- [ ] **Data Export:** Users can export all their data (Step 5.8, Settings)
- [ ] **Data Deletion:** Users can delete their account and all data
- [ ] **Data Portability:** Export format: JSON (messages, contacts, settings)
- [ ] **Privacy Policy:** Link in footer (you must write this)
- [ ] **Cookie Consent:** Banner on first visit (GDPR requirement)
- [ ] **Data Retention:** Deleted accounts purged after 30 days
- [ ] **Subprocessors Disclosed:** Supabase, Vercel, Anthropic, Microsoft
- [ ] **Data Processing Agreement (DPA):** Available for Enterprise plan

#### SOC 2 / Compliance (Future)
For Enterprise customers, you may need:
- [ ] Penetration test report (annual)
- [ ] SOC 2 Type II certification
- [ ] HIPAA compliance (if targeting healthcare)
- [ ] ISO 27001 certification

**For MVP (Starter/Professional plans):** Focus on OWASP Top 10 + GDPR. SOC 2 comes later.

#### Security Checklist Before Launch
- [ ] All environment variables in `.env.example` documented
- [ ] No hardcoded secrets in codebase
- [ ] All API routes have authentication checks
- [ ] RLS policies tested for tenant isolation
- [ ] Content Security Policy headers configured
- [ ] HTTPS enforced (redirects from HTTP)
- [ ] Error messages don't leak sensitive info
- [ ] File uploads scanned (or size-limited to prevent abuse)
- [ ] Rate limiting active on all public endpoints
- [ ] Sentry configured for error tracking
- [ ] Audit logging implemented for admin actions

---

## GATE 7 — REAL-TIME COLLABORATION

### Real-Time Strategy (Shared Inboxes)

**Problem:** When multiple team members access a shared inbox, they need to see:
1. Who else is viewing a message
2. Who is composing a reply
3. When someone assigns/resolves a conversation
4. New messages arriving in real-time

**Solution:** Supabase Realtime + Presence API

#### Implementation

**Database Table for Message Locks:**
```sql
CREATE TABLE message_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('viewing', 'composing', 'editing_note')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, action)
);
CREATE INDEX idx_message_locks_message ON message_locks(message_id) WHERE expires_at > NOW();
```

**Realtime Channels (Supabase):**
- Channel per shared inbox: `shared-inbox:{inbox_id}`
- Broadcast events:
  - `user:viewing` - User opened a message
  - `user:composing` - User started composing reply
  - `user:stopped` - User closed message / stopped composing
  - `message:assigned` - Message assigned to user
  - `message:resolved` - Message marked as resolved
  - `note:created` - Internal note added

**Presence Tracking:**
```typescript
// lib/realtime/presence.ts
const channel = supabase.channel(`shared-inbox:${inboxId}`)

// Join presence
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    channel.track({
      user_id: currentUserId,
      user_name: currentUserName,
      viewing_message_id: messageId,
      status: 'online'
    })
  }
})

// Listen for other users
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  // Update UI to show who else is viewing
})
```

**Collision Detection:**
When User A tries to reply to a message that User B is already replying to:
1. Check `message_locks` table for `composing` action
2. If found: Show banner "Sarah is currently composing a reply to this message"
3. User A can choose: "Compose anyway" or "Wait"

**Optimistic Updates:**
- When user sends a message: update UI immediately, revert if API fails
- When user assigns message: update UI immediately, sync with DB in background

**WebSocket Fallback:**
If Supabase Realtime is unavailable, poll `message_locks` table every 5 seconds (graceful degradation).

---

## AGENT 1: FOUNDATION (Steps 1-6)

### Step 1.1 — Project Scaffold
**Build:** Initialize Next.js 14 app with App Router, TypeScript, Tailwind, shadcn/ui.
Create folder structure:
```
easemail/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── mail/
│   │   │   ├── page.tsx
│   │   │   └── [messageId]/page.tsx
│   │   ├── settings/
│   │   ├── contacts/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── graph/
│   │   ├── sync/
│   │   ├── ai/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx (marketing landing)
├── components/
│   ├── ui/ (shadcn)
│   ├── mail/
│   ├── compose/
│   ├── sidebar/
│   ├── settings/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── types.ts
│   ├── graph/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── mail.ts
│   │   ├── folders.ts
│   │   ├── contacts.ts
│   │   └── sync.ts
│   ├── ai/
│   │   ├── client.ts
│   │   ├── drafting.ts
│   │   ├── summarize.ts
│   │   └── categorize.ts
│   ├── utils/
│   └── constants.ts
├── stores/
│   ├── mail-store.ts
│   ├── account-store.ts
│   ├── ui-store.ts
│   └── sync-store.ts
├── types/
│   ├── database.ts (generated from Supabase)
│   ├── graph.ts
│   └── mail.ts
├── supabase/
│   ├── migrations/
│   └── functions/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

**Test Gate 1.1:**
```bash
#!/bin/bash
# test-1.1-scaffold.sh
echo "=== Step 1.1: Project Scaffold ==="

# Check Next.js builds
cd easemail && npm run build
if [ $? -ne 0 ]; then echo "❌ FAIL: Next.js build failed"; exit 1; fi

# Check TypeScript compiles
npx tsc --noEmit
if [ $? -ne 0 ]; then echo "❌ FAIL: TypeScript errors"; exit 1; fi

# Check folder structure exists
for dir in app/api lib/graph lib/supabase lib/ai stores types components/mail; do
  if [ ! -d "$dir" ]; then echo "❌ FAIL: Missing directory $dir"; exit 1; fi
done

# Check critical files exist
for file in app/layout.tsx lib/supabase/client.ts lib/supabase/server.ts lib/graph/client.ts; do
  if [ ! -f "$file" ]; then echo "❌ FAIL: Missing file $file"; exit 1; fi
done

echo "✅ PASS: Project scaffold complete"
```

### Step 1.2 — Database Migration
**Build:** Create Supabase migration with ALL tables from Gate 1 schema. Run migration.
Generate TypeScript types from schema.

**Test Gate 1.2:**
```bash
#!/bin/bash
# test-1.2-database.sh
echo "=== Step 1.2: Database Migration ==="

# Run migration
npx supabase db push
if [ $? -ne 0 ]; then echo "❌ FAIL: Migration failed"; exit 1; fi

# Verify all tables exist
TABLES=(tenants users user_preferences connected_accounts account_tokens
        account_folders messages attachments labels message_labels
        sync_state webhook_subscriptions email_signatures email_templates
        account_contacts teams team_members shared_inboxes inbox_assignments
        inbox_notes crm_contacts crm_companies crm_deals crm_activities
        tenant_branding mail_rules)

for table in "${TABLES[@]}"; do
  EXISTS=$(npx supabase db exec "SELECT to_regclass('public.$table');" 2>/dev/null)
  if [[ "$EXISTS" == *"null"* ]] || [[ -z "$EXISTS" ]]; then
    echo "❌ FAIL: Table '$table' does not exist"
    exit 1
  fi
done

# Verify RLS is enabled on all tables
for table in "${TABLES[@]}"; do
  RLS=$(npx supabase db exec "SELECT rowsecurity FROM pg_tables WHERE tablename='$table';" 2>/dev/null)
  if [[ "$RLS" != *"t"* ]]; then
    echo "❌ FAIL: RLS not enabled on '$table'"
    exit 1
  fi
done

# Generate types
npx supabase gen types typescript --local > types/database.ts
if [ $? -ne 0 ]; then echo "❌ FAIL: Type generation failed"; exit 1; fi

echo "✅ PASS: Database schema deployed with RLS"
```

### Step 1.3 — Environment Configuration
**Build:** Create .env.local template with all required variables. Create lib/env.ts with
runtime validation (zod schema). App crashes on startup if any required var is missing.

**Test Gate 1.3:**
```bash
#!/bin/bash
# test-1.3-env.sh
echo "=== Step 1.3: Environment Config ==="

# Check .env.example has all vars
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
  AZURE_AD_CLIENT_ID AZURE_AD_CLIENT_SECRET AZURE_AD_TENANT_ID AZURE_AD_REDIRECT_URI
  ANTHROPIC_API_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
  NEXTAUTH_URL NEXTAUTH_SECRET WEBHOOK_BASE_URL
)

for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "$var" .env.example; then
    echo "❌ FAIL: Missing $var in .env.example"
    exit 1
  fi
done

# Check env validation module exists and exports schema
if ! grep -q "envSchema" lib/env.ts; then
  echo "❌ FAIL: lib/env.ts missing envSchema"
  exit 1
fi

echo "✅ PASS: Environment configuration complete"
```

### Step 1.4 — Supabase Client Setup
**Build:** Create Supabase client (browser), server client (SSR), and admin client
(service role for background jobs). Create middleware for auth session management.

**Test Gate 1.4:**
```typescript
// test-1.4-supabase.test.ts
import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'

describe('Supabase Clients', () => {
  test('browser client initializes', () => {
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })

  test('server client initializes', async () => {
    const client = await createServerClient()
    expect(client).toBeDefined()
  })

  test('can query tenants table (empty)', async () => {
    const client = createClient()
    const { data, error } = await client.from('tenants').select('id').limit(1)
    // Should return empty array, not error (RLS may block, but table exists)
    expect(error?.code).not.toBe('42P01') // table does not exist
  })
})
```

### Step 1.5 — Zustand Store Setup
**Build:** Create Zustand stores for mail, accounts, UI, and sync state.
These are EMPTY shells with TypeScript interfaces — no logic yet.

**Test Gate 1.5:**
```typescript
// test-1.5-stores.test.ts
import { useMailStore } from '@/stores/mail-store'
import { useAccountStore } from '@/stores/account-store'
import { useUIStore } from '@/stores/ui-store'

describe('Zustand Stores', () => {
  test('mail store has required shape', () => {
    const store = useMailStore.getState()
    expect(store).toHaveProperty('messages')
    expect(store).toHaveProperty('selectedMessageId')
    expect(store).toHaveProperty('selectedFolderId')
  })

  test('account store has required shape', () => {
    const store = useAccountStore.getState()
    expect(store).toHaveProperty('accounts')
    expect(store).toHaveProperty('activeAccountId')
  })

  test('ui store has required shape', () => {
    const store = useUIStore.getState()
    expect(store).toHaveProperty('sidebarOpen')
    expect(store).toHaveProperty('readingPane')
    expect(store).toHaveProperty('theme')
  })
})
```

### Step 1.6 — Background Job Infrastructure
**Build:** Set up Inngest for background job processing. This is critical for:
- Token refresh automation
- Webhook renewal
- Message sync orchestration
- Scheduled send
- Unsnooze automation

**Why Inngest:** Works seamlessly with Vercel, has built-in retries, monitoring, fan-out, and prevents duplicate executions. Alternative: Supabase pg_cron for simpler jobs.

**Implementation:**
1. Install Inngest: `npm install inngest`
2. Create `lib/jobs/client.ts`:
   ```typescript
   import { Inngest } from 'inngest'

   export const inngest = new Inngest({
     id: 'easemail',
     name: 'EaseMail Background Jobs'
   })
   ```

3. Create `app/api/inngest/route.ts`:
   ```typescript
   import { serve } from 'inngest/next'
   import { inngest } from '@/lib/jobs/client'
   import { refreshTokensJob } from '@/lib/jobs/refresh-tokens'
   import { renewWebhooksJob } from '@/lib/jobs/renew-webhooks'

   export const { GET, POST, PUT } = serve({
     client: inngest,
     functions: [
       refreshTokensJob,
       renewWebhooksJob,
       // More jobs added in later steps
     ],
   })
   ```

4. Create placeholder job files:
   - `lib/jobs/refresh-tokens.ts` — runs every 15 minutes
   - `lib/jobs/renew-webhooks.ts` — runs every 12 hours
   - `lib/jobs/sync-messages.ts` — triggered per account
   - `lib/jobs/send-scheduled.ts` — runs every 30 seconds
   - `lib/jobs/unsnooze-messages.ts` — runs every 60 seconds

5. Add to `.env.local`:
   ```
   INNGEST_SIGNING_KEY=your_signing_key_from_inngest_dashboard
   INNGEST_EVENT_KEY=your_event_key_from_inngest_dashboard
   ```

**Job Retry Policy (default for all jobs):**
- Max retries: 3
- Backoff: Exponential (1min, 5min, 15min)
- Timeout: 5 minutes per job
- Idempotency: All jobs must be idempotent (safe to run multiple times)

**Error Handling:**
- Jobs must log errors to Sentry with full context
- Failed jobs after 3 retries should create an entry in a `job_failures` table
- Critical jobs (token refresh, scheduled send) should alert via webhook

**Test Gate 1.6:**
```typescript
// test-1.6-jobs.test.ts
import { inngest } from '@/lib/jobs/client'

describe('Background Job Infrastructure', () => {
  test('Inngest client is configured', () => {
    expect(inngest).toBeDefined()
    expect(inngest.id).toBe('easemail')
  })

  test('/api/inngest responds correctly', async () => {
    const res = await fetch('http://localhost:3000/api/inngest')
    expect(res.status).toBe(200)
  })

  test('refresh tokens job is registered', () => {
    const { refreshTokensJob } = require('@/lib/jobs/refresh-tokens')
    expect(refreshTokensJob).toBeDefined()
    expect(refreshTokensJob.id).toBeDefined()
  })

  test('job files have correct structure', () => {
    const jobs = [
      'refresh-tokens',
      'renew-webhooks',
      'sync-messages',
      'send-scheduled',
      'unsnooze-messages'
    ]

    jobs.forEach(jobName => {
      const job = require(`@/lib/jobs/${jobName}`)
      expect(job).toBeDefined()
      expect(typeof job.fn).toBe('function')
    })
  })
})
```

**Additional Database Table:**
```sql
CREATE TABLE job_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  job_id TEXT NOT NULL,
  account_id UUID REFERENCES connected_accounts(id),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_job_failures_job_name ON job_failures(job_name, created_at DESC);
CREATE INDEX idx_job_failures_account ON job_failures(account_id) WHERE account_id IS NOT NULL;
```

### 🛑 MANUAL CHECKPOINT 1
**Daniel verifies:**
- [ ] `npm run dev` starts without errors
- [ ] Supabase dashboard shows all tables with RLS enabled
- [ ] TypeScript types generated and look correct
- [ ] No hardcoded secrets in codebase
- [ ] Folder structure matches spec

**Sign off: _______________ Date: _______________**

---

## AGENT 2: AUTH ENGINE (Steps 2.1-2.7)

### Step 2.1 — NextAuth Microsoft Provider
**Build:** Configure NextAuth.js with Microsoft Azure AD provider. Implement
`/api/auth/[...nextauth]/route.ts`. On successful auth:
1. Create or update user in Supabase
2. Create or update connected_account
3. Store tokens in account_tokens (encrypted)
4. Redirect to `/mail`

**Test Gate 2.1:**
```typescript
// test-2.1-nextauth.test.ts
describe('NextAuth Microsoft Provider', () => {
  test('auth config exports providers', () => {
    const config = require('@/app/api/auth/[...nextauth]/route')
    expect(config).toBeDefined()
  })

  test('/api/auth/providers returns microsoft', async () => {
    const res = await fetch('http://localhost:3000/api/auth/providers')
    const providers = await res.json()
    expect(providers.microsoft).toBeDefined()
    expect(providers.microsoft.id).toBe('microsoft')
  })

  test('callback URL is configured correctly', () => {
    expect(process.env.AZURE_AD_REDIRECT_URI).toContain('/api/auth/callback')
  })
})
```

### Step 2.2 — Token Storage Service
**Build:** Create `lib/graph/token-service.ts`:
- `storeTokens(accountId, tokens)` — encrypts and stores in account_tokens
- `getAccessToken(accountId)` — returns valid token, auto-refreshes if < 5min remaining
- `refreshToken(accountId)` — uses MSAL to refresh, updates DB, handles failures
- `revokeTokens(accountId)` — clears tokens on disconnect

**CRITICAL:** This is the #1 failure point from previous builds. The token service MUST:
1. Never return an expired token
2. Handle concurrent refresh requests (mutex/lock)
3. Increment failure count and set account to 'needs_reauth' after 3 failures
4. Log every refresh attempt for debugging

**Test Gate 2.2:**
```typescript
// test-2.2-token-service.test.ts
import { TokenService } from '@/lib/graph/token-service'

describe('Token Service', () => {
  test('storeTokens saves to database', async () => {
    const service = new TokenService()
    await service.storeTokens('test-account-id', {
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      expiresAt: new Date(Date.now() + 3600000),
      scopes: ['Mail.ReadWrite', 'Mail.Send'],
    })
    // Verify stored
    const token = await service.getStoredToken('test-account-id')
    expect(token).toBeDefined()
    expect(token.scopes).toContain('Mail.ReadWrite')
  })

  test('getAccessToken returns token when valid', async () => {
    const token = await service.getAccessToken('test-account-id')
    expect(token).toBe('test-access')
  })

  test('getAccessToken triggers refresh when expiring soon', async () => {
    // Store token expiring in 2 minutes
    await service.storeTokens('test-account-id', {
      accessToken: 'old-access',
      refreshToken: 'test-refresh',
      expiresAt: new Date(Date.now() + 120000), // 2 min
      scopes: ['Mail.ReadWrite'],
    })
    // Should trigger refresh (mocked)
    const token = await service.getAccessToken('test-account-id')
    expect(token).not.toBe('old-access')
  })

  test('sets account to needs_reauth after 3 refresh failures', async () => {
    // Simulate 3 failures
    for (let i = 0; i < 3; i++) {
      await service.recordRefreshFailure('test-account-id', 'mock error')
    }
    const account = await getAccount('test-account-id')
    expect(account.status).toBe('needs_reauth')
  })
})
```

### Step 2.3 — Graph Client Factory
**Build:** Create `lib/graph/client.ts`:
- `createGraphClient(accountId)` — returns authenticated Graph client using token service
- Automatically handles 401 → refresh → retry (1 retry max)
- Handles 429 → exponential backoff
- Logs all API calls with timing for debugging

**Test Gate 2.3:**
```typescript
// test-2.3-graph-client.test.ts
describe('Graph Client Factory', () => {
  test('creates authenticated client', async () => {
    const client = await createGraphClient('test-account-id')
    expect(client).toBeDefined()
  })

  test('client can call /me endpoint', async () => {
    const client = await createGraphClient('test-account-id')
    const me = await client.api('/me').get()
    expect(me.displayName).toBeDefined()
    expect(me.mail || me.userPrincipalName).toBeDefined()
  })

  test('client retries on 401 with refreshed token', async () => {
    // Mock: first call returns 401, token refreshes, second call succeeds
    const client = await createGraphClient('test-account-id')
    const result = await client.api('/me').get()
    expect(result).toBeDefined()
  })
})
```

### Step 2.4 — Connect Account Flow
**Build:** Create `/api/auth/connect/route.ts`:
- Initiates OAuth flow for ADDITIONAL account (user already logged in)
- On callback: creates new connected_account row (not new user)
- Validates account limit per plan
- Sets account color automatically (rotates through palette)
- Triggers initial folder sync

**Test Gate 2.4:**
```typescript
// test-2.4-connect-account.test.ts
describe('Connect Account Flow', () => {
  test('connect endpoint returns auth URL', async () => {
    const res = await fetch('/api/auth/connect', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testUserToken}` },
    })
    const data = await res.json()
    expect(data.authUrl).toContain('login.microsoftonline.com')
  })

  test('callback creates connected_account', async () => {
    // After OAuth callback...
    const accounts = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', testUserId)
    expect(accounts.data.length).toBeGreaterThan(0)
  })

  test('respects plan account limit', async () => {
    // Starter plan = 1 account max
    // Try to connect 2nd account
    const res = await fetch('/api/auth/connect', { method: 'POST' })
    expect(res.status).toBe(403)
  })
})
```

### Step 2.5 — Disconnect Account Flow
**Build:** Create `/api/accounts/[accountId]/disconnect/route.ts`:
- Revokes tokens with Microsoft
- Deletes account_tokens, sync_state, webhook_subscriptions
- Soft-deletes messages and folders (keeps for 30 days)
- Updates connected_account status to 'disconnected'
- If last account: redirect to account connection page, don't delete user

**Test Gate 2.5:**
```typescript
// test-2.5-disconnect.test.ts
describe('Disconnect Account', () => {
  test('disconnect removes tokens', async () => {
    await fetch(`/api/accounts/${testAccountId}/disconnect`, { method: 'POST' })
    const tokens = await supabase
      .from('account_tokens')
      .select('*')
      .eq('account_id', testAccountId)
    expect(tokens.data.length).toBe(0)
  })

  test('disconnect preserves user account', async () => {
    const user = await supabase.from('users').select('*').eq('id', testUserId)
    expect(user.data.length).toBe(1) // user still exists
  })
})
```

### Step 2.6 — Reauth Flow
**Build:** Create `/api/accounts/[accountId]/reauth/route.ts`:
- Triggered when account status = 'needs_reauth'
- Shows inline prompt in UI (not a full redirect)
- On success: updates tokens, resets failure count, sets status to 'active'
- Triggers immediate sync

**Test Gate 2.6:**
```typescript
// test-2.6-reauth.test.ts
describe('Reauth Flow', () => {
  test('reauth endpoint returns auth URL with account context', async () => {
    const res = await fetch(`/api/accounts/${testAccountId}/reauth`)
    const data = await res.json()
    expect(data.authUrl).toContain('login.microsoftonline.com')
  })

  test('successful reauth resets account status', async () => {
    // After reauth callback...
    const account = await getAccount(testAccountId)
    expect(account.status).toBe('active')
    expect(account.error_count).toBe(0)
  })
})
```

### Step 2.7 — Token Refresh Background Job
**Build:** Create Supabase Edge Function `token-refresh`:
- Runs every 60 seconds
- Queries all account_tokens where expires_at < NOW() + INTERVAL '5 minutes'
- Refreshes each one using MSAL
- Updates tokens and timestamps
- Sets account to 'needs_reauth' on 3 consecutive failures
- Logs all activity

**Test Gate 2.7:**
```typescript
// test-2.7-token-refresh-job.test.ts
describe('Token Refresh Job', () => {
  test('identifies tokens expiring within 5 minutes', async () => {
    const expiring = await getExpiringTokens()
    expect(Array.isArray(expiring)).toBe(true)
  })

  test('refreshes expiring token successfully', async () => {
    // Insert token expiring in 3 minutes
    await insertExpiringToken(testAccountId, 3)
    await runTokenRefreshJob()
    const token = await getStoredToken(testAccountId)
    expect(new Date(token.expires_at).getTime()).toBeGreaterThan(Date.now() + 3000000)
  })

  test('handles refresh failure gracefully', async () => {
    // Mock MSAL failure
    await runTokenRefreshJob()
    const token = await getStoredToken(testAccountId)
    expect(token.refresh_failure_count).toBe(1)
  })
})
```

### 🛑 MANUAL CHECKPOINT 2
**Daniel verifies:**
- [ ] Can sign in with Microsoft account in browser
- [ ] User created in Supabase after first login
- [ ] connected_account row created with correct email
- [ ] Tokens stored (visible in account_tokens table, encrypted)
- [ ] Can disconnect and reconnect account
- [ ] Token refresh job runs (check Supabase Edge Function logs)
- [ ] After manually expiring a token, the refresh job catches it

**Sign off: _______________ Date: _______________**

---

## AGENT 3: SYNC ENGINE (Steps 3.1-3.6)

### Step 3.1 — Folder Sync
**Build:** Create `lib/graph/folders.ts`:
- `syncFolders(accountId)` — fetches all mail folders from Graph, upserts to account_folders
- Maps well-known folder names (Inbox, Sent Items, etc.) to folder_type enum
- Handles nested folders (parentFolderId)
- Detects and handles folder renames, moves, deletes
- Returns diff: { created: [], updated: [], deleted: [] }

**Test Gate 3.1:**
```typescript
// test-3.1-folder-sync.test.ts
describe('Folder Sync', () => {
  test('syncs all folders from Graph', async () => {
    const result = await syncFolders(testAccountId)
    expect(result.created.length).toBeGreaterThan(0)
    // Should have at least: Inbox, Sent, Drafts, Deleted, Junk
    const folders = await getFolders(testAccountId)
    const types = folders.map(f => f.folder_type)
    expect(types).toContain('inbox')
    expect(types).toContain('sentitems')
    expect(types).toContain('drafts')
    expect(types).toContain('deleteditems')
  })

  test('second sync detects no changes', async () => {
    const result = await syncFolders(testAccountId)
    expect(result.created.length).toBe(0)
    expect(result.updated.length).toBe(0)
  })

  test('detects renamed folder', async () => {
    // Rename folder via Graph, then sync
    const result = await syncFolders(testAccountId)
    expect(result.updated.length).toBeGreaterThan(0)
  })
})
```

### Step 3.2 — Message Delta Sync
**Build:** Create `lib/graph/sync.ts`:
- `initialSync(accountId, folderId)` — full sync, paginated, stores delta_link
- `deltaSync(accountId, folderId)` — incremental sync using stored delta_link
- Handles created, updated, deleted messages from delta response
- Processes deletions (messages with `@removed` property)
- Extracts plain text from HTML body for AI processing
- Batch upserts to messages table (100 at a time for performance)
- Updates sync_state after each successful sync

**CRITICAL:** This is failure point #2 from previous builds. The sync MUST:
1. Never lose the delta_link (store BEFORE processing, update AFTER)
2. Handle pagination (follow @odata.nextLink until exhausted)
3. Process deletions (don't just add messages, also remove deleted ones)
4. Be idempotent (running twice produces same result)
5. Handle Graph API errors without corrupting sync state

**Test Gate 3.2:**
```typescript
// test-3.2-delta-sync.test.ts
describe('Message Delta Sync', () => {
  test('initial sync fetches messages from inbox', async () => {
    const result = await initialSync(testAccountId, inboxFolderId)
    expect(result.synced).toBeGreaterThan(0)
    // Verify messages in DB
    const messages = await getMessages(testAccountId, inboxFolderId)
    expect(messages.length).toBeGreaterThan(0)
  })

  test('delta_link is stored after initial sync', async () => {
    const state = await getSyncState(testAccountId, inboxFolderId)
    expect(state.delta_link).toBeDefined()
    expect(state.delta_link).toContain('delta')
  })

  test('delta sync picks up new messages', async () => {
    // Send a test email to the account, then delta sync
    const result = await deltaSync(testAccountId, inboxFolderId)
    expect(result.created).toBeGreaterThanOrEqual(0) // may or may not have new
  })

  test('delta sync is idempotent', async () => {
    const count1 = (await getMessages(testAccountId, inboxFolderId)).length
    await deltaSync(testAccountId, inboxFolderId)
    const count2 = (await getMessages(testAccountId, inboxFolderId)).length
    // Running delta sync twice shouldn't duplicate messages
    await deltaSync(testAccountId, inboxFolderId)
    const count3 = (await getMessages(testAccountId, inboxFolderId)).length
    expect(count3).toBe(count2)
  })

  test('messages have body_text extracted', async () => {
    const messages = await getMessages(testAccountId, inboxFolderId)
    const withBody = messages.filter(m => m.body_text)
    expect(withBody.length).toBeGreaterThan(0)
  })
})
```

### Step 3.3 — Sync Orchestrator
**Build:** Create `lib/graph/sync-orchestrator.ts`:
- `SyncOrchestrator` class that manages sync for all accounts
- Syncs inbox every 30s, other folders every 5min
- Respects account status (skip disabled/needs_reauth)
- Implements per-folder sync queue (no concurrent syncs on same folder)
- Tracks sync health metrics

**Test Gate 3.3:**
```typescript
// test-3.3-sync-orchestrator.test.ts
describe('Sync Orchestrator', () => {
  test('orchestrator syncs all active accounts', async () => {
    const orchestrator = new SyncOrchestrator()
    await orchestrator.syncAllAccounts()
    // Check sync_state updated for active accounts
    const states = await getAllSyncStates()
    const recentlySynced = states.filter(
      s => new Date(s.last_sync_at) > new Date(Date.now() - 60000)
    )
    expect(recentlySynced.length).toBeGreaterThan(0)
  })

  test('skips disabled accounts', async () => {
    await setAccountStatus(testAccountId, 'disabled')
    const orchestrator = new SyncOrchestrator()
    await orchestrator.syncAllAccounts()
    const state = await getSyncState(testAccountId, inboxFolderId)
    // Should not have been updated
    expect(new Date(state.last_sync_at).getTime()).toBeLessThan(Date.now() - 60000)
  })
})
```

### Step 3.4 — Webhook Setup & Handler
**Build:**
- `POST /api/webhooks/graph/route.ts` — handles Graph webhook notifications
  - Validates clientState
  - Responds to validation requests with validationToken
  - On notification: triggers targeted delta sync for affected folder
- `lib/graph/webhooks.ts` — create, renew, delete subscriptions
- One subscription per account for inbox (expandable to other folders)

**Test Gate 3.4:**
```typescript
// test-3.4-webhooks.test.ts
describe('Graph Webhooks', () => {
  test('webhook handler responds to validation', async () => {
    const res = await fetch('/api/webhooks/graph?validationToken=test123')
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe('test123')
  })

  test('creates subscription for account inbox', async () => {
    const sub = await createWebhookSubscription(testAccountId)
    expect(sub.graph_subscription_id).toBeDefined()
    expect(sub.resource).toContain('Inbox')
  })

  test('subscription stored in database', async () => {
    const subs = await getWebhookSubscriptions(testAccountId)
    expect(subs.length).toBeGreaterThan(0)
    expect(subs[0].is_active).toBe(true)
  })
})
```

### Step 3.5 — Webhook Renewal Job
**Build:** Supabase Edge Function `renew-webhooks`:
- Runs every 1 hour
- Queries webhook_subscriptions expiring in < 12 hours
- Renews each via Graph API
- Recreates if renewal fails (subscription may have been deleted)
- Tracks renewal failures

**Test Gate 3.5:**
```typescript
// test-3.5-webhook-renewal.test.ts
describe('Webhook Renewal Job', () => {
  test('identifies expiring subscriptions', async () => {
    const expiring = await getExpiringSubscriptions(12) // hours
    expect(Array.isArray(expiring)).toBe(true)
  })

  test('renews subscription successfully', async () => {
    const before = await getWebhookSubscription(testSubId)
    await runWebhookRenewalJob()
    const after = await getWebhookSubscription(testSubId)
    expect(new Date(after.expiration_at) > new Date(before.expiration_at)).toBe(true)
  })
})
```

### Step 3.6 — Attachment Sync
**Build:** Create `lib/graph/attachments.ts`:
- `syncAttachments(accountId, messageId)` — fetches attachment metadata from Graph
- Small attachments (< 1MB): cache content in Supabase Storage
- Large attachments: store metadata only, fetch on-demand from Graph
- `getAttachmentContent(attachmentId)` — returns content (from cache or Graph)
- `uploadAttachment(accountId, messageId, file)` — for compose

**Test Gate 3.6:**
```typescript
// test-3.6-attachments.test.ts
describe('Attachment Sync', () => {
  test('syncs attachment metadata for message', async () => {
    // Find a message with attachments
    const msg = await findMessageWithAttachments(testAccountId)
    if (msg) {
      await syncAttachments(testAccountId, msg.id)
      const attachments = await getAttachments(msg.id)
      expect(attachments.length).toBeGreaterThan(0)
      expect(attachments[0].name).toBeDefined()
      expect(attachments[0].size_bytes).toBeGreaterThan(0)
    }
  })

  test('caches small attachments in storage', async () => {
    const attachment = await getSmallAttachment()
    if (attachment) {
      expect(attachment.is_cached).toBe(true)
      expect(attachment.storage_path).toBeDefined()
    }
  })
})
```

### 🛑 MANUAL CHECKPOINT 3
**Daniel verifies:**
- [ ] Folders synced from Microsoft account (check Supabase table)
- [ ] Messages synced from Inbox (check messages table — subjects, dates, from addresses)
- [ ] Messages have body_text populated (for AI processing)
- [ ] Delta sync works: send yourself an email, wait 30s, check if it appears
- [ ] Attachments synced for messages that have them
- [ ] Webhook receives notifications (check API logs)
- [ ] No duplicate messages after multiple syncs

**Sign off: _______________ Date: _______________**

---

## AGENT 4: EMAIL API (Steps 4.1-4.8)

### Step 4.1 — List Messages API
**Build:** `GET /api/mail/messages/route.ts`
- Query params: accountId (optional, for unified inbox omit), folderId, page, limit, sort, unreadOnly
- Returns messages with pagination metadata
- Supports unified inbox: query across all user's accounts, sorted by received_at
- Returns: { messages: [], total, page, limit, hasMore }

**Test Gate 4.1:**
```bash
# test-4.1-list-messages.sh
# After auth, test API endpoints
TOKEN=$(get_auth_token)

# List inbox messages
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/mail/messages?folderId=$INBOX_ID&limit=10")
COUNT=$(echo $RESPONSE | jq '.messages | length')
if [ "$COUNT" -eq 0 ]; then echo "❌ FAIL: No messages returned"; exit 1; fi

# Unified inbox (no accountId)
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/mail/messages?limit=10")
HAS_MORE=$(echo $RESPONSE | jq '.hasMore')
echo "Messages: $COUNT, hasMore: $HAS_MORE"

echo "✅ PASS: List messages API works"
```

### Step 4.2 — Get Single Message API
**Build:** `GET /api/mail/messages/[messageId]/route.ts`
- Returns full message with HTML body, attachments metadata, thread context
- Marks as read on open (configurable via user preference)
- Returns neighboring message IDs for navigation

**Test Gate 4.2:** Verify endpoint returns full message body and attachment list.

### Step 4.3 — Compose & Send API
**Build:**
- `POST /api/mail/send/route.ts` — send email via Graph
  - Accepts: accountId, to, cc, bcc, subject, bodyHtml, attachments, replyToMessageId
  - Appends signature if configured
  - Supports reply, reply-all, forward (sets proper headers)
  - Returns sent message
- `POST /api/mail/drafts/route.ts` — create draft via Graph
- `PATCH /api/mail/drafts/[draftId]/route.ts` — update draft
- `POST /api/mail/drafts/[draftId]/send/route.ts` — send existing draft
- `DELETE /api/mail/drafts/[draftId]/route.ts` — discard draft

**Test Gate 4.3:**
```typescript
// test-4.3-compose-send.test.ts
describe('Compose & Send', () => {
  test('create draft', async () => {
    const draft = await createDraft(testAccountId, {
      subject: '[EaseMail Test] Draft',
      bodyHtml: '<p>Test draft</p>',
      toRecipients: [],
    })
    expect(draft.id).toBeDefined()
    expect(draft.is_draft).toBe(true)
  })

  test('update draft', async () => {
    const updated = await updateDraft(draftId, {
      subject: '[EaseMail Test] Updated Draft',
    })
    expect(updated.subject).toContain('Updated')
  })

  test('send email via Graph', async () => {
    const result = await sendEmail(testAccountId, {
      to: [{ email: testEmail, name: 'Test' }],
      subject: '[EaseMail Test] Send Test',
      bodyHtml: '<p>This is a send test</p>',
    })
    expect(result.success).toBe(true)
  })

  test('delete draft', async () => {
    const result = await deleteDraft(draftId)
    expect(result.success).toBe(true)
  })
})
```

### Step 4.4 — Message Actions API
**Build:**
- `PATCH /api/mail/messages/[messageId]/route.ts` — mark read/unread, flag/unflag
- `POST /api/mail/messages/[messageId]/move/route.ts` — move to folder
- `DELETE /api/mail/messages/[messageId]/route.ts` — move to trash or permanent delete
- All actions sync to Graph API immediately, then update local DB

**Test Gate 4.4:** Verify mark as read updates both Graph and local DB.

### Step 4.5 — Folder Management API
**Build:**
- `GET /api/mail/folders/route.ts` — list folders for account (tree structure)
- `POST /api/mail/folders/route.ts` — create custom folder
- `PATCH /api/mail/folders/[folderId]/route.ts` — rename folder
- `DELETE /api/mail/folders/[folderId]/route.ts` — delete folder
- `PATCH /api/mail/folders/[folderId]/favorite/route.ts` — toggle favorite

**Test Gate 4.5:** Create folder, rename it, verify in both Graph and local DB.

### Step 4.6 — Search API
**Build:** `GET /api/mail/search/route.ts`
- Full-text search across messages (uses PostgreSQL FTS index)
- Filter params: from, to, dateFrom, dateTo, hasAttachment, folder, account, isRead
- Natural language query parsing (Phase 2: AI-powered)
- Returns highlighted snippets
- Searches across all user's accounts by default

**Test Gate 4.6:** Search for a known subject, verify results returned with snippets.

### Step 4.7 — Contacts API
**Build:**
- `GET /api/contacts/route.ts` — list contacts with search/autocomplete
- `GET /api/contacts/suggestions/route.ts` — smart suggestions based on email frequency
- Returns contacts from all connected accounts, deduplicated by email

**Test Gate 4.7:** Autocomplete search returns contacts sorted by frequency.

### Step 4.8 — Account Management API
**Build:**
- `GET /api/accounts/route.ts` — list connected accounts with status
- `PATCH /api/accounts/[accountId]/route.ts` — update account settings (color, default, sort)
- `POST /api/accounts/[accountId]/sync/route.ts` — trigger manual sync
- `GET /api/accounts/[accountId]/health/route.ts` — sync health, token status, error log

**Test Gate 4.8:** List accounts returns correct status and folder counts.

### 🛑 MANUAL CHECKPOINT 4
**Daniel verifies:**
- [ ] Can list messages from inbox via API (use Postman or curl)
- [ ] Can read full message with body via API
- [ ] Can send a test email (receives it in Outlook)
- [ ] Can create and delete a draft
- [ ] Can mark message as read (verify in Outlook it shows as read)
- [ ] Can move message to a folder
- [ ] Search returns relevant results
- [ ] Contact autocomplete works

**Sign off: _______________ Date: _______________**

---

## AGENT 5: UI SHELL (Steps 5.1-5.10)

### Step 5.1 — App Layout Shell
**Build:** Three-column layout (sidebar | message list | reading pane).
Responsive: collapses to 2-column on tablet, 1-column on mobile.
Uses Zustand stores for state. Implements dark mode toggle.

**Test Gate 5.1:** Layout renders with correct column structure. Dark mode toggles.

### Step 5.2 — Sidebar: Account Switcher
**Build:** Top of sidebar shows connected accounts with:
- Account avatar + email + color dot
- "All Accounts" option for unified inbox
- Click to switch active account
- Status indicators (green = active, yellow = syncing, red = needs reauth)
- "Add Account" button (respects plan limits)
- Dropdown menu per account: settings, reauth, disconnect

**Test Gate 5.2:** Account switcher shows all connected accounts. Switching updates folder tree.

### Step 5.3 — Sidebar: Folder Tree
**Build:** Below account switcher:
- System folders (Inbox, Drafts, Sent, Deleted, Junk) with icons
- Favorites section
- Custom folders (collapsible tree for nested)
- Unread counts on each folder
- Right-click context menu: rename, delete, mark all read, add to favorites
- Drag-and-drop messages onto folders
- "Create Folder" option

**Test Gate 5.3:** Folder tree renders with correct counts. Can navigate between folders.

### Step 5.4 — Message List
**Build:** Center column:
- Message rows: sender avatar, sender name, subject, preview, date, flags
- Thread grouping (conversation view toggle)
- Unread styling (bold, accent left border)
- Flagged star icon
- Attachment paperclip icon
- Multi-select with checkboxes (shift-click for range)
- Bulk actions toolbar: mark read, move, delete, label
- Infinite scroll pagination
- Pull-to-refresh on mobile
- Loading skeletons during fetch
- Empty state for empty folders

**Test Gate 5.4:** Message list loads, scrolls, shows correct data. Multi-select works.

### Step 5.5 — Message Viewer
**Build:** Right column (or overlay on mobile):
- Full message header: from, to, cc, date, subject
- HTML body rendered safely (DOMPurify sanitized, scoped CSS)
- Inline images rendered
- Attachment list with download buttons
- Thread view: collapsible previous messages in thread
- Action bar: Reply, Reply All, Forward, Archive, Delete, Move, Flag, Label
- "More" menu: print, view source, report spam

**Test Gate 5.5:** Message body renders HTML correctly. Attachments downloadable. Thread view works.

### Step 5.6 — Composer
**Build:** Full compose window (modal or inline):
- From: account selector dropdown (for multi-account)
- To, CC, BCC fields with contact autocomplete (chips UI)
- Subject field
- Tiptap rich text editor: bold, italic, underline, lists, links, images, code
- Signature auto-inserted (configurable)
- Template picker
- Attachment upload (drag-and-drop + button)
- Auto-save to drafts every 5 seconds (debounced)
- "Send" button with undo-send countdown
- "Schedule Send" option
- Reply/Forward pre-fills correctly (quoted message, recipients)
- Minimize/maximize composer
- Multiple simultaneous composers (up to 3)

**Test Gate 5.6:** Can compose and send email. Autocomplete works. Attachments upload. Auto-save creates draft.

### Step 5.7 — Search UI
**Build:**
- Global search bar in top nav
- Instant results dropdown (top 5 as you type)
- Full search results page with filters sidebar
- Highlighted match snippets
- Search chips: from:, to:, has:attachment, in:folder, date range

**Test Gate 5.7:** Search returns results. Filter chips work. Highlighted snippets display.

### Step 5.8 — Settings Pages
**Build:**
- Settings/General: theme, density, reading pane, date format, timezone
- Settings/Accounts: list connected accounts, manage each
- Settings/Signatures: CRUD signatures per account
- Settings/Templates: CRUD email templates
- Settings/Labels: CRUD labels with colors
- Settings/Rules: CRUD mail rules
- Settings/Keyboard Shortcuts: reference + customize
- Settings/Notifications: toggle types

**Test Gate 5.8:** All settings pages render. Preferences save and persist.

### Step 5.9 — Notifications & Toasts
**Build:**
- Toast system for actions (sent, moved, deleted) with undo
- Browser notifications for new emails (if enabled)
- Badge count on favicon
- Sound notification (optional)
- Reauth required banner (per account, dismissible but persistent)

**Test Gate 5.9:** Toast appears on message send. Undo reverses action.

### Step 5.10 — Keyboard Shortcuts
**Build:** Global keyboard shortcut handler:
- j/k: navigate messages
- o/Enter: open message
- r: reply, a: reply all, f: forward
- e: archive, #: delete
- u: mark unread, s: star/flag
- c: compose new
- /: focus search
- ?: show shortcuts overlay
- Escape: close composer/modal

**Test Gate 5.10:** All shortcuts trigger correct actions. Shortcuts overlay renders.

### 🛑 MANUAL CHECKPOINT 5
**Daniel verifies IN BROWSER:**
- [ ] App loads with correct layout (3 columns)
- [ ] Account switcher shows connected accounts with status
- [ ] Can switch between accounts, unified inbox works
- [ ] Folder tree shows correct folders with unread counts
- [ ] Message list loads, scrolls, shows sender/subject/date/preview
- [ ] Clicking message shows full body in reading pane
- [ ] HTML emails render correctly (no broken layouts, images work)
- [ ] Can compose and send email (from correct account)
- [ ] Can reply, reply all, forward
- [ ] Attachments download works
- [ ] Search returns results
- [ ] Settings save correctly
- [ ] Dark mode works
- [ ] No console errors
- [ ] Feels fast (< 200ms for list load, < 100ms for navigation)

**Sign off: _______________ Date: _______________**

---

## AGENT 6: AI LAYER (Steps 6.1-6.5) — PARALLEL

### Step 6.1 — AI Service Core with Cost Management

**Build:** `lib/ai/client.ts` — Claude API client with STRICT cost controls

**CRITICAL:** AI costs can exceed revenue if not managed carefully. A user on the $19/month Professional plan could easily consume $20/month in AI costs if unconstrained.

#### Implementation Requirements

1. **AI Usage Tracking Table:**
```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  operation TEXT NOT NULL CHECK (operation IN ('draft', 'summarize', 'smart_reply', 'priority_score', 'categorize')),
  model TEXT NOT NULL, -- 'claude-sonnet-4', 'claude-haiku-3', etc.
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at DESC);
```

2. **Model Selection Strategy:**
   - **Priority scoring:** Use `claude-haiku-3-20250306` (cheap, fast) — $0.25 per million input tokens
   - **Categorization:** Use `claude-haiku-3-20250306`
   - **Smart replies:** Use `claude-sonnet-4` (better quality) — $3 per million input tokens
   - **Drafting:** Use `claude-sonnet-4` (best quality)
   - **Summarization:** Use `claude-sonnet-4`

3. **Token Credit System (RECOMMENDED APPROACH):**

   Instead of hard operation limits, users get a monthly **token budget** that gets consumed based on actual API usage.

   **Token Budget by Plan:**
   ```typescript
   const TOKEN_BUDGETS = {
     starter: 0,              // AI disabled
     professional: 500_000,   // ~170 draft operations or ~2000 summaries
     team: 1_500_000,         // ~500 drafts or ~6000 summaries
     enterprise: 5_000_000,   // ~1700 drafts or ~20000 summaries
   }
   ```

   **Token Pricing Table:**
   | Operation | Model | Avg Input Tokens | Avg Output Tokens | Total Tokens |
   |-----------|-------|------------------|-------------------|--------------|
   | Draft email | Sonnet | 2000 | 800 | **2800** |
   | Summarize thread | Sonnet | 800 | 200 | **1000** |
   | Smart reply (3 options) | Sonnet | 600 | 300 | **900** |
   | Priority score | Haiku | 200 | 50 | **250** |
   | Categorize | Haiku | 200 | 50 | **250** |

   **Database Table:**
   ```sql
   CREATE TABLE user_ai_credits (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     tenant_id UUID NOT NULL REFERENCES tenants(id),
     plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'team', 'enterprise')),
     -- Token tracking
     tokens_allocated INTEGER NOT NULL DEFAULT 0,      -- refreshes monthly
     tokens_used INTEGER NOT NULL DEFAULT 0,           -- resets to 0 each month
     tokens_remaining INTEGER GENERATED ALWAYS AS (tokens_allocated - tokens_used) STORED,
     -- Reset tracking
     last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     next_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
     -- One-time bonus credits
     bonus_tokens INTEGER DEFAULT 0,                   -- never expire, use first
     bonus_tokens_used INTEGER DEFAULT 0,
     bonus_tokens_remaining INTEGER GENERATED ALWAYS AS (bonus_tokens - bonus_tokens_used) STORED,
     -- Timestamps
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_user_ai_credits_user ON user_ai_credits(user_id);
   CREATE INDEX idx_user_ai_credits_reset ON user_ai_credits(next_reset_at);
   ```

   **Token Consumption Logic:**
   ```typescript
   // lib/ai/credits.ts
   export async function consumeTokens(
     userId: string,
     tokensNeeded: number
   ): Promise<{ allowed: boolean; remaining: number }> {
     const credits = await getUserCredits(userId)

     // Check if reset needed
     if (new Date() >= credits.next_reset_at) {
       await resetMonthlyCredits(userId)
       credits = await getUserCredits(userId) // Re-fetch after reset
     }

     // Calculate available tokens (bonus tokens used first)
     const bonusAvailable = credits.bonus_tokens - credits.bonus_tokens_used
     const monthlyAvailable = credits.tokens_allocated - credits.tokens_used
     const totalAvailable = bonusAvailable + monthlyAvailable

     if (tokensNeeded > totalAvailable) {
       return { allowed: false, remaining: totalAvailable }
     }

     // Consume bonus tokens first, then monthly allocation
     if (bonusAvailable >= tokensNeeded) {
       await db.query('UPDATE user_ai_credits SET bonus_tokens_used = bonus_tokens_used + $1 WHERE user_id = $2', [tokensNeeded, userId])
     } else if (bonusAvailable > 0) {
       // Use all bonus tokens, then monthly
       await db.query('UPDATE user_ai_credits SET bonus_tokens_used = bonus_tokens, tokens_used = tokens_used + $1 WHERE user_id = $2', [tokensNeeded - bonusAvailable, userId])
     } else {
       // Use only monthly tokens
       await db.query('UPDATE user_ai_credits SET tokens_used = tokens_used + $1 WHERE user_id = $2', [tokensNeeded, userId])
     }

     return { allowed: true, remaining: totalAvailable - tokensNeeded }
   }
   ```

   **User-Facing Display:**
   ```tsx
   // In Settings > AI Usage
   <div>
     <h3>AI Token Balance</h3>
     <p>500,000 tokens per month on Professional plan</p>
     <ProgressBar value={credits.tokens_used} max={credits.tokens_allocated} />
     <p>{credits.tokens_remaining.toLocaleString()} tokens remaining this month</p>
     <p>Resets on {formatDate(credits.next_reset_at)}</p>

     {credits.bonus_tokens > 0 && (
       <div>
         <p>Bonus credits: {credits.bonus_tokens_remaining.toLocaleString()} tokens</p>
       </div>
     )}

     <h4>Token Costs</h4>
     <ul>
       <li>Draft email: ~2,800 tokens</li>
       <li>Summarize thread: ~1,000 tokens</li>
       <li>Smart reply suggestions: ~900 tokens</li>
       <li>Priority scoring: ~250 tokens</li>
     </ul>
   </div>
   ```

   **Bonus Token Use Cases:**
   - New user onboarding: Give 10,000 bonus tokens to try AI features
   - Referral rewards: 50,000 bonus tokens per successful referral
   - Apology credits: If AI service has downtime, grant bonus tokens
   - Upsell incentive: "Upgrade to Team plan, get 1M bonus tokens"

   **Benefits of Token System:**
   - Fair: Heavy users of cheap operations (summarize) don't penalize light users of expensive operations (drafts)
   - Flexible: Users can choose how to spend tokens
   - Transparent: "You have 250,000 tokens left" is clearer than "You have 83 operations left"
   - Monetizable: Sell token top-up packs ($5 for 200,000 tokens)
   - Gamified: Users see balance and plan usage accordingly

4. **Cost Estimation:**
   ```typescript
   function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
     const PRICING = {
       'claude-sonnet-4': { input: 3.0, output: 15.0 }, // per million tokens
       'claude-haiku-3': { input: 0.25, output: 1.25 },
     }

     const price = PRICING[model]
     return (inputTokens * price.input + outputTokens * price.output) / 1_000_000
   }
   ```

   Log EVERY AI call with cost estimate to `ai_usage` table.

5. **Tenant-Level Cost Alerts:**
   - If a tenant's monthly AI costs exceed $50: send alert email to tenant owner
   - If exceeds $100: send warning (consider upselling to Enterprise)
   - If exceeds $200: consider throttling or contacting tenant

6. **Admin Dashboard:**
   - `GET /api/admin/ai-usage` — view AI usage by tenant, user, operation
   - Show: total cost this month, top users, top operations
   - Export to CSV for billing analysis

7. **Client-Side Indicators:**
   - Show user how many AI operations they have left today
   - E.g., "42 AI operations remaining today" in settings
   - Disable AI buttons if limit reached

8. **Prompt Optimization:**
   - Keep prompts concise (fewer input tokens)
   - Request shorter outputs where possible (e.g., summaries max 200 tokens)
   - Batch operations where possible (summarize 5 messages in one call vs. 5 calls)

9. **Caching Strategy:**
   - Cache AI results for identical inputs (e.g., same message summarized twice)
   - Store cached results in `ai_cache` table with TTL (7 days)
   ```sql
   CREATE TABLE ai_cache (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     operation TEXT NOT NULL,
     input_hash TEXT NOT NULL, -- SHA256 of input
     result JSONB NOT NULL,
     expires_at TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(operation, input_hash)
   );
   CREATE INDEX idx_ai_cache_lookup ON ai_cache(operation, input_hash) WHERE expires_at > NOW();
   ```

10. **Fallback Behavior:**
    - If rate limit exceeded: gracefully degrade (show "AI unavailable" instead of crashing)
    - If API error: retry once, then fail gracefully
    - If timeout (>30s): cancel request, show error

#### API Client Implementation

```typescript
// lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, logUsage, getCachedResult, cacheResult } from './usage-tracker'

export class AIClient {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async generate({
    userId,
    tenantId,
    operation,
    prompt,
    model = 'claude-sonnet-4-20250514',
    maxTokens = 500,
  }: AIGenerateParams): Promise<AIGenerateResult> {
    // 1. Check rate limit
    const allowed = await checkRateLimit(userId, operation)
    if (!allowed) {
      throw new Error('AI_RATE_LIMIT_EXCEEDED')
    }

    // 2. Check cache
    const cached = await getCachedResult(operation, prompt)
    if (cached) {
      return { result: cached, fromCache: true }
    }

    // 3. Call Claude API
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = response.content[0].text

    // 4. Log usage and cost
    await logUsage({
      tenantId,
      userId,
      operation,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimatedCost: estimateCost(model, response.usage.input_tokens, response.usage.output_tokens),
    })

    // 5. Cache result
    await cacheResult(operation, prompt, result)

    return { result, fromCache: false }
  }
}
```

#### Test Gate 6.1
```typescript
describe('AI Service Core', () => {
  test('Rate limiting enforced', async () => {
    // Exceed daily limit
    for (let i = 0; i < 51; i++) {
      await aiClient.generate({ userId, operation: 'draft', prompt: 'test' })
    }
    // 51st call should fail
    await expect(aiClient.generate({ userId, operation: 'draft', prompt: 'test' }))
      .rejects.toThrow('AI_RATE_LIMIT_EXCEEDED')
  })

  test('Usage logged to database', async () => {
    await aiClient.generate({ userId, operation: 'draft', prompt: 'test' })
    const usage = await getAIUsage(userId)
    expect(usage.length).toBeGreaterThan(0)
    expect(usage[0].estimated_cost_usd).toBeGreaterThan(0)
  })

  test('Cache prevents duplicate API calls', async () => {
    const result1 = await aiClient.generate({ userId, operation: 'summarize', prompt: 'same prompt' })
    const result2 = await aiClient.generate({ userId, operation: 'summarize', prompt: 'same prompt' })
    expect(result1.result).toBe(result2.result)
    expect(result2.fromCache).toBe(true)
  })
})
```

**AI Cost Budget (monthly per user):**
- Starter: $0 (AI disabled)
- Professional ($19/month plan): ~$3/user/month AI budget (50 operations/day * 30 days = 1500 ops)
- Team ($29/month plan): ~$8/user/month AI budget
- Enterprise ($49/month plan): ~$15/user/month AI budget

**If costs exceed budget:** You're losing money. Either increase prices or tighten rate limits.

### Step 6.2 — Email Drafting
**Build:** `POST /api/ai/draft/route.ts`:
- Input: context (thread), instruction (user's intent), tone preference
- Output: drafted email HTML
- Supports: new composition, reply draft, follow-up
- Tone options: professional, friendly, concise, formal
- Inserts into composer

### Step 6.3 — Thread Summarization
**Build:** `POST /api/ai/summarize/route.ts`:
- Input: array of messages in thread
- Output: 2-3 sentence summary + key action items
- One-click summary button in thread view
- Auto-summarize option for long threads (> 5 messages)

### Step 6.4 — Smart Replies
**Build:** `POST /api/ai/smart-replies/route.ts`:
- Input: latest message in thread
- Output: 3 suggested reply options (short, medium, detailed)
- Displayed as chips below message
- Click to insert into composer

### Step 6.5 — Priority Scoring & Categorization
**Build:** Background processing on new messages:
- Priority score (0.0-1.0) based on sender importance, content urgency, keywords
- Auto-categorization (client communication, internal, newsletter, etc.)
- Sentiment detection (positive, neutral, negative, urgent)
- Stored in messages table AI fields
- Trigger: new message synced → queue AI processing

### 🛑 MANUAL CHECKPOINT 6
**Daniel verifies:**
- [ ] AI draft generates coherent, professional email from instruction
- [ ] Thread summary accurately captures key points
- [ ] Smart replies are contextually appropriate
- [ ] Priority scoring visible in message list (optional indicator)
- [ ] AI features disabled for Starter plan users

**Sign off: _______________ Date: _______________**

---

## AGENT 7: TEAMS & CRM (Steps 7.1-7.6) — PARALLEL

### Step 7.1 — Team Management
**Build:** CRUD for teams and team members. UI in Settings.

### Step 7.2 — Shared Inbox Setup
**Build:** Connect a Microsoft account as a shared inbox. Team members see it in sidebar.

### Step 7.3 — Assignment System
**Build:** Assign conversations to team members. Status tracking. Auto-assignment.

### Step 7.4 — Internal Notes & Collision Detection
**Build:** Notes on assignments (internal only). Show "X is viewing/replying" indicator.

### Step 7.5 — CRM Contact & Deal Management
**Build:** CRM sidebar in message view. Auto-create contacts from email. Deal pipeline.

### Step 7.6 — Activity Logging
**Build:** Auto-log emails as CRM activities. Manual note/call/meeting logging.

### 🛑 MANUAL CHECKPOINT 7
**Daniel verifies:**
- [ ] Can create team and add members
- [ ] Shared inbox appears in sidebar for team members
- [ ] Can assign conversation to team member
- [ ] Internal notes visible only to team
- [ ] CRM contact auto-created from email interaction
- [ ] Activity timeline shows email history for contact

**Sign off: _______________ Date: _______________**

---

## AGENT 8: WHITE-LABEL & POLISH (Steps 8.1-8.5) — PARALLEL

### Step 8.1 — Tenant Branding System
**Build:** Branding settings page. Logo upload, color picker, CSS custom properties.

### Step 8.2 — Custom Domain Support
**Build:** CNAME verification flow. Middleware to resolve tenant from domain.

### Step 8.3 — Branded Login Page
**Build:** Login page uses tenant branding (logo, colors, tagline, background).

### Step 8.4 — Onboarding Wizard
**Build:** First-time user flow: connect account → choose preferences → tutorial overlay.

### Step 8.5 — Error Pages & Edge Cases
**Build:** Custom 400, 403, 404, 500, offline pages. Loading states. Empty states.

### 🛑 MANUAL CHECKPOINT 8 (FINAL)
**Daniel verifies:**
- [ ] White-label branding applies throughout app
- [ ] Custom domain resolves to correct tenant
- [ ] Onboarding flow works for new user
- [ ] Error pages render correctly
- [ ] All features from previous checkpoints still work
- [ ] Performance: Lighthouse > 90
- [ ] No console errors
- [ ] Mobile responsive
- [ ] READY FOR BETA USERS

**Sign off: _______________ Date: _______________**

---

## BUILD-STATE.md TEMPLATE

Create this file at project root. Update after EVERY step.

```markdown
# BUILD-STATE.md — EaseMail v3.0

## Current Status: STEP ___

| Step | Name | Status | Test Result | Date |
|------|------|--------|-------------|------|
| 1.1 | Project Scaffold | ⬜ | ⬜ | |
| 1.2 | Database Migration | ⬜ | ⬜ | |
| 1.3 | Environment Config | ⬜ | ⬜ | |
| 1.4 | Supabase Client Setup | ⬜ | ⬜ | |
| 1.5 | Zustand Store Setup | ⬜ | ⬜ | |
| CP1 | **MANUAL CHECKPOINT 1** | ⬜ | ⬜ | |
| 2.1 | NextAuth Microsoft Provider | ⬜ | ⬜ | |
| 2.2 | Token Storage Service | ⬜ | ⬜ | |
| 2.3 | Graph Client Factory | ⬜ | ⬜ | |
| 2.4 | Connect Account Flow | ⬜ | ⬜ | |
| 2.5 | Disconnect Account Flow | ⬜ | ⬜ | |
| 2.6 | Reauth Flow | ⬜ | ⬜ | |
| 2.7 | Token Refresh Job | ⬜ | ⬜ | |
| CP2 | **MANUAL CHECKPOINT 2** | ⬜ | ⬜ | |
| 3.1 | Folder Sync | ⬜ | ⬜ | |
| 3.2 | Message Delta Sync | ⬜ | ⬜ | |
| 3.3 | Sync Orchestrator | ⬜ | ⬜ | |
| 3.4 | Webhook Setup & Handler | ⬜ | ⬜ | |
| 3.5 | Webhook Renewal Job | ⬜ | ⬜ | |
| 3.6 | Attachment Sync | ⬜ | ⬜ | |
| CP3 | **MANUAL CHECKPOINT 3** | ⬜ | ⬜ | |
| 4.1 | List Messages API | ⬜ | ⬜ | |
| 4.2 | Get Single Message API | ⬜ | ⬜ | |
| 4.3 | Compose & Send API | ⬜ | ⬜ | |
| 4.4 | Message Actions API | ⬜ | ⬜ | |
| 4.5 | Folder Management API | ⬜ | ⬜ | |
| 4.6 | Search API | ⬜ | ⬜ | |
| 4.7 | Contacts API | ⬜ | ⬜ | |
| 4.8 | Account Management API | ⬜ | ⬜ | |
| CP4 | **MANUAL CHECKPOINT 4** | ⬜ | ⬜ | |
| 5.1 | App Layout Shell | ⬜ | ⬜ | |
| 5.2 | Account Switcher | ⬜ | ⬜ | |
| 5.3 | Folder Tree | ⬜ | ⬜ | |
| 5.4 | Message List | ⬜ | ⬜ | |
| 5.5 | Message Viewer | ⬜ | ⬜ | |
| 5.6 | Composer | ⬜ | ⬜ | |
| 5.7 | Search UI | ⬜ | ⬜ | |
| 5.8 | Settings Pages | ⬜ | ⬜ | |
| 5.9 | Notifications & Toasts | ⬜ | ⬜ | |
| 5.10 | Keyboard Shortcuts | ⬜ | ⬜ | |
| CP5 | **MANUAL CHECKPOINT 5** | ⬜ | ⬜ | |
| 6.1 | AI Service Core | ⬜ | ⬜ | |
| 6.2 | Email Drafting | ⬜ | ⬜ | |
| 6.3 | Thread Summarization | ⬜ | ⬜ | |
| 6.4 | Smart Replies | ⬜ | ⬜ | |
| 6.5 | Priority Scoring | ⬜ | ⬜ | |
| CP6 | **MANUAL CHECKPOINT 6** | ⬜ | ⬜ | |
| 7.1 | Team Management | ⬜ | ⬜ | |
| 7.2 | Shared Inbox Setup | ⬜ | ⬜ | |
| 7.3 | Assignment System | ⬜ | ⬜ | |
| 7.4 | Notes & Collision Detection | ⬜ | ⬜ | |
| 7.5 | CRM Contact & Deal Mgmt | ⬜ | ⬜ | |
| 7.6 | Activity Logging | ⬜ | ⬜ | |
| CP7 | **MANUAL CHECKPOINT 7** | ⬜ | ⬜ | |
| 8.1 | Tenant Branding | ⬜ | ⬜ | |
| 8.2 | Custom Domain | ⬜ | ⬜ | |
| 8.3 | Branded Login | ⬜ | ⬜ | |
| 8.4 | Onboarding Wizard | ⬜ | ⬜ | |
| 8.5 | Error Pages & Polish | ⬜ | ⬜ | |
| CP8 | **MANUAL CHECKPOINT 8 (FINAL)** | ⬜ | ⬜ | |

## Error Log
| Date | Step | Error | Resolution |
|------|------|-------|------------|
| | | | |

## Notes
- Status: ⬜ Not started | 🔨 In progress | ✅ Passed | ❌ Failed | 🔄 Retrying
```

---

## CLAUDE CODE SUBAGENT PROMPT TEMPLATE

When dispatching a subagent via Claude Code's Task tool, use this template:

```
You are building Step {X.Y} of EaseMail v3.0.

CONTEXT:
- Read PROJECT-SPEC.md for full architecture
- Read BUILD-STATE.md for current progress
- All previous steps are COMPLETE and TESTED

YOUR TASK:
{Description from the step above}

CONSTRAINTS:
1. ONLY build what this step describes. Do not touch other modules.
2. Follow the existing code patterns from previous steps.
3. Write the test from the Test Gate section.
4. Run the test. If it fails, fix your code until it passes.
5. Do NOT proceed to the next step.
6. Update BUILD-STATE.md with your result.

FILES YOU MAY MODIFY:
{List specific files this step touches}

FILES YOU MUST NOT MODIFY:
{List files owned by other agents}

WHEN DONE:
1. Run the test gate script/test
2. Report: PASS or FAIL with details
3. Update BUILD-STATE.md
```

---

## APPENDIX A: GRAPH API QUICK REFERENCE

### Required Scopes
```
Mail.ReadWrite Mail.Send User.Read Contacts.Read offline_access openid profile
```

### Key Endpoints
| Operation | Method | Endpoint |
|-----------|--------|----------|
| User profile | GET | /me |
| List folders | GET | /me/mailFolders |
| List messages | GET | /me/mailFolders/{id}/messages |
| Get message | GET | /me/messages/{id} |
| Send email | POST | /me/sendMail |
| Create draft | POST | /me/messages |
| Update draft | PATCH | /me/messages/{id} |
| Delete message | DELETE | /me/messages/{id} |
| Move message | POST | /me/messages/{id}/move |
| Search | GET | /me/messages?$search= |
| Delta sync | GET | /me/mailFolders/{id}/messages/delta |
| Attachments | GET | /me/messages/{id}/attachments |
| Contacts | GET | /me/contacts |
| Create subscription | POST | /subscriptions |

### Rate Limits
- 10,000 requests per 10 min per mailbox
- 4 concurrent requests per mailbox
- Direct attachment max: 3MB (use upload session for larger)
- Webhook subscription max lifetime: ~3 days

---

## APPENDIX B: SECURITY CHECKLIST

- [ ] Tokens encrypted at rest in Supabase (vault or pgcrypto)
- [ ] RLS enabled on ALL tables
- [ ] CSP headers prevent XSS in email rendering
- [ ] DOMPurify sanitizes all HTML email content
- [ ] No client-side token exposure (tokens only in server-side API routes)
- [ ] CSRF protection on all mutation endpoints
- [ ] Rate limiting on auth and send endpoints
- [ ] Input validation (zod) on all API routes
- [ ] SQL injection prevention (parameterized queries via Supabase client)
- [ ] File upload validation (type, size limits)
- [ ] Webhook validation (clientState verification)
- [ ] Audit log for sensitive operations (account connect/disconnect, send)

---

## APPENDIX C: PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| Initial page load (LCP) | < 2.5s |
| Message list render | < 200ms |
| Message body render | < 100ms |
| Search results | < 500ms |
| Send email | < 2s |
| Sync latency (webhook → UI) | < 5s |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |
| Bundle size (gzipped) | < 500KB |
