import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';

interface SendEmailRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType?: 'html' | 'text';
  importance?: 'low' | 'normal' | 'high';
  replyTo?: string; // message-graph-id to reply to
  forwardOf?: string; // message-graph-id to forward
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBytes: string; // base64
  }>;
}

/**
 * POST /api/mail/send
 * Compose and send an email via Microsoft Graph
 *
 * Body: SendEmailRequest
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body: SendEmailRequest = await request.json();

    // Validate required fields
    if (!body.accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    if (!body.to || body.to.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    if (!body.subject && !body.replyTo && !body.forwardOf) {
      return NextResponse.json(
        { error: 'Subject is required for new messages' },
        { status: 400 }
      );
    }

    // Verify account exists and is active
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', body.accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Get Graph client for this account
    const graphClient = await createGraphClient(body.accountId);

    // Build the message
    const message: any = {
      subject: body.subject || '',
      body: {
        contentType: body.bodyType === 'text' ? 'text' : 'html',
        content: body.body || '',
      },
      toRecipients: body.to.map((email) => ({
        emailAddress: { address: email },
      })),
      importance: body.importance || 'normal',
    };

    // Add CC recipients
    if (body.cc && body.cc.length > 0) {
      message.ccRecipients = body.cc.map((email) => ({
        emailAddress: { address: email },
      }));
    }

    // Add BCC recipients
    if (body.bcc && body.bcc.length > 0) {
      message.bccRecipients = body.bcc.map((email) => ({
        emailAddress: { address: email },
      }));
    }

    // Handle reply
    if (body.replyTo) {
      // Get the original message
      const { data: originalMessage } = await supabase
        .from('messages')
        .select('internet_message_id, subject')
        .eq('graph_id', body.replyTo)
        .single();

      if (originalMessage?.internet_message_id) {
        message.internetMessageId = originalMessage.internet_message_id;
      }

      // Prefix subject with "Re: " if not already present
      if (originalMessage?.subject && !message.subject.startsWith('Re:')) {
        message.subject = `Re: ${originalMessage.subject}`;
      }
    }

    // Handle forward
    if (body.forwardOf) {
      const { data: originalMessage } = await supabase
        .from('messages')
        .select('subject')
        .eq('graph_id', body.forwardOf)
        .single();

      // Prefix subject with "Fwd: " if not already present
      if (originalMessage?.subject && !message.subject.startsWith('Fwd:')) {
        message.subject = `Fwd: ${originalMessage.subject}`;
      }
    }

    // Add attachments
    if (body.attachments && body.attachments.length > 0) {
      message.attachments = body.attachments.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
      }));
    }

    // Send the message via Graph API
    let sentMessage;
    try {
      if (body.replyTo) {
        // Use reply endpoint
        sentMessage = await graphClient
          .api(`/me/messages/${body.replyTo}/reply`)
          .post({
            message,
          });
      } else {
        // Use sendMail endpoint for new messages
        await graphClient
          .api('/me/sendMail')
          .post({
            message,
            saveToSentItems: true,
          });

        // Note: sendMail doesn't return the sent message
        // We'll create a local record
        sentMessage = message;
      }
    } catch (graphError: any) {
      console.error('Graph API send error:', graphError);

      // Check for token expiry
      if (graphError.statusCode === 401) {
        return NextResponse.json(
          { error: 'Token expired', reauth: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Failed to send email: ${graphError.message}` },
        { status: 500 }
      );
    }

    // Store the sent message in database
    // Note: We'll rely on sync to get the full details later
    // For now, create a minimal record
    try {
      // Get Sent Items folder
      const { data: sentFolder } = await supabase
        .from('account_folders')
        .select('id')
        .eq('account_id', body.accountId)
        .or('folder_type.eq.sentitems,display_name.eq.Sent Items')
        .single();

      if (sentFolder) {
        // Create a local record (will be updated by sync)
        await supabase.from('messages').insert({
          account_id: body.accountId,
          folder_id: sentFolder.id,
          graph_id: `temp-${Date.now()}`, // Temporary ID until sync
          subject: message.subject,
          from_address: account.email,
          from_name: account.email,
          to_recipients: body.to.map((email) => ({ address: email })),
          cc_recipients: body.cc?.map((email) => ({ address: email })) || [],
          bcc_recipients: body.bcc?.map((email) => ({ address: email })) || [],
          body_html: body.bodyType !== 'text' ? body.body : null,
          body_text: body.bodyType === 'text' ? body.body : null,
          body_content_type: body.bodyType || 'html',
          is_read: true,
          is_draft: false,
          importance: body.importance || 'normal',
          has_attachments: (body.attachments?.length || 0) > 0,
          attachment_count: body.attachments?.length || 0,
          sent_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
        });
      }
    } catch (dbError: any) {
      // Log but don't fail the request
      console.error('Failed to store sent message locally:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      sentMessage: {
        subject: message.subject,
        to: body.to,
        cc: body.cc || [],
        bcc: body.bcc || [],
      },
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
