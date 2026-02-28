import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getGraphClient } from '@/lib/graph/client';

/**
 * GET /api/teams/messages
 * List Teams messages for a specific channel
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - channelId (required): Channel UUID
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 * - sortBy (optional): Sort field (created_at, importance)
 * - sortOrder (optional): Sort direction (asc, desc - default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const accountId = searchParams.get('accountId');
    const channelId = searchParams.get('channelId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      );
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );
    const offset = (page - 1) * limit;

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'created_at';
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

    // Verify channel belongs to this account
    const { data: channel, error: channelError } = await supabase
      .from('teams_channels')
      .select('id, team_name, channel_name')
      .eq('id', channelId)
      .eq('account_id', accountId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('teams_messages')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('channel_id', channelId)
      .eq('is_deleted', false);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: messages, error, count } = await query;

    if (error) {
      console.error('Error fetching Teams messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      messages: messages || [],
      channel: {
        id: channel.id,
        teamName: channel.team_name,
        channelName: channel.channel_name,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/teams/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/messages
 * Send a new Teams message to a channel
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - channelId (required): Channel UUID
 * - content (required): Message content (text)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { accountId, channelId, content } = body;

    if (!accountId || !channelId || !content) {
      return NextResponse.json(
        { error: 'accountId, channelId, and content are required' },
        { status: 400 }
      );
    }

    // Validate account belongs to user's tenant
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status, tenant_id, graph_token_encrypted')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Verify channel belongs to this account
    const { data: channel, error: channelError } = await supabase
      .from('teams_channels')
      .select('id, graph_team_id, graph_channel_id')
      .eq('id', channelId)
      .eq('account_id', accountId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Get Graph client
    const graphClient = await getGraphClient(accountId);

    // Send message via Graph API
    const messagePayload = {
      body: {
        content,
        contentType: 'text' as const,
      },
    };

    const graphMessage = await graphClient
      .api(`/teams/${channel.graph_team_id}/channels/${channel.graph_channel_id}/messages`)
      .post(messagePayload);

    // Store message in database
    const { data: savedMessage, error: saveError } = await supabase
      .from('teams_messages')
      .insert({
        account_id: accountId,
        channel_id: channelId,
        graph_id: graphMessage.id,
        body_text: content,
        body_html: null,
        from_name: user.display_name || user.email,
        from_email: user.email,
        importance: 'normal',
        is_deleted: false,
        created_at: graphMessage.createdDateTime || new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving message to database:', saveError);
      // Don't fail the request - message was sent successfully
    }

    return NextResponse.json({
      message: savedMessage || {
        id: graphMessage.id,
        content,
        createdAt: graphMessage.createdDateTime,
      },
      success: true,
    });
  } catch (error: any) {
    console.error('Error in POST /api/teams/messages:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}
