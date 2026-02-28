/**
 * Server-side Supabase Client (RLS-Respecting)
 * Use this in API routes to respect Row-Level Security policies
 * DO NOT use createAdminClient() unless you specifically need to bypass RLS
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

/**
 * Create a Supabase client for use in Server Components and API routes
 * This client respects RLS policies based on the authenticated user
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Cookie setting might fail in Server Components
          }
        },
      },
    }
  );
}

/**
 * Get current authenticated user with full details from database
 * Use this in API routes to get the current user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, tenant_id, email, display_name, role')
    .eq('email', session.user.email)
    .single();

  if (error || !user) {
    console.error('Error fetching user from session:', error);
    return null;
  }

  return user;
}

/**
 * Check if current user has a specific role
 * Roles have hierarchy: owner > admin > member
 */
export async function hasRole(requiredRole: 'owner' | 'admin' | 'member'): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) return false;

  const roleHierarchy: Record<string, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Verify user has access to a specific tenant
 */
export async function verifyTenantAccess(tenantId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) return false;

  return user.tenant_id === tenantId;
}
