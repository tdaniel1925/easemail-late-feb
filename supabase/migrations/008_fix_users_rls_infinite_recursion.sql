-- Fix infinite recursion in users table RLS policy
-- This app uses NextAuth (not Supabase Auth), so auth.uid() is always NULL
-- causing the recursive policy to fail

-- Drop the problematic policy
DROP POLICY IF EXISTS "tenant_isolation" ON users;

-- Disable RLS on users table entirely since we use app-level authentication
-- The app uses NextAuth for authentication, and getCurrentUser() handles tenant isolation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note: All API routes use getCurrentUser() which ensures proper tenant isolation at the app level
-- This is more appropriate for NextAuth-based authentication than database-level RLS
