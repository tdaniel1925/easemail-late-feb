-- ================================================================
-- EaseMail v3.0 - Calendar, Contacts, and Teams Support
-- Migration: 003
-- Created: 2026-02-24
-- Description: Add calendar events, update sync_state, enable Teams
-- ================================================================

-- ================================================================
-- UPDATE SYNC_STATE TABLE
-- Make it support all resource types (messages, calendar, contacts, teams)
-- ================================================================

-- Add resource_type column if it doesn't exist
ALTER TABLE sync_state
ADD COLUMN IF NOT EXISTS resource_type TEXT;

-- Make folder_id nullable (only used for message sync)
ALTER TABLE sync_state
ALTER COLUMN folder_id DROP NOT NULL;

-- Add delta_token column (rename from delta_link)
ALTER TABLE sync_state
ADD COLUMN IF NOT EXISTS delta_token TEXT;

-- Drop old unique constraint and add new one
ALTER TABLE sync_state
DROP CONSTRAINT IF EXISTS sync_state_account_id_folder_id_key;

-- Add new unique constraint on account_id + resource_type
ALTER TABLE sync_state
ADD CONSTRAINT sync_state_account_resource_unique
UNIQUE (account_id, resource_type);

-- Add index for resource_type
CREATE INDEX IF NOT EXISTS idx_sync_state_resource_type
ON sync_state(account_id, resource_type);

-- ================================================================
-- CALENDAR EVENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,

  -- Basic event info
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  location TEXT,

  -- Time and recurrence
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,

  -- Online meeting info
  is_online_meeting BOOLEAN DEFAULT false,
  meeting_url TEXT,
  meeting_provider TEXT, -- Teams, Zoom, etc.

  -- Organizer and attendees
  organizer_name TEXT,
  organizer_email TEXT,
  attendees JSONB DEFAULT '[]', -- Array of {name, email, status}

  -- Status and response
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('tentative', 'confirmed', 'cancelled')),
  response_status TEXT DEFAULT 'none'
    CHECK (response_status IN ('none', 'organizer', 'tentativelyAccepted', 'accepted', 'declined', 'notResponded')),

  -- Metadata
  reminder_minutes INTEGER DEFAULT 15,
  categories TEXT[] DEFAULT '{}',
  importance TEXT DEFAULT 'normal'
    CHECK (importance IN ('low', 'normal', 'high')),
  sensitivity TEXT DEFAULT 'normal'
    CHECK (sensitivity IN ('normal', 'personal', 'private', 'confidential')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, graph_id)
);

-- Indexes for calendar events
CREATE INDEX idx_calendar_account ON calendar_events(account_id);
CREATE INDEX idx_calendar_time_range ON calendar_events(account_id, start_time, end_time);
CREATE INDEX idx_calendar_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_organizer ON calendar_events(organizer_email);
CREATE INDEX idx_calendar_response ON calendar_events(account_id, response_status);

-- ================================================================
-- TEAMS CHANNELS
-- ================================================================
CREATE TABLE IF NOT EXISTS teams_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  graph_team_id TEXT NOT NULL,
  graph_channel_id TEXT NOT NULL,

  -- Channel info
  team_name TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  description TEXT,

  -- Metadata
  is_favorite BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, graph_team_id, graph_channel_id)
);

-- Indexes for teams channels
CREATE INDEX idx_teams_channels_account ON teams_channels(account_id);
CREATE INDEX idx_teams_channels_activity ON teams_channels(last_activity_at DESC);
CREATE INDEX idx_teams_channels_team ON teams_channels(graph_team_id);

-- ================================================================
-- TEAMS MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS teams_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES teams_channels(id) ON DELETE CASCADE,
  graph_id TEXT NOT NULL,

  -- Message content
  body_html TEXT,
  body_text TEXT,

  -- Sender info
  from_name TEXT,
  from_email TEXT,

  -- Message metadata
  reply_to_id UUID REFERENCES teams_messages(id),
  reply_count INTEGER DEFAULT 0,
  reactions JSONB DEFAULT '[]', -- Array of {type, users}
  attachments JSONB DEFAULT '[]',
  mentions JSONB DEFAULT '[]',

  -- Status
  is_deleted BOOLEAN DEFAULT false,
  importance TEXT DEFAULT 'normal'
    CHECK (importance IN ('low', 'normal', 'high', 'urgent')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, graph_id)
);

-- Indexes for teams messages
CREATE INDEX idx_teams_messages_account ON teams_messages(account_id);
CREATE INDEX idx_teams_messages_channel ON teams_messages(channel_id, created_at DESC);
CREATE INDEX idx_teams_messages_thread ON teams_messages(reply_to_id);
CREATE INDEX idx_teams_messages_from ON teams_messages(from_email);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "own_calendar_events" ON calendar_events
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for teams_channels
CREATE POLICY "own_teams_channels" ON teams_channels
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for teams_messages
CREATE POLICY "own_teams_messages" ON teams_messages
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- UPDATE account_contacts TABLE (already exists, just add indexes)
-- ================================================================

-- Add indexes for better contact search performance
CREATE INDEX IF NOT EXISTS idx_contacts_account_email ON account_contacts(account_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_display_name ON account_contacts(account_id, display_name);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON account_contacts(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_last_emailed ON account_contacts(last_emailed_at DESC NULLS LAST);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_channels_updated_at BEFORE UPDATE ON teams_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_messages_updated_at BEFORE UPDATE ON teams_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE calendar_events IS 'Calendar events synced from Microsoft Graph API';
COMMENT ON TABLE teams_channels IS 'Microsoft Teams channels the user has access to';
COMMENT ON TABLE teams_messages IS 'Messages from Microsoft Teams channels';
COMMENT ON COLUMN sync_state.resource_type IS 'Type of resource: messages, messages:{folderId}, calendar, contacts, teams';
COMMENT ON COLUMN calendar_events.recurrence_pattern IS 'JSONB containing recurrence rule from Graph API';
COMMENT ON COLUMN calendar_events.attendees IS 'Array of attendees with name, email, and response status';
COMMENT ON COLUMN teams_messages.reactions IS 'Array of reaction objects with emoji type and user list';
COMMENT ON COLUMN teams_messages.mentions IS 'Array of @mentioned users in the message';
