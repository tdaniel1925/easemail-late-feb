import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { SyncOrchestrator } from '@/lib/graph/sync-orchestrator';

/**
 * POST /api/sync/account
 * Trigger full account sync (folders + messages)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Verify account exists and is active
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Cannot sync account.` },
        { status: 400 }
      );
    }

    // Update account sync status
    await supabase
      .from('connected_accounts')
      .update({
        status: 'syncing',
      })
      .eq('id', accountId);

    // Get Graph client for this account
    const graphClient = await createGraphClient(accountId);

    // Perform full sync
    const orchestrator = new SyncOrchestrator(graphClient, accountId);
    const result = await orchestrator.performFullSync();

    // Note: sync orchestrator already updates account status

    return NextResponse.json({
      success: result.overallStatus !== 'failed',
      result,
    });
  } catch (error: any) {
    console.error('Account sync error:', error);

    // Update account sync status to error
    try {
      const supabase = createAdminClient();
      const body = await request.json();
      const { accountId } = body;

      if (accountId) {
        await supabase
          .from('connected_accounts')
          .update({
            status: 'error',
            status_message: error.message,
          })
          .eq('id', accountId);
      }
    } catch (updateError) {
      console.error('Failed to update account sync status:', updateError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/account?accountId=xxx
 * Get account sync status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const accountId = request.nextUrl.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get account sync status
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('email, status, last_full_sync_at, status_message, initial_sync_complete, messages_synced')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get folder count
    const { count: folderCount } = await supabase
      .from('account_folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Get message statistics
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const { count: unreadMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_read', false);

    return NextResponse.json({
      account: {
        email: account.email,
        status: account.status,
        lastFullSyncAt: account.last_full_sync_at,
        statusMessage: account.status_message,
        initialSyncComplete: account.initial_sync_complete,
        messagesSynced: account.messages_synced,
      },
      stats: {
        folders: folderCount || 0,
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
      },
    });
  } catch (error: any) {
    console.error('Get account sync status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
