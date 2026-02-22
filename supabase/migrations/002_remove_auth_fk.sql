-- Remove foreign key constraint from users table that references auth.users
-- We're using NextAuth instead of Supabase Auth for this POC

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Make id column a regular UUID primary key instead of referencing auth.users
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
