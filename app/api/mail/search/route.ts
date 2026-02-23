import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/mail/search
 * Search messages with full-text search and filters
 *
 * Query Parameters:
 * - q (required): Search query
 * - accountId (required): Connected account UUID
 * - folderId (optional): Search within specific folder
 * - from (optional): Filter by sender email/name
 * - hasAttachments (optional): Filter by attachment presence
 * - startDate (optional): Filter by date range start
 * - endDate (optional): Filter by date range end
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const query = searchParams.get('q');
    const accountId = searchParams.get('accountId');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query (q) is required' },
        { status: 400 }
      );
    }

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
    const from = searchParams.get('from');
    const hasAttachments = searchParams.get('hasAttachments') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify account exists and is active
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

    // Build full-text search query using PostgreSQL tsvector
    // Search across subject, preview, body_text, from_name, and from_address
    let searchQuery = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('is_deleted', false);

    // Apply full-text search
    // Use ilike for simple substring matching (more compatible)
    // TODO: Migrate to proper ts_vector search after adding search index
    const searchTerm = `%${query}%`;
    searchQuery = searchQuery.or(
      `subject.ilike.${searchTerm},preview.ilike.${searchTerm},body_text.ilike.${searchTerm},from_name.ilike.${searchTerm},from_address.ilike.${searchTerm}`
    );

    // Apply folder filter
    if (folderId) {
      searchQuery = searchQuery.eq('folder_id', folderId);
    }

    // Apply sender filter
    if (from) {
      const fromTerm = `%${from}%`;
      searchQuery = searchQuery.or(
        `from_name.ilike.${fromTerm},from_address.ilike.${fromTerm}`
      );
    }

    // Apply attachment filter
    if (hasAttachments) {
      searchQuery = searchQuery.eq('has_attachments', true);
    }

    // Apply date range filters
    if (startDate) {
      searchQuery = searchQuery.gte('received_at', startDate);
    }

    if (endDate) {
      searchQuery = searchQuery.lte('received_at', endDate);
    }

    // Sort by relevance (most recent first)
    searchQuery = searchQuery.order('received_at', { ascending: false });

    // Apply pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data: messages, error: messagesError, count } = await searchQuery;

    if (messagesError) {
      console.error('Error searching messages:', messagesError);
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      query,
      results: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
      filters: {
        folderId: folderId || null,
        from: from || null,
        hasAttachments: hasAttachments || false,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error: any) {
    console.error('Search messages error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
