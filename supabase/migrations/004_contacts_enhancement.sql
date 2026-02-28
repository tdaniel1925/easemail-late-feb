-- ================================================================
-- EaseMail v3.0 - Contacts Module Enhancement
-- Migration: 004
-- Created: 2026-02-24
-- Description: Add contact groups, interactions, and enhance contacts table
-- ================================================================

-- ================================================================
-- ENHANCE ACCOUNT_CONTACTS TABLE
-- Add missing fields for full Outlook-style contact management
-- ================================================================

ALTER TABLE account_contacts
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS anniversary DATE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS office_location TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS home_phone TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS photo_data TEXT, -- base64 encoded photo from Graph API
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS im_address TEXT, -- instant messaging
ADD COLUMN IF NOT EXISTS personal_notes TEXT;

-- ================================================================
-- CONTACT GROUPS / FOLDERS
-- For organizing contacts (Work, Family, Friends, etc.)
-- ================================================================

CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT, -- from Microsoft Graph contactFolders
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280', -- hex color for UI
  parent_group_id UUID REFERENCES contact_groups(id) ON DELETE CASCADE, -- for nested groups
  is_system BOOLEAN DEFAULT false, -- true for default groups (All, Favorites, etc.)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, name)
);

-- Junction table for many-to-many relationship (contacts can belong to multiple groups)
CREATE TABLE IF NOT EXISTS contact_group_members (
  contact_id UUID NOT NULL REFERENCES account_contacts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, group_id)
);

-- ================================================================
-- CONTACT INTERACTIONS
-- Track all emails, meetings, calls with each contact
-- ================================================================

CREATE TABLE IF NOT EXISTS contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES account_contacts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('email_sent', 'email_received', 'meeting', 'call', 'note')),

  -- Related records (nullable - only one will be set)
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  -- Interaction details
  subject TEXT,
  snippet TEXT, -- first 200 chars of email body or meeting notes
  occurred_at TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, contact_id, interaction_type, occurred_at)
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Contact groups
CREATE INDEX IF NOT EXISTS idx_contact_groups_account ON contact_groups(account_id);
CREATE INDEX IF NOT EXISTS idx_contact_groups_parent ON contact_groups(parent_group_id) WHERE parent_group_id IS NOT NULL;

-- Contact group members
CREATE INDEX IF NOT EXISTS idx_contact_group_members_group ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact ON contact_group_members(contact_id);

-- Contact interactions
CREATE INDEX IF NOT EXISTS idx_contact_interactions_account ON contact_interactions(account_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact ON contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_type ON contact_interactions(contact_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_occurred ON contact_interactions(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_message ON contact_interactions(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_interactions_event ON contact_interactions(event_id) WHERE event_id IS NOT NULL;

-- Enhanced contact fields
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON account_contacts(account_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_contacts_birthday ON account_contacts(birthday) WHERE birthday IS NOT NULL;

-- ================================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================================

COMMENT ON TABLE contact_groups IS 'Contact folders/groups for organization (Work, Family, etc.)';
COMMENT ON TABLE contact_group_members IS 'Many-to-many relationship between contacts and groups';
COMMENT ON TABLE contact_interactions IS 'History of all interactions with each contact (emails, meetings, calls)';

COMMENT ON COLUMN account_contacts.photo_data IS 'Base64 encoded profile photo from Microsoft Graph';
COMMENT ON COLUMN account_contacts.is_favorite IS 'Whether contact is marked as favorite';
COMMENT ON COLUMN account_contacts.categories IS 'Array of category tags from Graph API';

COMMENT ON COLUMN contact_interactions.interaction_type IS 'Type: email_sent, email_received, meeting, call, note';
COMMENT ON COLUMN contact_interactions.snippet IS 'Preview text (first 200 chars of content)';
