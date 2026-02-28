-- ================================================================
-- Migration 006: Fix Critical Schema Issues
-- Created: 2026-02-25
-- Description: Fixes schema/code mismatches that break organization creation
-- ================================================================

-- ================================================================
-- FIX #1: Allow 'owner' role in invitations table
-- Issue: Code tries to create 'owner' invitations but CHECK constraint only allows 'admin' and 'member'
-- Impact: Bootstrap API fails with constraint violation
-- ================================================================
ALTER TABLE invitations
DROP CONSTRAINT IF EXISTS invitations_role_check;

ALTER TABLE invitations
ADD CONSTRAINT invitations_role_check
CHECK (role IN ('owner', 'admin', 'member'));

-- ================================================================
-- FIX #2: Make invited_by nullable for system/admin invitations
-- Issue: Admin bootstrap API creates invitations without invited_by, but column is NOT NULL
-- Impact: Bootstrap API fails with NOT NULL constraint violation
-- ================================================================
ALTER TABLE invitations
ALTER COLUMN invited_by DROP NOT NULL;

-- ================================================================
-- FIX #3: Add display_name column to tenants table
-- Issue: Code tries to INSERT/SELECT display_name but column doesn't exist
-- Impact: Bootstrap API fails with "column does not exist" error
-- ================================================================
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill existing tenants with name as display_name
UPDATE tenants
SET display_name = name
WHERE display_name IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE tenants
ALTER COLUMN display_name SET NOT NULL;

-- ================================================================
-- FIX #4: Align plan values to application code
-- Issue: Schema allows 'starter'/'team', code uses 'free' - CHECK constraint mismatch
-- Impact: Creating tenants with plan='free' fails constraint
-- ================================================================

-- Step 1: Remove the CHECK constraint from the plan column entirely
-- We need to recreate the column without the constraint
ALTER TABLE tenants ADD COLUMN plan_temp TEXT;

-- Copy data to temp column
UPDATE tenants SET plan_temp = plan;

-- Drop the old column (this removes the constraint)
ALTER TABLE tenants DROP COLUMN plan;

-- Rename temp column to plan
ALTER TABLE tenants RENAME COLUMN plan_temp TO plan;

-- Step 2: Update existing data to match new values
UPDATE tenants
SET plan = 'free'
WHERE plan = 'starter';

UPDATE tenants
SET plan = 'professional'
WHERE plan = 'team';

-- Step 3: Make column NOT NULL and set default
ALTER TABLE tenants
ALTER COLUMN plan SET NOT NULL;

ALTER TABLE tenants
ALTER COLUMN plan SET DEFAULT 'free';

-- Step 4: Add the new constraint
ALTER TABLE tenants
ADD CONSTRAINT tenants_plan_check
CHECK (plan IN ('free', 'professional', 'enterprise'));

-- ================================================================
-- FIX #5: Make slug nullable (field exists but never populated)
-- Issue: slug has UNIQUE constraint but is never populated, causing issues
-- Impact: Second tenant INSERT would fail on NULL uniqueness
-- ================================================================
ALTER TABLE tenants
ALTER COLUMN slug DROP NOT NULL;

-- Auto-generate slugs from name for existing tenants
UPDATE tenants
SET slug = LOWER(REPLACE(REPLACE(name, '.', '-'), '@', '-'))
WHERE slug IS NULL;

-- ================================================================
-- Verification Queries (Run these to verify migration worked)
-- ================================================================

-- Verify invitations table allows 'owner' role
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'invitations'::regclass AND conname = 'invitations_role_check';

-- Verify invited_by is nullable
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'invited_by';

-- Verify display_name exists and is NOT NULL
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'display_name';

-- Verify plan constraint
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'tenants'::regclass AND conname = 'tenants_plan_check';

-- Verify slug is nullable
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'slug';
