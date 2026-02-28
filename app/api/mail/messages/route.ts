import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * GET /api/mail/messages
 * List messages with pagination and filtering
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - folderId (optional): Filter by folder UUID (defaults to Inbox)
 * - fromEmail (optional): Filter by sender email address
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Validate that the account belongs to the current user and their tenant
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Unauthorized - account not found or does not belong to you' },
        { status: 403 }
      );
    }

    // Only block if account is in error or disconnected state
    // Allow viewing messages while syncing is in progress
    if (account.status === 'error' || account.status === 'disconnected') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
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
    const fromEmail = searchParams.get('fromEmail');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const flaggedOnly = searchParams.get('flaggedOnly') === 'true';
    const hasAttachments = searchParams.get('hasAttachments') === 'true';

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'received_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build query
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('is_deleted', false); // Don't show deleted messages

    // Apply folder filter (only if fromEmail is not specified)
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else if (!fromEmail) {
      // Default to Inbox folder if no folderId specified and not filtering by email
      // Try folder_type='inbox' first (prioritize by total_count to get the main inbox)
      const { data: inboxFolders } = await supabase
        .from('account_folders')
        .select('id, total_count')
        .eq('account_id', accountId)
        .eq('tenant_id', user.tenant_id)
        .eq('folder_type', 'inbox')
        .order('total_count', { ascending: false })
        .limit(1);

      if (inboxFolders && inboxFolders.length > 0) {
        query = query.eq('folder_id', inboxFolders[0].id);
      } else {
        // Fallback: match by display name if no folder_type='inbox' exists
        const { data: namedInbox } = await supabase
          .from('account_folders')
          .select('id')
          .eq('account_id', accountId)
          .eq('tenant_id', user.tenant_id)
          .eq('display_name', 'Inbox')
          .single();

        if (namedInbox) {
          query = query.eq('folder_id', namedInbox.id);
        }
      }
    }

    // Apply fromEmail filter
    if (fromEmail) {
      query = query.eq('from_address', fromEmail);
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
