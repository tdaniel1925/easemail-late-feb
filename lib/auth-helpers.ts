import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Get the currently authenticated user from the session
 * Returns user with their ID, email, and tenant_id
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    console.log('[Auth] Session:', session ? 'exists' : 'null', session?.user?.email);

    if (!session?.user?.email) {
      console.log('[Auth] No session or email found');
      return null;
    }

    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, tenant_id, display_name')
      .eq('email', session.user.email.toLowerCase())
      .single();

    if (error || !user) {
      console.error('[Auth] Failed to lookup user:', error);
      return null;
    }

    console.log('[Auth] User found:', user.id, user.email);
    return user;
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
}

/**
 * Validate that a connected account belongs to the current user
 * Returns the account if valid, null if invalid or not found
 */
export async function validateAccountOwnership(accountId: string) {
  try {
    console.log('[Auth] Validating account ownership for:', accountId);
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('[Auth] No current user found, validation failed');
      return null;
    }

    console.log('[Auth] Current user:', currentUser.id, 'validating account:', accountId);
    const supabase = createAdminClient();

    // Use limit(1) instead of single() to handle potential duplicates
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', currentUser.id) // Validate ownership
      .limit(1);

    if (error || !accounts || accounts.length === 0) {
      console.error('[Auth] Account validation failed:', error?.message || 'Account not found');
      return null;
    }

    const account = accounts[0];
    console.log('[Auth] Account validated successfully:', account.email);
    return account;
  } catch (error) {
    console.error('[Auth] Error validating account ownership:', error);
    return null;
  }
}

/**
 * Validate that a message belongs to the current user
 * Returns the message if valid, null if invalid or not found
 */
export async function validateMessageOwnership(messageId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const supabase = createAdminClient();

    // Get message and join with connected_accounts to verify ownership
    const { data: message, error } = await supabase
      .from('messages')
      .select('*, connected_accounts!inner(user_id)')
      .eq('id', messageId)
      .single();

    if (error || !message) {
      return null;
    }

    // Verify the message's account belongs to the current user
    const connectedAccount = message.connected_accounts as any;
    if (connectedAccount.user_id !== currentUser.id) {
      console.warn('[Auth] User attempted to access message from another user');
      return null;
    }

    return message;
  } catch (error) {
    console.error('[Auth] Error validating message ownership:', error);
    return null;
  }
}
