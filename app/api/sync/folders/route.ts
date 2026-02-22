import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { FolderSyncService } from '@/lib/graph/folder-sync';

/**
 * POST /api/sync/folders
 * Trigger folder sync for a specific account
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
        { error: `Account is ${account.status}. Cannot sync folders.` },
        { status: 400 }
      );
    }

    // Update sync state to in_progress
    await supabase
      .from('sync_state')
      .upsert({
        account_id: accountId,
        resource_type: 'folders',
        sync_status: 'in_progress',
        last_sync_at: new Date().toISOString(),
      });

    // Get Graph client for this account
    const graphClient = await createGraphClient(accountId);

    // Perform folder sync
    const folderSync = new FolderSyncService(graphClient, accountId);
    const result = await folderSync.syncFolders();

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
      .eq('resource_type', 'folders');

    return NextResponse.json({
      success: true,
      accountEmail: account.email,
      result,
    });
  } catch (error: any) {
    console.error('Folder sync error:', error);

    // Update sync state to error
    try {
      const supabase = createAdminClient();
      const body = await request.json();
      const { accountId } = body;

      if (accountId) {
        await supabase
          .from('sync_state')
          .update({
            sync_status: 'error',
            error_message: error.message,
            last_sync_at: new Date().toISOString(),
          })
          .eq('account_id', accountId)
          .eq('resource_type', 'folders');
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
 * GET /api/sync/folders?accountId=xxx
 * Get folder sync status for an account
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

    // Get sync state
    const { data: syncState, error: syncError } = await supabase
      .from('sync_state')
      .select('*')
      .eq('account_id', accountId)
      .eq('resource_type', 'folders')
      .single();

    if (syncError && syncError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: syncError.message },
        { status: 500 }
      );
    }

    // Get folder counts
    const { count: folderCount, error: countError } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      syncState: syncState || null,
      folderCount: folderCount || 0,
    });
  } catch (error: any) {
    console.error('Get folder sync status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
