-- ================================================================
-- Migration 008: Fix Duplicate Folder Issue
-- Created: 2026-02-28
-- Description: Adds is_primary flag to handle duplicate inbox/sent folders
-- ================================================================

-- ================================================================
-- Add is_primary column to account_folders
-- Used to mark the primary folder when there are duplicates (e.g., "Inbox" and "INBOX")
-- ================================================================
ALTER TABLE account_folders
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- ================================================================
-- Create index for faster primary folder lookups
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_account_folders_primary
ON account_folders(account_id, folder_type, is_primary)
WHERE is_primary = true;

-- ================================================================
-- Mark primary folders for each account
-- For each account + folder_type combination, mark the folder with the most messages as primary
-- ================================================================

-- Step 1: Mark all folders as non-primary first
UPDATE account_folders SET is_primary = false;

-- Step 2: Mark the folder with the most messages as primary for each account/type
WITH ranked_folders AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY account_id, folder_type
      ORDER BY total_count DESC, unread_count DESC, created_at ASC
    ) as rank
  FROM account_folders
  WHERE folder_type IN ('inbox', 'sentitems', 'drafts', 'deleteditems', 'junkemail', 'archive')
)
UPDATE account_folders
SET is_primary = true
FROM ranked_folders
WHERE account_folders.id = ranked_folders.id
  AND ranked_folders.rank = 1;

-- Step 3: For custom folders (no duplicates expected), mark all as primary
UPDATE account_folders
SET is_primary = true
WHERE folder_type = 'custom';

-- ================================================================
-- Add comment to explain the column
-- ================================================================
COMMENT ON COLUMN account_folders.is_primary IS 'Marks the primary folder when there are duplicates (e.g., "Inbox" and "INBOX"). For each account + folder_type, only one folder should be primary.';

-- ================================================================
-- Verification query (commented out - uncomment to verify):
-- ================================================================
-- SELECT
--   account_id,
--   folder_type,
--   display_name,
--   total_count,
--   is_primary,
--   COUNT(*) OVER (PARTITION BY account_id, folder_type) as duplicate_count
-- FROM account_folders
-- WHERE folder_type = 'inbox'
-- ORDER BY account_id, total_count DESC;
