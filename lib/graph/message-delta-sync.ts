import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';

interface DeltaSyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  deltaToken?: string;
  errors: string[];
}

interface GraphMessage {
  id: string;
  conversationId?: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: {
    contentType: string;
    content: string;
  };
  from?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  replyTo?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  sentDateTime?: string;
  receivedDateTime?: string;
  hasAttachments: boolean;
  importance?: string;
  isRead: boolean;
  isDraft: boolean;
  flag?: {
    flagStatus: string;
  };
  parentFolderId?: string;
  conversationIndex?: string;
  isDeliveryReceiptRequested?: boolean;
  isReadReceiptRequested?: boolean;
  '@removed'?: {
    reason: string;
  };
}

export class MessageDeltaSyncService {
  private folderMap: Map<string, string> | null = null; // Cache for graph_id -> uuid mapping

  constructor(
    private graphClient: Client,
    private accountId: string,
    private folderId?: string // Optional: sync specific folder, or all folders if not provided
  ) {}

  /**
   * Pre-load folder map to avoid N+1 queries
   * Loads all folders once at start of sync instead of querying for each message
   */
  private async loadFolderMap(): Promise<void> {
    if (this.folderMap) return; // Already loaded

    const supabase = createAdminClient();
    const { data: folders } = await supabase
      .from('account_folders')
      .select('id, graph_id')
      .eq('account_id', this.accountId);

    this.folderMap = new Map((folders || []).map(f => [f.graph_id, f.id]));
    console.log(`[Delta Sync] Pre-loaded ${this.folderMap.size} folders into memory`);
  }

  /**
   * Perform delta sync for messages
   * Uses delta tokens to only fetch changes since last sync
   */
  async syncMessages(): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // PRE-LOAD FOLDER MAP (FIX N+1 QUERY PROBLEM)
      await this.loadFolderMap();

      // Get current delta token for this account/folder
      const resourceType = this.folderId ? `messages:${this.folderId}` : 'messages';
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('delta_token')
        .eq('account_id', this.accountId)
        .eq('resource_type', resourceType)
        .single();

      const deltaToken = syncState?.delta_token;

      // Build delta query URL
      let deltaUrl = this.folderId
        ? `/me/mailFolders/${this.folderId}/messages/delta`
        : `/me/messages/delta`;

      // Add $select to include full body content and $top for pagination (max 999 per request)
      deltaUrl += '?$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,replyTo,sentDateTime,receivedDateTime,hasAttachments,importance,isRead,isDraft,flag,parentFolderId,internetMessageId,conversationIndex&$top=999';

      // If we have a delta token, use it for incremental sync
      if (deltaToken) {
        deltaUrl = deltaToken; // Delta token contains full URL
        console.log(`Using delta token for incremental sync (${resourceType})`);
      } else {
        console.log(`Starting initial sync for ${resourceType}`);
      }

      // Fetch messages using delta query
      let hasMore = true;
      let nextLink = deltaUrl;
      let newDeltaToken: string | undefined;

      while (hasMore) {
        try {
          // Graph API call with rate limit handling
          const response = await this.graphApiCallWithRetry(nextLink);

          const messages: GraphMessage[] = response.value || [];
          console.log(`[Delta Sync] Fetched ${messages.length} messages from Graph API`);

          // Process messages in batches for better performance
          const BATCH_SIZE = 100;
          for (let i = 0; i < messages.length; i += BATCH_SIZE) {
            const batch = messages.slice(i, i + BATCH_SIZE);
            const batchResult = await this.processBatch(batch);

            result.created += batchResult.created;
            result.updated += batchResult.updated;
            result.deleted += batchResult.deleted;
            result.synced += batchResult.synced;
            result.errors.push(...batchResult.errors);
          }

          // Check for next page or delta link
          if (response['@odata.nextLink']) {
            nextLink = response['@odata.nextLink'];
          } else if (response['@odata.deltaLink']) {
            newDeltaToken = response['@odata.deltaLink'];
            hasMore = false;
          } else {
            hasMore = false;
          }
        } catch (error: any) {
          result.errors.push(`Delta query failed: ${error.message}`);
          hasMore = false;
        }
      }

