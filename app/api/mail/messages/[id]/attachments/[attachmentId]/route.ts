import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClientWithToken } from '@/lib/graph/client';

/**
 * GET /api/mail/messages/[id]/attachments/[attachmentId]
 * Download/fetch attachment content
 *
 * Returns attachment as blob with proper content-type header
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: messageId, attachmentId } = await params;

    if (!messageId || !attachmentId) {
      return NextResponse.json(
        { error: 'Message ID and Attachment ID are required' },
        { status: 400 }
      );
    }

    // Fetch the attachment from database
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .select('*, messages!inner(account_id, graph_id)')
      .eq('id', attachmentId)
      .eq('message_id', messageId)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Type assertion for the join
    const attachmentWithMessage = attachment as any;
    const message = attachmentWithMessage.messages;

    // Check if content is cached in storage_path
    if (attachment.is_cached && attachment.storage_path) {
      try {
        // Assume storage_path contains base64 encoded content
        const buffer = Buffer.from(attachment.storage_path, 'base64');

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': attachment.content_type || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${attachment.name}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (decodeError) {
        console.error('Error decoding cached attachment:', decodeError);
        // Fall through to fetch from Graph API
      }
    }

    // Fetch from Microsoft Graph API
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, access_token, refresh_token, token_expires_at')
      .eq('id', message.account_id)
      .single();

    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: 'Account not found or not authenticated' },
        { status: 401 }
      );
    }

    // Initialize Graph client
    const client = createGraphClientWithToken(account.access_token);

    // Fetch attachment content from Graph API
    const graphAttachment = await client
      .api(`/me/messages/${message.graph_id}/attachments/${attachment.graph_id}`)
      .get();

    if (!graphAttachment.contentBytes) {
      return NextResponse.json(
        { error: 'Attachment content not available' },
        { status: 404 }
      );
    }

    // Decode base64 content
    const buffer = Buffer.from(graphAttachment.contentBytes, 'base64');

    // Optionally cache small attachments (< 1MB, typically inline images)
    if (attachment.is_inline && attachment.size_bytes && attachment.size_bytes < 1024 * 1024) {
      try {
        await supabase
          .from('attachments')
          .update({
            storage_path: graphAttachment.contentBytes, // Store base64
            is_cached: true,
          })
          .eq('id', attachmentId);
      } catch (cacheError) {
        console.error('Failed to cache attachment:', cacheError);
        // Continue anyway - caching is optional
      }
    }

    // Return the attachment
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.content_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${attachment.name}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error: any) {
    console.error('Fetch attachment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}
