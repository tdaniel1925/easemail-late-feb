-- Migration 007: Add Token Refresh Lock Columns
-- Fixes race condition in token refresh for multi-instance deployments
-- Created: 2026-02-28

-- Add lock tracking columns to account_tokens table
ALTER TABLE account_tokens
ADD COLUMN IF NOT EXISTS refresh_lock_acquired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refresh_lock_expires_at TIMESTAMPTZ;

-- Add index for faster lock queries
CREATE INDEX IF NOT EXISTS idx_account_tokens_lock_expiry
ON account_tokens(refresh_lock_expires_at)
WHERE refresh_lock_expires_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN account_tokens.refresh_lock_acquired_at IS 'Timestamp when token refresh lock was acquired (for distributed locking)';
COMMENT ON COLUMN account_tokens.refresh_lock_expires_at IS 'Timestamp when token refresh lock expires (prevents indefinite locks if process crashes)';
