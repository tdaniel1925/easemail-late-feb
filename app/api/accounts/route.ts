import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * GET /api/accounts
 * List all connected accounts for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // RLS will automatically filter by tenant_id
    const { data: accounts, error: accountsError } = await supabase
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
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: accountsError.message },
        { status: 500 }
      );
    }

    // Get statistics for all accounts in batched queries (fixes N+1 problem)
    const accountIds = (accounts || []).map((a) => a.id);

    // Batch 1: Get all message stats
    const { data: messageStats } = await supabase
      .from('messages')
      .select('account_id, is_read')
      .in('account_id', accountIds)
      .eq('is_deleted', false);

    // Batch 2: Get all folder counts
    const { data: folderStats } = await supabase
      .from('account_folders')
      .select('account_id')
      .in('account_id', accountIds);

    // Aggregate stats by account_id
    const statsByAccount = accountIds.reduce((acc, id) => {
      const accountMessages = (messageStats || []).filter((m) => m.account_id === id);
      const accountFolders = (folderStats || []).filter((f) => f.account_id === id);

      acc[id] = {
        messageCount: accountMessages.length,
        unreadCount: accountMessages.filter((m) => !m.is_read).length,
        folderCount: accountFolders.length,
      };
      return acc;
    }, {} as Record<string, { messageCount: number; unreadCount: number; folderCount: number }>);

    // Merge stats with accounts
    const accountsWithStats = (accounts || []).map((account) => ({
      ...account,
      messageCount: statsByAccount[account.id]?.messageCount || 0,
      unreadCount: statsByAccount[account.id]?.unreadCount || 0,
      folderCount: statsByAccount[account.id]?.folderCount || 0,
    }));

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
