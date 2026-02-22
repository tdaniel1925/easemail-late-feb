-- ================================================================
-- EaseMail v3.0 - Initial Database Schema
-- Migration: 001
-- Created: 2026-02-22
-- Description: Complete schema for multi-tenant email client
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  default_account_id UUID,
  reading_pane TEXT DEFAULT 'right' CHECK (reading_pane IN ('right', 'bottom', 'off')),
  notifications_enabled BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  conversation_view BOOLEAN DEFAULT true,
  auto_advance TEXT DEFAULT 'next' CHECK (auto_advance IN ('next', 'previous', 'list')),
  signature_id UUID,
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
-- CONNECTED ACCOUNTS
-- ================================================================
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  microsoft_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tenant_id_ms TEXT,
  account_type TEXT DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'work', 'shared')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'needs_reauth', 'disabled', 'syncing', 'error')),
  status_message TEXT,
  last_error_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#FF7F50',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  initial_sync_complete BOOLEAN DEFAULT false,
  last_full_sync_at TIMESTAMPTZ,
  messages_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, microsoft_id)
);

-- ================================================================
-- ACCOUNT TOKENS
-- ================================================================
CREATE TABLE account_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  refresh_failure_count INTEGER DEFAULT 0,
  last_refresh_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ACCOUNT FOLDERS
-- ================================================================
CREATE TABLE account_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  parent_graph_id TEXT,
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
  is_favorite BOOLEAN DEFAULT false,
  custom_color TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, graph_id)
);

-- ================================================================
-- MESSAGES
-- ================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES account_folders(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,
  internet_message_id TEXT,
  conversation_id TEXT,
  conversation_index BYTEA,
  subject TEXT,
  preview TEXT,
  from_address TEXT,
  from_name TEXT,
  to_recipients JSONB DEFAULT '[]',
  cc_recipients JSONB DEFAULT '[]',
  bcc_recipients JSONB DEFAULT '[]',
  reply_to JSONB DEFAULT '[]',
  body_html TEXT,
  body_text TEXT,
  body_content_type TEXT DEFAULT 'html' CHECK (body_content_type IN ('html', 'text')),
  is_read BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
  categories TEXT[] DEFAULT '{}',
  has_attachments BOOLEAN DEFAULT false,
  attachment_count INTEGER DEFAULT 0,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ai_summary TEXT,
  ai_priority_score REAL,
  ai_category TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ai_processed_at TIMESTAMPTZ,
  UNIQUE(account_id, graph_id)
);

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
  content_id TEXT,
  storage_path TEXT,
  is_cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- LABELS
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
-- SYNC STATE
-- ================================================================
CREATE TABLE sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES account_folders(id) ON DELETE CASCADE,
  delta_link TEXT,
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
-- WEBHOOK SUBSCRIPTIONS
-- ================================================================
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_subscription_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  change_types TEXT[] NOT NULL DEFAULT '{created,updated,deleted}',
  expiration_at TIMESTAMPTZ NOT NULL,
  client_state TEXT NOT NULL,
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
-- EMAIL TEMPLATES
-- ================================================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  subject TEXT,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  category TEXT,
  is_shared BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ACCOUNT CONTACTS
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
  name TEXT NOT NULL,
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
  is_internal BOOLEAN DEFAULT true,
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
  account_contact_id UUID REFERENCES account_contacts(id) ON DELETE SET NULL,
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
-- TENANT BRANDING
-- ================================================================
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#FF7F50',
  secondary_color TEXT DEFAULT '#0D1B2A',
  accent_color TEXT DEFAULT '#20B2AA',
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  email_from_name TEXT,
  email_footer_html TEXT,
  login_background_url TEXT,
  login_tagline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- MAIL RULES
-- ================================================================
CREATE TABLE mail_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_rule_id TEXT,
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  stop_processing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ADDITIONAL TABLES (MODULARITY-AND-GAPS.md)
-- ================================================================

-- Snoozed Messages
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

-- Scheduled Messages
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  draft_graph_id TEXT,
  to_recipients JSONB NOT NULL DEFAULT '[]',
  cc_recipients JSONB DEFAULT '[]',
  bcc_recipients JSONB DEFAULT '[]',
  subject TEXT,
  body_html TEXT,
  attachment_ids UUID[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snippets
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  shortcut TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_shared BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Pinned Messages
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES account_folders(id),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Follow-up Reminders
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'replied', 'reminded', 'cancelled')),
  replied_at TIMESTAMPTZ,
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Tracking
CREATE TABLE message_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  read_receipt_requested BOOLEAN DEFAULT false,
  tracking_pixel_id TEXT UNIQUE,
  open_count INTEGER DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  opens JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked Senders
