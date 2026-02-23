import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Helper function to parse recipient data from database
 * Handles JSON strings, arrays, and validates structure
 */
function parseRecipients(recipients: any): any[] {
  if (!recipients) return [];

  try {
    let parsed = recipients;

    // Handle JSON strings
    if (typeof recipients === 'string') {
      parsed = JSON.parse(recipients);
    }

    // Ensure we have an array
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (e) {
    console.error('Error parsing recipients:', e);
    return [];
  }
}

/**
 * GET /api/mail/messages/[id]
 * Get a single message with full details
 *
 * Returns:
 * - Full message details
 * - Body (HTML + text)
 * - Attachments list
 * - Recipients (to, cc, bcc, reply_to)
 * - Thread information (conversation_id, internet_message_id)
 * - AI analysis if available
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: messageId } = await params;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Fetch the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
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
      .select('id, email, status')
      .eq('id', message.account_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Associated account not found' },
        { status: 404 }
      );
    }

    // Fetch attachments
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('name');

    // Fetch folder information
    const { data: folder } = await supabase
      .from('account_folders')
      .select('id, display_name, folder_type')
      .eq('id', message.folder_id)
      .single();

    // Build the response
    const response = {
      id: message.id,
      account_id: message.account_id,
      folder_id: message.folder_id,
      folder: folder || null,

      // Message identifiers
      graph_id: message.graph_id,
      internet_message_id: message.internet_message_id,
      conversation_id: message.conversation_id,
      conversation_index: message.conversation_index,

      // Basic info
      subject: message.subject,
      preview: message.preview,

      // Sender
      from: {
        name: message.from_name,
        address: message.from_address,
      },

      // Recipients
      to: parseRecipients(message.to_recipients),
      cc: parseRecipients(message.cc_recipients),
      bcc: parseRecipients(message.bcc_recipients),
      reply_to: parseRecipients(message.reply_to),

      // Body
      body: {
        html: message.body_html,
        text: message.body_text,
        content_type: message.body_content_type,
      },

      // Flags
      is_read: message.is_read,
      is_flagged: message.is_flagged,
      is_draft: message.is_draft,
      is_deleted: message.is_deleted,
      importance: message.importance,
      categories: message.categories || [],

      // Attachments
      has_attachments: message.has_attachments,
      attachment_count: message.attachment_count,
      attachments: attachments || [],

      // Dates
      received_at: message.received_at,
      sent_at: message.sent_at,
      created_at: message.created_at,
      updated_at: message.updated_at,

      // AI analysis
      ai: {
        summary: message.ai_summary,
        priority_score: message.ai_priority_score,
        category: message.ai_category,
        sentiment: message.ai_sentiment,
        processed_at: message.ai_processed_at,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get message error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mail/messages/[id]
 * Update message flags (read, flagged)
 *
 * Body:
 * {
 *   "isRead": true,
 *   "isFlagged": false
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: messageId } = await params;
    const body = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Fetch the message to get account_id
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, account_id, graph_id')
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

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.isRead === 'boolean') {
      updates.is_read = body.isRead;
    }

    if (typeof body.isFlagged === 'boolean') {
      updates.is_flagged = body.isFlagged;
    }

    if (typeof body.importance === 'string') {
      updates.importance = body.importance;
    }

    // Update in database
    const { data: updated, error: updateError } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updated,
    });
  } catch (error: any) {
    console.error('Update message error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mail/messages/[id]
 * Delete a message (soft delete - move to trash)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: messageId } = await params;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
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

    // Soft delete: mark as deleted
    const { error: deleteError } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
