import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getGraphClient } from '@/lib/graph/client';

/**
 * POST /api/teams/messages/[id]/reactions
 * Add a reaction to a Teams message
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - emoji (required): Emoji/reaction type to add
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
    const { accountId, emoji } = body;

    if (!accountId || !emoji) {
      return NextResponse.json(
        { error: 'accountId and emoji are required' },
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

    // Get the message to find the channel and graph_id
    const { data: message, error: messageError } = await supabase
      .from('teams_messages')
      .select('id, graph_id, channel_id, account_id, reactions')
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

    // Add reaction via Graph API
    // Note: The Graph API endpoint for reactions is:
    // POST /teams/{teamId}/channels/{channelId}/messages/{messageId}/reactions
    const reactionPayload = {
      reactionType: emoji,
    };

    await graphClient
      .api(`/teams/${channel.graph_team_id}/channels/${channel.graph_channel_id}/messages/${message.graph_id}/reactions`)
      .post(reactionPayload);

    // Update local database with the new reaction
    // Add the current user to the reactions array
    const currentReactions = (message.reactions || []) as any[];

    // Find if this reaction type already exists
    const existingReactionIndex = currentReactions.findIndex(
      (r: any) => r.reactionType === emoji
    );

    let updatedReactions;
    if (existingReactionIndex >= 0) {
      // Add user to existing reaction type
      updatedReactions = [...currentReactions];
      const users = updatedReactions[existingReactionIndex].users || [];
      if (!users.some((u: any) => u.email === user.email)) {
        users.push({
          displayName: user.display_name || user.email,
          email: user.email,
        });
        updatedReactions[existingReactionIndex].users = users;
      }
    } else {
      // Add new reaction type
      updatedReactions = [
        ...currentReactions,
        {
          reactionType: emoji,
          users: [
            {
              displayName: user.display_name || user.email,
              email: user.email,
            },
          ],
        },
      ];
    }

    // Update the message in the database
    const { error: updateError } = await supabase
      .from('teams_messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message reactions:', updateError);
      // Don't fail the request - reaction was added successfully in Graph
    }

    return NextResponse.json({
      success: true,
      reactions: updatedReactions,
    });
  } catch (error: any) {
    console.error('Error in POST /api/teams/messages/[id]/reactions:', error);

    // Handle specific Graph API errors
    if (error.statusCode === 401 || error.code === 'InvalidAuthenticationToken') {
      return NextResponse.json(
        { error: 'Authentication failed. Please reconnect your account.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add reaction', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/messages/[id]/reactions
 * Remove a reaction from a Teams message
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - emoji (required): Emoji/reaction type to remove
 */
export async function DELETE(
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
    const { accountId, emoji } = body;

    if (!accountId || !emoji) {
      return NextResponse.json(
        { error: 'accountId and emoji are required' },
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

    // Get the message
    const { data: message, error: messageError } = await supabase
      .from('teams_messages')
      .select('id, graph_id, channel_id, account_id, reactions')
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

    // Remove reaction via Graph API
    await graphClient
      .api(`/teams/${channel.graph_team_id}/channels/${channel.graph_channel_id}/messages/${message.graph_id}/reactions/${emoji}`)
      .delete();

    // Update local database - remove user from the reaction
    const currentReactions = (message.reactions || []) as any[];
    const updatedReactions = currentReactions
      .map((r: any) => {
        if (r.reactionType === emoji) {
          const users = (r.users || []).filter(
            (u: any) => u.email !== user.email
          );
          return users.length > 0 ? { ...r, users } : null;
        }
        return r;
      })
      .filter((r: any) => r !== null);

    // Update the message in the database
    const { error: updateError } = await supabase
      .from('teams_messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message reactions:', updateError);
      // Don't fail the request - reaction was removed successfully in Graph
    }

    return NextResponse.json({
      success: true,
      reactions: updatedReactions,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/teams/messages/[id]/reactions:', error);

    if (error.statusCode === 401 || error.code === 'InvalidAuthenticationToken') {
      return NextResponse.json(
        { error: 'Authentication failed. Please reconnect your account.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to remove reaction', details: error.message },
      { status: 500 }
    );
  }
}
