import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';

interface AttachmentSyncResult {
  messageId: string;
  synced: number;
  downloaded: number;
  skipped: number;
  errors: string[];
}

interface GraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  contentId?: string;
  contentBytes?: string; // Base64 encoded
  '@odata.type': string;
}

export class AttachmentSyncService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Sync attachments for a specific message
   * Downloads attachment metadata and optionally the content
   */
  async syncMessageAttachments(
    messageGraphId: string,
    downloadContent: boolean = false
  ): Promise<AttachmentSyncResult> {
    const result: AttachmentSyncResult = {
      messageId: messageGraphId,
      synced: 0,
      downloaded: 0,
      skipped: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Get message UUID from graph ID
      const { data: message } = await supabase
        .from('messages')
        .select('id')
        .eq('account_id', this.accountId)
        .eq('graph_id', messageGraphId)
        .single();

      if (!message) {
        result.errors.push('Message not found in database');
        return result;
      }

      const messageUuid = message.id;

      // Fetch attachments from Graph API
      const response = await this.graphClient
        .api(`/me/messages/${messageGraphId}/attachments`)
        .select('id,name,contentType,size,isInline,contentId')
        .get();

      const attachments: GraphAttachment[] = response.value || [];

      console.log(`[Attachment Sync] Found ${attachments.length} attachments for message ${messageGraphId}`);

      for (const attachment of attachments) {
        try {
          // Check if attachment already exists
          const { data: existing } = await supabase
            .from('attachments')
            .select('id, content_stored')
            .eq('message_id', messageUuid)
            .eq('graph_id', attachment.id)
            .single();

          if (existing) {
            result.skipped++;
            continue;
          }

          // Download full attachment content if requested and size is reasonable (< 10MB)
          let contentBytes: string | null = null;
          let contentStored = false;

          if (downloadContent && attachment.size < 10 * 1024 * 1024) {
            try {
              const fullAttachment = await this.graphClient
                .api(`/me/messages/${messageGraphId}/attachments/${attachment.id}`)
                .get();

              contentBytes = fullAttachment.contentBytes;
              contentStored = true;
              result.downloaded++;
            } catch (downloadError: any) {
              console.error(`Failed to download attachment ${attachment.name}:`, downloadError);
              result.errors.push(`Download failed for ${attachment.name}: ${downloadError.message}`);
            }
          }

          // Store attachment metadata
          await supabase.from('attachments').insert({
            message_id: messageUuid,
            graph_id: attachment.id,
            name: attachment.name,
            content_type: attachment.contentType,
            size_bytes: attachment.size,
            is_inline: attachment.isInline,
            content_id: attachment.contentId,
            content_base64: contentBytes,
            content_stored: contentStored,
          });

          result.synced++;
        } catch (error: any) {
          result.errors.push(`Failed to sync attachment ${attachment.name}: ${error.message}`);
        }
      }

      // Update message attachment count
      await supabase
        .from('messages')
        .update({
          attachment_count: attachments.length,
          has_attachments: attachments.length > 0,
        })
        .eq('id', messageUuid);

      return result;
    } catch (error: any) {
      result.errors.push(`Attachment sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Download attachment content on demand
   * Used when user clicks to download an attachment
   */
  async downloadAttachment(messageGraphId: string, attachmentGraphId: string): Promise<{
    name: string;
    contentType: string;
    content: Buffer;
  }> {
    try {
      const attachment = await this.graphClient
        .api(`/me/messages/${messageGraphId}/attachments/${attachmentGraphId}`)
        .get();

      if (!attachment.contentBytes) {
        throw new Error('Attachment content not available');
      }

      return {
        name: attachment.name,
        contentType: attachment.contentType,
        content: Buffer.from(attachment.contentBytes, 'base64'),
      };
    } catch (error: any) {
      throw new Error(`Failed to download attachment: ${error.message}`);
    }
  }

  /**
   * Delete attachment from database
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const supabase = createAdminClient();

    await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);
  }
}
