import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClient } from '@/lib/graph/client';
import { AttachmentSyncService } from '@/lib/graph/attachment-sync';

/**
 * GET /api/attachments?messageId=xxx
 * Get attachments for a message
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const messageId = request.nextUrl.searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    // RLS will automatically filter by tenant_id through the message relation
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error('Get attachments error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attachments
 * Sync attachments for a message
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const body = await request.json();
    const { messageGraphId, accountId, downloadContent } = body;

    if (!messageGraphId || !accountId) {
      return NextResponse.json(
        { error: 'messageGraphId and accountId are required' },
        { status: 400 }
      );
    }

    // Verify account belongs to user's tenant (RLS check)
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get Graph client for this account
    const graphClient = await createGraphClient(accountId);

    // Sync attachments
    const attachmentSync = new AttachmentSyncService(graphClient, accountId);
    const result = await attachmentSync.syncMessageAttachments(
      messageGraphId,
      downloadContent || false
    );

    return NextResponse.json({
      success: result.errors.length === 0,
      result,
    });
  } catch (error: any) {
    console.error('Attachment sync error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
