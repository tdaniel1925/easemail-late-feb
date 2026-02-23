import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/accounts
 * List all connected accounts for the current user
 *
 * Query Parameters:
 * - userId (optional): Filter by specific user ID
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const userId = request.nextUrl.searchParams.get('userId');

    let query = supabase
      .from('connected_accounts')
      .select(`
        id,
        email,
        display_name,
        avatar_url,
        account_type,
        status,
        status_message,
        last_error_at,
        error_count,
        last_full_sync_at,
        initial_sync_complete,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: accounts, error: accountsError } = await query;

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: accountsError.message },
        { status: 500 }
      );
    }

    // Get statistics for each account
    const accountsWithStats = await Promise.all(
      (accounts || []).map(async (account) => {
        // Get message count
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', account.id)
          .eq('is_deleted', false);

        // Get unread message count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', account.id)
          .eq('is_read', false)
          .eq('is_deleted', false);

        // Get folder count
        const { count: folderCount } = await supabase
          .from('account_folders')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', account.id);

        return {
          ...account,
          messageCount: messageCount || 0,
          unreadCount: unreadCount || 0,
          folderCount: folderCount || 0,
        };
      })
    );

    return NextResponse.json({
      accounts: accountsWithStats,
      count: accountsWithStats.length,
    });
  } catch (error: any) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
