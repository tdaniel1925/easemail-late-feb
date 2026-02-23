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
  constructor(
    private graphClient: Client,
    private accountId: string,
    private folderId?: string // Optional: sync specific folder, or all folders if not provided
  ) {}

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

      // Add $select to include full body content
      deltaUrl += '?$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,replyTo,sentDateTime,receivedDateTime,hasAttachments,importance,isRead,isDraft,flag,parentFolderId,internetMessageId,conversationIndex';

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
          const response = await this.graphClient.api(nextLink).get();

          const messages: GraphMessage[] = response.value || [];
          console.log(`Fetched ${messages.length} messages from delta query`);

          // Process each message
          for (const message of messages) {
            try {
              if (message['@removed']) {
                // Message was deleted
                await this.deleteMessage(message.id);
                result.deleted++;
              } else {
                // Message was created or updated
                const isNew = await this.upsertMessage(message);
                if (isNew) {
                  result.created++;
                } else {
                  result.updated++;
                }
              }
              result.synced++;
            } catch (error: any) {
              result.errors.push(`Failed to process message ${message.id}: ${error.message}`);
            }
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
   * Upsert a message into the database
   * Returns true if created, false if updated
   */
  private async upsertMessage(message: GraphMessage): Promise<boolean> {
    const supabase = createAdminClient();

    // Check if message exists
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('account_id', this.accountId)
      .eq('graph_id', message.id)
      .single();

    // Look up folder ID from graph folder ID
    let folderUuid: string | null = null;
    if (message.parentFolderId) {
      const { data: folder } = await supabase
        .from('account_folders')
        .select('id')
        .eq('account_id', this.accountId)
        .eq('graph_id', message.parentFolderId)
        .single();

      folderUuid = folder?.id || null;
    }

    if (!folderUuid) {
      throw new Error(`Folder not found for graph_id: ${message.parentFolderId}`);
    }

    const messageData = {
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

    if (existing) {
      // Update existing message
      const { error } = await supabase
        .from('messages')
        .update({
          ...messageData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update message: ${error.message}`);
      }

      return false; // Updated
    } else {
      // Create new message
      const { error } = await supabase.from('messages').insert(messageData);

      if (error) {
        throw new Error(`Failed to create message: ${error.message}`);
      }

      return true; // Created
    }
  }

  /**
   * Delete a message from the database
   */
  private async deleteMessage(graphId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('account_id', this.accountId)
      .eq('graph_id', graphId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
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
