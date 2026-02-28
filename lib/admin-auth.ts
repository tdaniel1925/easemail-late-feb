import { cookies } from 'next/headers';

const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_SECRET = process.env.ADMIN_API_KEY || '';

/**
 * Check if the current request has admin authentication
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!adminSession?.value) {
    return false;
  }

  // In production, you'd want to use encrypted/signed tokens
  // For now, we're just checking if the cookie value matches the API key
  return adminSession.value === ADMIN_SESSION_SECRET;
}

/**
 * Verify admin API key
 */
export function verifyAdminKey(apiKey: string): boolean {
  if (!ADMIN_SESSION_SECRET) {
    console.error('[Admin Auth] ADMIN_API_KEY not set in environment');
    return false;
  }

  return apiKey === ADMIN_SESSION_SECRET;
}

/**
 * Create admin session cookie value
 */
export function createAdminSession(): string {
  return ADMIN_SESSION_SECRET;
}
