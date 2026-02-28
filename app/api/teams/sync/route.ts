import { NextRequest, NextResponse } from 'next/server';
import { createGraphClientWithToken } from '@/lib/graph/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { TeamsDeltaSyncService } from '@/lib/graph/teams-sync';
import { tokenService } from '@/lib/graph/token-service';

/**
 * POST /api/teams/sync
 * Trigger delta sync for Teams channels and messages from Microsoft Graph
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify account exists
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

    // Get access token from account_tokens table (auto-refreshes if needed)
    let accessToken: string;
    try {
      accessToken = await tokenService.getAccessToken(accountId);
    } catch (err: any) {
      console.error('[Teams Sync API] Failed to get access token:', err);
      return NextResponse.json(
        { error: 'Failed to get access token. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = createGraphClientWithToken(accessToken);

    // Create sync service
    const syncService = new TeamsDeltaSyncService(graphClient, accountId);

    // Perform sync
    console.log(`[Teams Sync API] Starting sync for account: ${account.email}`);
    const result = await syncService.syncTeams();

    // Log results
    console.log(
      `[Teams Sync API] Sync complete for ${account.email}:\n` +
      `  Teams: ${result.teams.created} created, ${result.teams.updated} updated, ${result.teams.deleted} deleted\n` +
      `  Channels: ${result.channels.created} created, ${result.channels.updated} updated, ${result.channels.deleted} deleted\n` +
      `  Messages: ${result.messages.created} created, ${result.messages.updated} updated, ${result.messages.deleted} deleted\n` +
      `  Total errors: ${result.totalErrors.length}`
    );

    if (result.totalErrors.length > 0) {
      console.error(`[Teams Sync API] Errors:`, result.totalErrors);
    }

    // Get sync stats
    const stats = await TeamsDeltaSyncService.getSyncStats(accountId);

    return NextResponse.json({
      success: true,
      result: {
        teams: {
          synced: result.teams.synced,
          created: result.teams.created,
          updated: result.teams.updated,
          deleted: result.teams.deleted,
        },
        channels: {
          synced: result.channels.synced,
          created: result.channels.created,
          updated: result.channels.updated,
          deleted: result.channels.deleted,
        },
        messages: {
          synced: result.messages.synced,
          created: result.messages.created,
          updated: result.messages.updated,
          deleted: result.messages.deleted,
        },
        errors: result.totalErrors,
      },
      stats: {
        totalChannels: stats.totalChannels,
        totalMessages: stats.totalMessages,
        unreadMessages: stats.unreadMessages,
        lastSyncAt: stats.lastSyncAt,
      },
    });
  } catch (error: any) {
    console.error('[Teams Sync API] Error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    );
  }
}
