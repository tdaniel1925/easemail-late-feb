import { NextRequest, NextResponse } from 'next/server';
import { createGraphClientWithToken } from '@/lib/graph/client';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { ContactsDeltaSyncService } from '@/lib/graph/contacts-sync';
import { tokenService } from '@/lib/graph/token-service';

/**
 * POST /api/contacts/sync
 * Trigger delta sync for contacts from Microsoft Graph
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status, tenant_id')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get access token from account_tokens table (auto-refreshes if needed)
    let accessToken: string;
    try {
      accessToken = await tokenService.getAccessToken(accountId);
    } catch (err: any) {
      console.error('[Contacts Sync API] Failed to get access token:', err);
      return NextResponse.json(
        { error: 'Failed to get access token. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = createGraphClientWithToken(accessToken);

    // Create sync service
    const syncService = new ContactsDeltaSyncService(graphClient, accountId);

    // Perform sync
    console.log(`[Contacts Sync API] Starting sync for account: ${account.email}`);
    const result = await syncService.syncContacts();

    // Log results
    console.log(
      `[Contacts Sync API] Sync complete for ${account.email}: ` +
      `${result.created} created, ${result.updated} updated, ${result.deleted} deleted, ` +
      `${result.errors.length} errors`
    );

    if (result.errors.length > 0) {
      console.error(`[Contacts Sync API] Errors:`, result.errors);
    }

    // Get sync stats
    const stats = await ContactsDeltaSyncService.getSyncStats(accountId);

    return NextResponse.json({
      success: true,
      result: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        errors: result.errors,
      },
      stats: {
        totalContacts: stats.totalContacts,
        favoriteContacts: stats.favoriteContacts,
        lastSyncAt: stats.lastSyncAt,
      },
    });
  } catch (error: any) {
    console.error('[Contacts Sync API] Error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    );
  }
}