CREATE TABLE blocked_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  domain TEXT,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick Steps
CREATE TABLE quick_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'zap',
  keyboard_shortcut TEXT,
  actions JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox Splits
CREATE TABLE inbox_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('ai', 'rule')),
  ai_category TEXT,
  rule_conditions JSONB DEFAULT '[]',
  icon TEXT DEFAULT 'inbox',
  color TEXT,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Failures (from Step 1.6)
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

-- ================================================================
-- PERFORMANCE INDEXES
-- ================================================================

-- Full-text search index
CREATE INDEX idx_messages_fts ON messages
  USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '')));

-- Connected Accounts
CREATE INDEX idx_connected_accounts_user ON connected_accounts(user_id, status);
CREATE INDEX idx_connected_accounts_email ON connected_accounts(email);
CREATE INDEX idx_connected_accounts_sync ON connected_accounts(user_id)
  WHERE initial_sync_complete = false;

-- Account Folders
CREATE INDEX idx_folders_account ON account_folders(account_id, folder_type);
CREATE INDEX idx_folders_unread ON account_folders(account_id) WHERE unread_count > 0;
CREATE INDEX idx_folders_parent ON account_folders(parent_graph_id);

-- Messages (critical - millions of rows)
CREATE INDEX idx_messages_account_folder ON messages(account_id, folder_id, received_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_received ON messages(received_at DESC);
CREATE INDEX idx_messages_unread ON messages(account_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_folder_received ON messages(folder_id, received_at DESC);
CREATE INDEX idx_messages_is_draft ON messages(account_id) WHERE is_draft = true;
CREATE INDEX idx_messages_flagged ON messages(account_id) WHERE is_flagged = true;
CREATE INDEX idx_messages_from ON messages(from_address, received_at DESC);
CREATE INDEX idx_messages_ai_priority ON messages(account_id, ai_priority_score DESC NULLS LAST);
CREATE INDEX idx_messages_has_attachments ON messages(account_id) WHERE has_attachments = true;

-- Message Labels
CREATE INDEX idx_message_labels_label ON message_labels(label_id, message_id);
CREATE INDEX idx_message_labels_created ON message_labels(created_at DESC);

-- Attachments
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_cached ON attachments(message_id) WHERE is_cached = false;

-- Account Contacts
CREATE INDEX idx_contacts_account ON account_contacts(account_id, email);
CREATE INDEX idx_contacts_email_count ON account_contacts(account_id, email_count DESC);
CREATE INDEX idx_contacts_last_emailed ON account_contacts(last_emailed_at DESC NULLS LAST);
CREATE INDEX idx_contacts_name ON account_contacts(display_name text_pattern_ops);

-- Sync State
CREATE INDEX idx_sync_state_status ON sync_state(sync_status, next_retry_at);
CREATE INDEX idx_sync_state_account ON sync_state(account_id, last_sync_at);

-- Webhook Subscriptions
CREATE INDEX idx_webhooks_expiration ON webhook_subscriptions(expiration_at) WHERE is_active = true;
CREATE INDEX idx_webhooks_account ON webhook_subscriptions(account_id, is_active);

-- Email Signatures
CREATE INDEX idx_signatures_user ON email_signatures(user_id, is_default);
CREATE INDEX idx_signatures_account ON email_signatures(account_id);

-- Email Templates
CREATE INDEX idx_templates_tenant ON email_templates(tenant_id, is_shared);
CREATE INDEX idx_templates_use_count ON email_templates(tenant_id, use_count DESC);
CREATE INDEX idx_templates_category ON email_templates(category);

-- Teams & Shared Inboxes
CREATE INDEX idx_team_members_user ON team_members(user_id, team_id);
CREATE INDEX idx_shared_inboxes_team ON shared_inboxes(team_id);
CREATE INDEX idx_inbox_assignments_user ON inbox_assignments(assigned_to, status);
CREATE INDEX idx_inbox_assignments_message ON inbox_assignments(message_id);
CREATE INDEX idx_inbox_notes_assignment ON inbox_notes(assignment_id, created_at DESC);

-- CRM Module
CREATE INDEX idx_crm_contacts_tenant ON crm_contacts(tenant_id, email);
CREATE INDEX idx_crm_contacts_account_contact ON crm_contacts(account_contact_id);
CREATE INDEX idx_crm_companies_tenant ON crm_companies(tenant_id, name);
CREATE INDEX idx_crm_deals_tenant ON crm_deals(tenant_id, stage, created_at DESC);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_assigned ON crm_deals(assigned_to);
CREATE INDEX idx_crm_activities_tenant ON crm_activities(tenant_id, activity_type, performed_at DESC);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);

-- Tenant Branding
CREATE INDEX idx_branding_domain ON tenant_branding(custom_domain) WHERE custom_domain IS NOT NULL;

-- Mail Rules
CREATE INDEX idx_mail_rules_account ON mail_rules(account_id, priority) WHERE is_enabled = true;

-- Labels
CREATE INDEX idx_labels_tenant ON labels(tenant_id, sort_order);

-- Snoozed Messages
CREATE INDEX idx_snooze_pending ON snoozed_messages(snooze_until) WHERE status = 'snoozed';

-- Scheduled Messages
CREATE INDEX idx_scheduled_pending ON scheduled_messages(scheduled_for) WHERE status = 'scheduled';

-- Follow-up Reminders
CREATE INDEX idx_followup_pending ON follow_up_reminders(remind_at) WHERE status = 'waiting';

-- Audit Log
CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);

