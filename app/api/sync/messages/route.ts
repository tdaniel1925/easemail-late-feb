import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { MessageDeltaSyncService } from '@/lib/graph/message-delta-sync';

/**
 * POST /api/sync/messages
 * Trigger message delta sync for a specific account and optional folder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { accountId, folderId } = body;

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
        { error: `Account is ${account.status}. Cannot sync messages.` },
        { status: 400 }
      );
    }

    // Update sync state to in_progress
    const resourceType = folderId ? `messages:${folderId}` : 'messages';
    await supabase
      .from('sync_state')
      .upsert({
        account_id: accountId,
        resource_type: resourceType,
        sync_status: 'in_progress',
        last_sync_at: new Date().toISOString(),
      });

    // Get Graph client for this account
    const graphClient = await createGraphClient(accountId);

    // Perform message delta sync
    const messageSync = new MessageDeltaSyncService(graphClient, accountId, folderId);
    const result = await messageSync.syncMessages();

    // Update sync state based on result
    const syncStatus = result.errors.length > 0 ? 'error' : 'completed';
    await supabase
      .from('sync_state')
      .update({
        sync_status: syncStatus,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
        last_sync_at: new Date().toISOString(),
      })
      .eq('account_id', accountId)
      .eq('resource_type', resourceType);

    return NextResponse.json({
      success: true,
      accountEmail: account.email,
      folderId: folderId || 'all',
      result,
    });
  } catch (error: any) {
    console.error('Message delta sync error:', error);

    // Update sync state to error
    try {
      const supabase = createAdminClient();
      const body = await request.json();
      const { accountId, folderId } = body;

      if (accountId) {
        const resourceType = folderId ? `messages:${folderId}` : 'messages';
        await supabase
          .from('sync_state')
          .update({
            sync_status: 'error',
            error_message: error.message,
            last_sync_at: new Date().toISOString(),
          })
          .eq('account_id', accountId)
          .eq('resource_type', resourceType);
      }
    } catch (updateError) {
      console.error('Failed to update sync state:', updateError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/messages?accountId=xxx&folderId=xxx
 * Get message sync status and statistics for an account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const accountId = request.nextUrl.searchParams.get('accountId');
    const folderId = request.nextUrl.searchParams.get('folderId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get sync state
    const resourceType = folderId ? `messages:${folderId}` : 'messages';
    const { data: syncState, error: syncError } = await supabase
      .from('sync_state')
      .select('*')
      .eq('account_id', accountId)
      .eq('resource_type', resourceType)
      .single();

    if (syncError && syncError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: syncError.message },
        { status: 500 }
      );
    }

    // Get message statistics
    const stats = await MessageDeltaSyncService.getSyncStats(accountId);

    return NextResponse.json({
      syncState: syncState || null,
      stats,
    });
  } catch (error: any) {
    console.error('Get message sync status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
