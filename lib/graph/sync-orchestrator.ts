import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { FolderSyncService } from './folder-sync';
import { MessageDeltaSyncService } from './message-delta-sync';

interface SyncResult {
  accountId: string;
  accountEmail: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  folderSync: {
    synced: number;
    created: number;
    updated: number;
    deleted: number;
    errors: string[];
  };
  messageSync: {
    totalFolders: number;
    totalMessages: number;
    errors: string[];
    folderResults: Array<{
      folderName: string;
      folderId: string;
      synced: number;
      created: number;
      updated: number;
      deleted: number;
    }>;
  };
  overallStatus: 'success' | 'partial' | 'failed';
  errors: string[];
}

export class SyncOrchestrator {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Perform full sync of folders and messages for an account
   * Syncs folders first, then syncs messages for each folder
   */
  async performFullSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      accountId: this.accountId,
      accountEmail: '',
      startedAt: new Date().toISOString(),
      completedAt: '',
      duration: 0,
      folderSync: {
        synced: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [],
      },
      messageSync: {
        totalFolders: 0,
        totalMessages: 0,
        errors: [],
        folderResults: [],
      },
      overallStatus: 'success',
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Get account email
      const { data: account } = await supabase
        .from('connected_accounts')
        .select('email')
        .eq('id', this.accountId)
        .single();

      result.accountEmail = account?.email || 'unknown';

      // Step 1: Sync folders first (must be done before messages)
      console.log(`[Sync Orchestrator] Step 1: Syncing folders for ${result.accountEmail}...`);
      const folderSync = new FolderSyncService(this.graphClient, this.accountId);
      const folderResult = await folderSync.syncFolders();

      result.folderSync = {
        synced: folderResult.synced,
        created: folderResult.created,
        updated: folderResult.updated,
        deleted: folderResult.deleted,
        errors: folderResult.errors,
      };

      if (folderResult.errors.length > 0) {
        result.overallStatus = 'partial';
        result.errors.push(...folderResult.errors);
      }

      console.log(`[Sync Orchestrator] Folder sync complete: ${folderResult.synced} folders`);

      // Step 2: Get list of folders to sync messages from
      const { data: folders } = await supabase
        .from('account_folders')
        .select('id, graph_id, display_name, total_count')
        .eq('account_id', this.accountId)
        .order('total_count', { ascending: true }); // Sync smaller folders first

      if (!folders || folders.length === 0) {
        result.errors.push('No folders found to sync messages from');
        result.overallStatus = 'failed';
        result.completedAt = new Date().toISOString();
        result.duration = Date.now() - startTime;
        return result;
      }

      console.log(`[Sync Orchestrator] Step 2: Syncing messages for ${folders.length} folders...`);
      result.messageSync.totalFolders = folders.length;

      // Step 3: Sync messages for folders in parallel batches (10 at a time for speed)
      const BATCH_SIZE = 10;
      const batches: typeof folders[] = [];

      for (let i = 0; i < folders.length; i += BATCH_SIZE) {
        batches.push(folders.slice(i, i + BATCH_SIZE));
      }

      console.log(`[Sync Orchestrator] Processing ${folders.length} folders in ${batches.length} batches of ${BATCH_SIZE}`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`[Sync Orchestrator] Batch ${batchIndex + 1}/${batches.length}: Processing ${batch.length} folders...`);

        // Process all folders in this batch concurrently
        const batchPromises = batch.map(async (folder) => {
          try {
            console.log(`[Sync Orchestrator] [${folder.display_name}] Starting sync (${folder.total_count} messages)...`);

            const messageSync = new MessageDeltaSyncService(
              this.graphClient,
              this.accountId,
              folder.graph_id
            );

            const startTime = Date.now();
            const messageSyncResult = await messageSync.syncMessages();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`[Sync Orchestrator] [${folder.display_name}] ✓ ${messageSyncResult.synced} messages synced in ${duration}s`);

            return {
              success: true,
              folder,
              result: messageSyncResult,
            };
          } catch (error: any) {
            console.error(`[Sync Orchestrator] [${folder.display_name}] ✗ Error: ${error.message}`);
            return {
              success: false,
              folder,
              error: error.message,
            };
          }
        });

        // Wait for all folders in this batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Aggregate results
        for (const batchResult of batchResults) {
          if (batchResult.success && batchResult.result) {
            result.messageSync.totalMessages += batchResult.result.synced;
            result.messageSync.folderResults.push({
              folderName: batchResult.folder.display_name,
              folderId: batchResult.folder.graph_id,
              synced: batchResult.result.synced,
              created: batchResult.result.created,
              updated: batchResult.result.updated,
              deleted: batchResult.result.deleted,
            });

            if (batchResult.result.errors.length > 0) {
              result.messageSync.errors.push(...batchResult.result.errors);
              result.overallStatus = 'partial';
            }
          } else if (batchResult.error) {
            const errorMsg = `Failed to sync messages for folder ${batchResult.folder.display_name}: ${batchResult.error}`;
            result.messageSync.errors.push(errorMsg);
            result.errors.push(errorMsg);
            result.overallStatus = 'partial';
          }
        }

        console.log(`[Sync Orchestrator] Batch ${batchIndex + 1}/${batches.length} complete. Total synced: ${result.messageSync.totalMessages} messages`);
      }

      console.log(`[Sync Orchestrator] Message sync complete: ${result.messageSync.totalMessages} messages across ${folders.length} folders`);

      // Step 4: Update account sync metadata
      await supabase
        .from('connected_accounts')
        .update({
          last_full_sync_at: new Date().toISOString(),
          status: result.overallStatus === 'success' ? 'active' : 'error',
          status_message: result.errors.length > 0 ? result.errors.join('; ') : null,
          initial_sync_complete: true,
          messages_synced: result.messageSync.totalMessages,
        })
        .eq('id', this.accountId);

      result.completedAt = new Date().toISOString();
      result.duration = Date.now() - startTime;

      console.log(`[Sync Orchestrator] Full sync completed in ${(result.duration / 1000).toFixed(2)}s`);
      console.log(`[Sync Orchestrator] Status: ${result.overallStatus}`);
      console.log(`[Sync Orchestrator] Folders: ${result.folderSync.synced}, Messages: ${result.messageSync.totalMessages}`);

      return result;
    } catch (error: any) {
      result.errors.push(`Sync orchestration failed: ${error.message}`);
      result.overallStatus = 'failed';
      result.completedAt = new Date().toISOString();
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Perform quick sync (folders + delta messages only)
   * Faster than full sync as it uses delta tokens
   */
  async performQuickSync(): Promise<SyncResult> {
    // Quick sync is the same as full sync when delta tokens are present
    // The MessageDeltaSyncService automatically uses delta tokens if available
    return this.performFullSync();
  }

  /**
   * Sync a single folder's messages
   */
  async syncFolder(folderId: string): Promise<{
    synced: number;
    created: number;
    updated: number;
    deleted: number;
    errors: string[];
  }> {
    const messageSync = new MessageDeltaSyncService(
      this.graphClient,
      this.accountId,
      folderId
    );

    return messageSync.syncMessages();
  }
}
