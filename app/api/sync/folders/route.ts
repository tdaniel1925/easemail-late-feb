import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClient } from '@/lib/graph/client';
import { FolderSyncService } from '@/lib/graph/folder-sync';

/**
 * POST /api/sync/folders
 * Trigger folder sync for a specific account
 */
export async function POST(request: NextRequest) {
  let accountId: string | undefined;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const body = await request.json();
    accountId = body.accountId;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Verify account exists and is active (RLS: tenant-scoped)
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
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

    // Update sync state to error (using accountId from outer scope)
    if (accountId) {
      try {
        const supabase = await createClient();
        await supabase
          .from('sync_state')
          .update({
            sync_status: 'error',
            error_message: error.message,
            last_sync_at: new Date().toISOString(),
          })
          .eq('account_id', accountId)
          .eq('resource_type', 'folders');
      } catch (updateError) {
        console.error('Failed to update sync state:', updateError);
      }
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const accountId = request.nextUrl.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Verify account belongs to user's tenant (RLS check)
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
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