      // Store new delta token for next sync
      if (newDeltaToken) {
        await supabase
          .from('sync_state')
          .upsert({
            account_id: this.accountId,
            resource_type: resourceType,
            delta_token: newDeltaToken,
            last_sync_at: new Date().toISOString(),
            sync_status: 'completed',
          });

        result.deltaToken = newDeltaToken;
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Message delta sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Process a batch of messages efficiently
   * Uses batch existence checks and bulk inserts/updates
   */
  private async processBatch(messages: GraphMessage[]): Promise<{
    created: number;
    updated: number;
    deleted: number;
    synced: number;
    errors: string[];
  }> {
    const result = { created: 0, updated: 0, deleted: 0, synced: 0, errors: [] as string[] };
    const supabase = createAdminClient();

    // Separate deletions from upserts
    const deletions = messages.filter(m => m['@removed']);
    const upserts = messages.filter(m => !m['@removed']);

    // Handle deletions
    if (deletions.length > 0) {
      const deletionIds = deletions.map(m => m.id);
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('account_id', this.accountId)
        .in('graph_id', deletionIds);

      if (error) {
        result.errors.push(`Bulk delete failed: ${error.message}`);
      } else {
        result.deleted = deletions.length;
        result.synced += deletions.length;
        console.log(`[Delta Sync] ✓ Deleted ${deletions.length} messages`);
      }
    }

    if (upserts.length === 0) return result;

    // BATCH EXISTENCE CHECK (instead of N queries)
    const graphIds = upserts.map(m => m.id);
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('graph_id, id')
      .eq('account_id', this.accountId)
      .in('graph_id', graphIds);

    const existingMap = new Map((existingMessages || []).map(m => [m.graph_id, m.id]));

    // Prepare inserts and updates
    const inserts = [];
    const updates = [];

    for (const message of upserts) {
      try {
        const messageData = this.prepareMessageData(message);
        const existingId = existingMap.get(message.id);

        if (existingId) {
          updates.push({ ...messageData, id: existingId, updated_at: new Date().toISOString() });
        } else {
          inserts.push(messageData);
        }
      } catch (error: any) {
        result.errors.push(`Failed to prepare message ${message.id}: ${error.message}`);
      }
    }

    // BULK INSERT
    if (inserts.length > 0) {
      const { error } = await supabase.from('messages').insert(inserts);
      if (error) {
        result.errors.push(`Bulk insert failed: ${error.message}`);
      } else {
        result.created = inserts.length;
        result.synced += inserts.length;
        console.log(`[Delta Sync] ✓ Inserted ${inserts.length} messages`);
      }
    }

    // BULK UPDATE (using upsert)
    if (updates.length > 0) {
      const { error } = await supabase.from('messages').upsert(updates);
      if (error) {
        result.errors.push(`Bulk update failed: ${error.message}`);
      } else {
        result.updated = updates.length;
        result.synced += updates.length;
        console.log(`[Delta Sync] ↻ Updated ${updates.length} messages`);
      }
    }

    return result;
  }

  /**
   * Prepare message data for database insert/update
   * Uses pre-loaded folder map instead of querying database
   */
  private prepareMessageData(message: GraphMessage): any {
    // Look up folder ID from pre-loaded map (NO DATABASE QUERY!)
    let folderUuid: string | null = null;
    if (message.parentFolderId && this.folderMap) {
      folderUuid = this.folderMap.get(message.parentFolderId) || null;
    }

    // Fallback to constructor folderId if needed
    if (!folderUuid && this.folderId && this.folderMap) {
      folderUuid = this.folderMap.get(this.folderId) || null;
    }

    if (!folderUuid) {
      throw new Error(`Folder not found for graph_id: ${message.parentFolderId || this.folderId || 'unknown'}`);
    }

    return {
      account_id: this.accountId,
      graph_id: message.id,
      conversation_id: message.conversationId,
      internet_message_id: message.internetMessageId,
      conversation_index: message.conversationIndex ? Buffer.from(message.conversationIndex, 'base64') : null,
      subject: message.subject || '(No Subject)',
      preview: message.bodyPreview,
      body_html: message.body?.contentType === 'html' ? message.body.content : null,
      body_text: message.body?.contentType === 'text' ? message.body.content : message.bodyPreview,
      body_content_type: message.body?.contentType || 'text',
      from_name: message.from?.emailAddress?.name,
      from_address: message.from?.emailAddress?.address,
      to_recipients: message.toRecipients?.map((r) => ({
        name: r.emailAddress.name,
        address: r.emailAddress.address,
      })),
      cc_recipients: message.ccRecipients?.map((r) => ({
        name: r.emailAddress.name,
        address: r.emailAddress.address,
      })),
      bcc_recipients: message.bccRecipients?.map((r) => ({
        name: r.emailAddress.name,
        address: r.emailAddress.address,
      })),
      reply_to: message.replyTo?.map((r) => ({
        name: r.emailAddress.name,
        address: r.emailAddress.address,
      })),
      sent_at: message.sentDateTime ? new Date(message.sentDateTime).toISOString() : null,
      received_at: message.receivedDateTime ? new Date(message.receivedDateTime).toISOString() : null,
      has_attachments: message.hasAttachments,
      importance: message.importance || 'normal',
      is_read: message.isRead,
      is_draft: message.isDraft,
      is_flagged: message.flag?.flagStatus === 'flagged',
      folder_id: folderUuid,
    };
  }

  /**
   * Call Graph API with automatic retry and rate limit handling
   */
  private async graphApiCallWithRetry(url: string, maxRetries = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.graphClient.api(url).get();
      } catch (error: any) {
        // Handle rate limiting (429 Too Many Requests)
        if (error.statusCode === 429) {
          const retryAfter = parseInt(error.headers?.['retry-after'] || '60');
          console.log(`[Delta Sync] Rate limited. Waiting ${retryAfter}s before retry ${attempt}/${maxRetries}...`);
          await this.sleep(retryAfter * 1000);

          if (attempt < maxRetries) {
            continue; // Retry
          }
        }

        // Handle transient errors with exponential backoff
        if (attempt < maxRetries && this.isTransientError(error)) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          console.log(`[Delta Sync] Transient error. Retrying after ${delay}ms (attempt ${attempt}/${maxRetries})...`);
          await this.sleep(delay);
          continue;
        }

        // Non-retryable error or max retries reached
        throw error;
      }
    }

    throw new Error('Max retries reached');
  }

  /**
   * Check if error is transient and should be retried
   */
  private isTransientError(error: any): boolean {
    const transientCodes = [408, 429, 500, 502, 503, 504];
    return transientCodes.includes(error.statusCode);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics for an account
   */
  static async getSyncStats(accountId: string): Promise<{
    totalMessages: number;
    unreadMessages: number;
    lastSyncAt: string | null;
  }> {
    const supabase = createAdminClient();

    const { count: totalCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_read', false);

    const { data: syncState } = await supabase
      .from('sync_state')
      .select('last_sync_at')
      .eq('account_id', accountId)
      .eq('resource_type', 'messages')
      .single();

    return {
      totalMessages: totalCount || 0,
      unreadMessages: unreadCount || 0,
      lastSyncAt: syncState?.last_sync_at || null,
    };
  }
}
