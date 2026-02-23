import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/mail/messages
 * List messages with pagination and filtering
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - folderId (optional): Filter by folder UUID (defaults to Inbox)
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 * - unreadOnly (optional): Filter to unread messages only
 * - flaggedOnly (optional): Filter to flagged messages only
 * - hasAttachments (optional): Filter to messages with attachments
 * - sortBy (optional): Sort field (received_at, from_address, subject)
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

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );
    const offset = (page - 1) * limit;

    // Filter parameters
    const folderId = searchParams.get('folderId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const flaggedOnly = searchParams.get('flaggedOnly') === 'true';
    const hasAttachments = searchParams.get('hasAttachments') === 'true';

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'received_at';
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

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('is_deleted', false); // Don't show deleted messages

    // Apply folder filter
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      // Default to Inbox folder if no folderId specified
      // Try folder_type first, then fall back to display_name
      let inboxFolder = await supabase
        .from('account_folders')
        .select('id')
        .eq('account_id', accountId)
        .eq('folder_type', 'inbox')
        .single();

      if (!inboxFolder.data) {
        // Fallback: match by display name
        inboxFolder = await supabase
          .from('account_folders')
          .select('id')
          .eq('account_id', accountId)
          .eq('display_name', 'Inbox')
          .single();
      }

      if (inboxFolder.data) {
        query = query.eq('folder_id', inboxFolder.data.id);
      }
    }

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (flaggedOnly) {
      query = query.eq('is_flagged', true);
    }

    if (hasAttachments) {
      query = query.eq('has_attachments', true);
    }

    // Apply sorting
    const validSortFields = ['received_at', 'from_address', 'subject', 'sent_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'received_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: messages, error: messagesError, count } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('List messages error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