-- Job Failures
CREATE INDEX idx_job_failures_job_name ON job_failures(job_name, created_at DESC);
CREATE INDEX idx_job_failures_account ON job_failures(account_id) WHERE account_id IS NOT NULL;

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
ALTER TABLE snoozed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Tenant isolation
CREATE POLICY "tenant_isolation" ON users
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Own accounts
CREATE POLICY "own_accounts" ON connected_accounts
  FOR ALL USING (user_id = auth.uid());

-- Own tokens
CREATE POLICY "own_tokens" ON account_tokens
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

-- Own folders
CREATE POLICY "own_folders" ON account_folders
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

-- Own messages
CREATE POLICY "own_messages" ON messages
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

-- Own attachments
CREATE POLICY "own_attachments" ON attachments
  FOR ALL USING (message_id IN (
    SELECT m.id FROM messages m
    JOIN connected_accounts ca ON m.account_id = ca.id
    WHERE ca.user_id = auth.uid()
  ));

-- Tenant labels
CREATE POLICY "tenant_labels" ON labels
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Tenant templates
CREATE POLICY "tenant_templates" ON email_templates
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Tenant CRM
CREATE POLICY "tenant_crm_contacts" ON crm_contacts
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_crm_companies" ON crm_companies
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_crm_deals" ON crm_deals
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_crm_activities" ON crm_activities
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Team access
CREATE POLICY "team_access" ON shared_inboxes
  FOR ALL USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "team_members_access" ON team_members
  FOR ALL USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

-- User-scoped policies
CREATE POLICY "own_preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_signatures" ON email_signatures
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_sync_state" ON sync_state
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_webhooks" ON webhook_subscriptions
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_contacts" ON account_contacts
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_mail_rules" ON mail_rules
  FOR ALL USING (account_id IN (
    SELECT id FROM connected_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "own_snoozes" ON snoozed_messages
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_scheduled" ON scheduled_messages
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "tenant_snippets" ON snippets
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "own_pins" ON pinned_messages
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_reminders" ON follow_up_reminders
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_tracking" ON message_tracking
  FOR ALL USING (message_id IN (
    SELECT m.id FROM messages m
    JOIN connected_accounts ca ON m.account_id = ca.id
    WHERE ca.user_id = auth.uid()
  ));

CREATE POLICY "own_blocks" ON blocked_senders
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_quicksteps" ON quick_steps
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_splits" ON inbox_splits
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "tenant_invitations" ON invitations
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_branding_policy" ON tenant_branding
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "tenant_teams" ON teams
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "own_inbox_assignments" ON inbox_assignments
  FOR ALL USING (shared_inbox_id IN (
    SELECT si.id FROM shared_inboxes si
    JOIN team_members tm ON si.team_id = tm.team_id
    WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "own_inbox_notes" ON inbox_notes
  FOR ALL USING (assignment_id IN (
    SELECT ia.id FROM inbox_assignments ia
    JOIN shared_inboxes si ON ia.shared_inbox_id = si.id
    JOIN team_members tm ON si.team_id = tm.team_id
    WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "own_message_labels" ON message_labels
  FOR ALL USING (message_id IN (
    SELECT m.id FROM messages m
    JOIN connected_accounts ca ON m.account_id = ca.id
    WHERE ca.user_id = auth.uid()
  ));
