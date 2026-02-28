import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/teams/channels
 * List Teams channels with filtering
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - teamId (optional): Filter by specific team (graph_team_id)
 * - isFavorite (optional): Filter to favorite channels only
 * - sortBy (optional): Sort field (channel_name, last_activity_at, unread_count)
 * - sortOrder (optional): Sort direction (asc, desc - default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Filter parameters
    const teamId = searchParams.get('teamId');
    const isFavorite = searchParams.get('isFavorite');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'last_activity_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate account exists and is active
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

    if (account.status === 'error' || account.status === 'disconnected') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('teams_channels')
      .select('*')
      .eq('account_id', accountId);

    // Apply team filter
    if (teamId) {
      query = query.eq('graph_team_id', teamId);
    }

    // Apply favorite filter
    if (isFavorite === 'true') {
      query = query.eq('is_favorite', true);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Execute query
    const { data: channels, error } = await query;

    if (error) {
      console.error('Error fetching Teams channels:', error);
      return NextResponse.json(
        { error: 'Failed to fetch channels', details: error.message },
        { status: 500 }
      );
    }

    // Group channels by team
    const groupedChannels: { [teamId: string]: { teamName: string; channels: any[] } } = {};

    for (const channel of channels || []) {
      if (!groupedChannels[channel.graph_team_id]) {
        groupedChannels[channel.graph_team_id] = {
          teamName: channel.team_name,
          channels: [],
        };
      }
      groupedChannels[channel.graph_team_id].channels.push(channel);
    }

    return NextResponse.json({
      channels: channels || [],
      groupedChannels,
      count: channels?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in GET /api/teams/channels:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
