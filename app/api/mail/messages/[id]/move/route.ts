import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';

/**
 * POST /api/mail/messages/[id]/move
 * Move a message to a different folder
 *
 * Body:
 * {
 *   "targetFolderId": "uuid"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const messageId = params.id;
    const body = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    if (!body.targetFolderId) {
      return NextResponse.json(
        { error: 'targetFolderId is required' },
        { status: 400 }
      );
    }

    // Fetch the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, account_id, graph_id, folder_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify account exists and is active
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, status')
      .eq('id', message.account_id)
      .single();

    if (!account || account.status !== 'active') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 400 }
      );
    }

    // Verify target folder exists
    const { data: targetFolder, error: folderError } = await supabase
      .from('account_folders')
      .select('id, graph_id, display_name')
      .eq('id', body.targetFolderId)
      .eq('account_id', message.account_id)
      .single();

    if (folderError || !targetFolder) {
      return NextResponse.json(
        { error: 'Target folder not found' },
        { status: 404 }
      );
    }

    // Check if already in target folder
    if (message.folder_id === targetFolder.id) {
      return NextResponse.json({
        success: true,
        message: 'Message already in target folder',
      });
    }

    // Get Graph client
    const graphClient = await createGraphClient(message.account_id);

    // Move message via Graph API
    try {
      await graphClient
        .api(`/me/messages/${message.graph_id}/move`)
        .post({
          destinationId: targetFolder.graph_id,
        });
    } catch (graphError: any) {
      console.error('Graph API move error:', graphError);

      // Check for token expiry
      if (graphError.statusCode === 401) {
        return NextResponse.json(
          { error: 'Token expired', reauth: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Failed to move message: ${graphError.message}` },
        { status: 500 }
      );
    }

    // Update message folder in database
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        folder_id: targetFolder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Failed to update message folder in database:', updateError);
      // Don't fail the request - the move succeeded in Graph API
    }

    return NextResponse.json({
      success: true,
      message: 'Message moved successfully',
      targetFolder: {
        id: targetFolder.id,
        name: targetFolder.display_name,
      },
    });
  } catch (error: any) {
    console.error('Move message error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
