-- ================================================================
-- WIPE DATABASE - Run this in Supabase SQL Editor
-- ================================================================
-- This script removes all tables and custom types from the public schema
-- Use this to start fresh with EaseMail v3

-- Drop all tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers to avoid FK constraint issues
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all custom types
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e')
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Verify everything is clean (should return 0 rows)
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
