import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getGraphClient } from '@/lib/graph/client';

/**
 * GET /api/teams/messages/[id]/replies
 * Get replies to a Teams message
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const messageId = (await params).id;
    const accountId = request.nextUrl.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Validate account belongs to user's tenant
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, tenant_id, status')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    // Get the parent message to find the channel and graph_id
    const { data: message, error: messageError } = await supabase
      .from('teams_messages')
      .select('id, graph_id, channel_id, account_id')
      .eq('id', messageId)
      .eq('account_id', accountId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Get channel info to make Graph API call
    const { data: channel, error: channelError } = await supabase
      .from('teams_channels')
      .select('graph_team_id, graph_channel_id')
      .eq('id', message.channel_id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Get Graph client
    const graphClient = await getGraphClient(accountId);

    // Fetch replies from Graph API
    const graphReplies = await graphClient
      .api(`/teams/${channel.graph_team_id}/channels/${channel.graph_channel_id}/messages/${message.graph_id}/replies`)
      .get();

    // Format replies
    const replies = (graphReplies.value || []).map((reply: any) => ({
      id: reply.id,
      body_text: reply.body?.content || null,
      from_name: reply.from?.user?.displayName || null,
      from_email: reply.from?.user?.email || null,
      created_at: reply.createdDateTime,
    }));

    return NextResponse.json({
      replies,
      total: replies.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/teams/messages/[id]/replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/messages/[id]/replies
 * Reply to a Teams message
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - content (required): Reply content (text)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const messageId = (await params).id;
    const body = await request.json();
    const { accountId, content } = body;

    if (!accountId || !content) {
      return NextResponse.json(
        { error: 'accountId and content are required' },
        { status: 400 }
      );
    }

    // Validate account belongs to user's tenant
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, tenant_id, status')
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

    // Get the parent message
    const { data: message, error: messageError } = await supabase
      .from('teams_messages')
      .select('id, graph_id, channel_id')
      .eq('id', messageId)
      .eq('account_id', accountId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Get channel info
    const { data: channel, error: channelError } = await supabase
      .from('teams_channels')
      .select('graph_team_id, graph_channel_id')
      .eq('id', message.channel_id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Get Graph client
    const graphClient = await getGraphClient(accountId);

    // Send reply via Graph API
    const replyPayload = {
      body: {
        content,
        contentType: 'text' as const,
      },
    };

    const graphReply = await graphClient
      .api(`/teams/${channel.graph_team_id}/channels/${channel.graph_channel_id}/messages/${message.graph_id}/replies`)
      .post(replyPayload);

    // Format reply response
    const reply = {
      id: graphReply.id,
      body_text: content,
      from_name: user.display_name || user.email,
      from_email: user.email,
      created_at: graphReply.createdDateTime || new Date().toISOString(),
    };

    return NextResponse.json({
      reply,
      success: true,
    });
  } catch (error: any) {
    console.error('Error in POST /api/teams/messages/[id]/replies:', error);
    return NextResponse.json(
      { error: 'Failed to send reply', details: error.message },
      { status: 500 }
    );
  }
}
