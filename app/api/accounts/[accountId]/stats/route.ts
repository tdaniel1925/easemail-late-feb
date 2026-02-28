import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/accounts/[accountId]/stats
 * Get detailed statistics for a specific account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { accountId } = await params;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status, last_full_sync_at, created_at')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_deleted', false);

    // Get unread messages
    const { count: unreadMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_read', false)
      .eq('is_deleted', false);

    // Get flagged messages
    const { count: flaggedMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_flagged', true)
      .eq('is_deleted', false);

    // Get draft messages
    const { count: draftMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_draft', true)
      .eq('is_deleted', false);

    // Get messages with attachments
    const { count: messagesWithAttachments } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('has_attachments', true)
      .eq('is_deleted', false);

    // Get total folders
    const { count: totalFolders } = await supabase
      .from('account_folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Get total attachments size
    // First get message IDs for this account
    const { data: messageIds } = await supabase
      .from('messages')
      .select('id')
      .eq('account_id', accountId);

    const messageIdList = (messageIds || []).map((m) => m.id);

    const { data: attachmentsData } = await supabase
      .from('attachments')
      .select('size_bytes')
      .in('message_id', messageIdList);

    const totalStorageBytes = (attachmentsData || []).reduce(
      (sum, att) => sum + (att.size_bytes || 0),
      0
    );

    // Get message count by folder
    const { data: folderStats } = await supabase
      .from('account_folders')
      .select('id, display_name, folder_type, total_count, unread_count')
      .eq('account_id', accountId)
      .order('unread_count', { ascending: false })
      .limit(10);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .gte('received_at', thirtyDaysAgo.toISOString())
      .eq('is_deleted', false);

    // Get top senders (by message count)
    const { data: messages } = await supabase
      .from('messages')
      .select('from_address, from_name')
      .eq('account_id', accountId)
      .eq('is_deleted', false)
      .not('from_address', 'is', null)
      .limit(1000);

    const senderMap = new Map<string, { name: string | null; count: number }>();
    (messages || []).forEach((msg) => {
      const email = msg.from_address?.toLowerCase();
      if (email) {
        const existing = senderMap.get(email);
        if (existing) {
          existing.count++;
        } else {
          senderMap.set(email, { name: msg.from_name, count: 1 });
        }
      }
    });

    const topSenders = Array.from(senderMap.entries())
      .map(([email, data]) => ({
        email,
        name: data.name,
        messageCount: data.count,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    // Get sync state
    const { data: syncStates } = await supabase
      .from('sync_state')
      .select('resource_type, sync_status, last_sync_at, error_message')
      .eq('account_id', accountId);

    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        status: account.status,
        lastSyncAt: account.last_full_sync_at,
        createdAt: account.created_at,
      },
      stats: {
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        flaggedMessages: flaggedMessages || 0,
        draftMessages: draftMessages || 0,
        messagesWithAttachments: messagesWithAttachments || 0,
        totalFolders: totalFolders || 0,
        storageUsedBytes: totalStorageBytes,
        storageUsedMB: Math.round(totalStorageBytes / 1024 / 1024),
        recentMessagesLast30Days: recentMessages || 0,
      },
      folderStats: folderStats || [],
      topSenders: topSenders,
      syncStates: syncStates || [],
    });
  } catch (error: any) {
    console.error('Get account stats error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
