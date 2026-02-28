-- Migration: AI Features (Agent 6.1)
-- Description: Tables for AI usage tracking, token credit management, and result caching
-- Date: 2026-02-25

-- =============================================================================
-- AI USAGE TRACKING
-- Logs every AI API call with token counts and estimated costs
-- =============================================================================

CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('draft', 'summarize', 'smart_reply', 'priority_score', 'categorize')),
  model TEXT NOT NULL, -- 'claude-sonnet-4-20250514', 'claude-haiku-3-20250306', etc.
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_operation ON ai_usage(operation, created_at DESC);

COMMENT ON TABLE ai_usage IS 'Tracks every AI API call for billing, analytics, and cost management';
COMMENT ON COLUMN ai_usage.operation IS 'Type of AI operation: draft, summarize, smart_reply, priority_score, categorize';
COMMENT ON COLUMN ai_usage.estimated_cost_usd IS 'Estimated cost in USD based on model pricing (input + output tokens)';

-- =============================================================================
-- USER AI CREDITS (TOKEN BUDGET SYSTEM)
-- Monthly token allocation with bonus credits and automatic reset
-- =============================================================================

CREATE TABLE user_ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'team', 'enterprise')),

  -- Monthly token tracking
  tokens_allocated INTEGER NOT NULL DEFAULT 0,      -- refreshes monthly based on plan
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
CREATE INDEX idx_user_ai_credits_tenant ON user_ai_credits(tenant_id);

COMMENT ON TABLE user_ai_credits IS 'Token-based AI credit system with monthly allocations and bonus tokens';
COMMENT ON COLUMN user_ai_credits.tokens_allocated IS 'Monthly token budget based on subscription plan';
COMMENT ON COLUMN user_ai_credits.tokens_used IS 'Tokens consumed this month (resets monthly)';
COMMENT ON COLUMN user_ai_credits.bonus_tokens IS 'One-time bonus tokens that never expire (referrals, promotions, apologies)';

-- =============================================================================
-- AI CACHE
-- Caches AI results for identical inputs to reduce API costs
-- =============================================================================

CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  input_hash TEXT NOT NULL, -- SHA256 hash of input (prevents storing full prompts)
  result JSONB NOT NULL,
  hit_count INTEGER DEFAULT 1, -- Track cache effectiveness
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(operation, input_hash)
);

CREATE INDEX idx_ai_cache_lookup ON ai_cache(operation, input_hash);
CREATE INDEX idx_ai_cache_expiry ON ai_cache(expires_at);

COMMENT ON TABLE ai_cache IS 'Caches AI results to avoid redundant API calls (7-day TTL)';
COMMENT ON COLUMN ai_cache.input_hash IS 'SHA256 hash of the input prompt for privacy and storage efficiency';
COMMENT ON COLUMN ai_cache.hit_count IS 'Number of times this cached result was reused';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to automatically update user_ai_credits.updated_at
CREATE OR REPLACE FUNCTION update_user_ai_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_ai_credits_updated_at
  BEFORE UPDATE ON user_ai_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_credits_updated_at();

-- Function to reset monthly AI credits (called by cron job)
CREATE OR REPLACE FUNCTION reset_monthly_ai_credits()
RETURNS void AS $$
BEGIN
  UPDATE user_ai_credits
  SET
    tokens_used = 0,
    last_reset_at = NOW(),
    next_reset_at = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE next_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_monthly_ai_credits IS 'Resets tokens_used to 0 for users whose next_reset_at has passed';

-- Function to clean up expired AI cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_ai_cache IS 'Deletes expired AI cache entries, returns count of deleted rows';

-- =============================================================================
-- INITIAL DATA
-- Set token allocations based on plan (can be adjusted later)
-- =============================================================================

-- Token budgets by plan (from PROJECT-SPEC.md)
-- starter: 0 (AI disabled)
-- professional: 500,000 tokens (~170 drafts or ~2000 summaries)
-- team: 1,500,000 tokens (~500 drafts or ~6000 summaries)
-- enterprise: 5,000,000 tokens (~1700 drafts or ~20000 summaries)

-- Create AI credits for existing users based on their tenant's plan
-- This will be handled by application logic when users are created/upgraded
