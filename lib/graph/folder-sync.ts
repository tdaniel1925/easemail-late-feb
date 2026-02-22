import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';

interface GraphFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount: number;
  unreadItemCount: number;
  totalItemCount: number;
  isHidden: boolean;
}

interface FolderSyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export class FolderSyncService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Sync all folders for an account from Graph API to database
   */
  async syncFolders(): Promise<FolderSyncResult> {
    const result: FolderSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Fetch all folders from Graph API (including nested)
      const graphFolders = await this.fetchAllFolders();

      // Get existing folders from database
      const { data: existingFolders, error: fetchError } = await supabase
        .from('account_folders')
        .select('id, graph_id, display_name, parent_graph_id, unread_count, total_count')
        .eq('account_id', this.accountId);

      if (fetchError) {
        result.errors.push(`Failed to fetch existing folders: ${fetchError.message}`);
        return result;
      }

      const existingFolderMap = new Map(
        (existingFolders || []).map((f) => [f.graph_id, f])
      );

      const graphFolderIds = new Set(graphFolders.map((f) => f.id));

      // Process each Graph folder
      for (const graphFolder of graphFolders) {
        try {
          const existing = existingFolderMap.get(graphFolder.id);

          if (existing) {
            // Update if changed
            const needsUpdate =
              existing.display_name !== graphFolder.displayName ||
              existing.parent_graph_id !== (graphFolder.parentFolderId || null) ||
              existing.unread_count !== graphFolder.unreadItemCount ||
              existing.total_count !== graphFolder.totalItemCount;

            if (needsUpdate) {
              const { error: updateError } = await supabase
                .from('account_folders')
                .update({
                  display_name: graphFolder.displayName,
                  parent_graph_id: graphFolder.parentFolderId || null,
                  unread_count: graphFolder.unreadItemCount,
                  total_count: graphFolder.totalItemCount,
                  is_hidden: graphFolder.isHidden,
                  last_synced_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

              if (updateError) {
                result.errors.push(`Failed to update folder ${graphFolder.displayName}: ${updateError.message}`);
              } else {
                result.updated++;
              }
            }
          } else {
            // Create new folder
            const { error: insertError } = await supabase
              .from('account_folders')
              .insert({
                account_id: this.accountId,
                graph_id: graphFolder.id,
                display_name: graphFolder.displayName,
                parent_graph_id: graphFolder.parentFolderId || null,
                unread_count: graphFolder.unreadItemCount,
                total_count: graphFolder.totalItemCount,
                is_hidden: graphFolder.isHidden,
                last_synced_at: new Date().toISOString(),
              });

            if (insertError) {
              result.errors.push(`Failed to create folder ${graphFolder.displayName}: ${insertError.message}`);
            } else {
              result.created++;
            }
          }

          result.synced++;
        } catch (error: any) {
          result.errors.push(`Error processing folder ${graphFolder.displayName}: ${error.message}`);
        }
      }

      // Delete folders that no longer exist in Graph
      for (const existing of existingFolders || []) {
        if (!graphFolderIds.has(existing.graph_id)) {
          const { error: deleteError } = await supabase
            .from('account_folders')
            .delete()
            .eq('id', existing.id);

          if (deleteError) {
            result.errors.push(`Failed to delete folder ${existing.display_name}: ${deleteError.message}`);
          } else {
            result.deleted++;
          }
        }
      }

      // Initialize sync state if this is first sync
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('id')
        .eq('account_id', this.accountId)
        .eq('resource_type', 'folders')
        .single();

      if (!syncState) {
        await supabase.from('sync_state').insert({
          account_id: this.accountId,
          resource_type: 'folders',
          delta_token: null, // Will be set in delta sync
          last_sync_at: new Date().toISOString(),
          sync_status: 'completed',
        });
      } else {
        await supabase
          .from('sync_state')
          .update({
            last_sync_at: new Date().toISOString(),
            sync_status: 'completed',
          })
          .eq('id', syncState.id);
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Folder sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Fetch all folders recursively from Graph API
   */
  private async fetchAllFolders(): Promise<GraphFolder[]> {
    const allFolders: GraphFolder[] = [];

    try {
      // Fetch top-level folders
      const response = await this.graphClient
        .api('/me/mailFolders')
        .select('id,displayName,parentFolderId,childFolderCount,unreadItemCount,totalItemCount,isHidden')
        .top(250)
        .get();

      const folders: GraphFolder[] = response.value || [];
      allFolders.push(...folders);

      // Recursively fetch child folders for each folder
      for (const folder of folders) {
        if (folder.childFolderCount > 0) {
          const childFolders = await this.fetchChildFolders(folder.id);
          allFolders.push(...childFolders);
        }
      }

      return allFolders;
    } catch (error: any) {
      throw new Error(`Failed to fetch folders from Graph API: ${error.message}`);
    }
  }

  /**
   * Fetch child folders recursively
   */
  private async fetchChildFolders(parentFolderId: string): Promise<GraphFolder[]> {
    const childFolders: GraphFolder[] = [];

    try {
      const response = await this.graphClient
        .api(`/me/mailFolders/${parentFolderId}/childFolders`)
        .select('id,displayName,parentFolderId,childFolderCount,unreadItemCount,totalItemCount,isHidden')
        .top(250)
        .get();

      const folders: GraphFolder[] = response.value || [];
      childFolders.push(...folders);

      // Recursively fetch nested children
      for (const folder of folders) {
        if (folder.childFolderCount > 0) {
          const nestedChildren = await this.fetchChildFolders(folder.id);
          childFolders.push(...nestedChildren);
        }
      }

      return childFolders;
    } catch (error: any) {
      throw new Error(`Failed to fetch child folders for ${parentFolderId}: ${error.message}`);
    }
  }

  /**
   * Get a single folder by MS folder ID
   */
  async getFolder(msFolderId: string): Promise<GraphFolder | null> {
    try {
      const folder = await this.graphClient
        .api(`/me/mailFolders/${msFolderId}`)
        .select('id,displayName,parentFolderId,childFolderCount,unreadItemCount,totalItemCount,isHidden')
        .get();

      return folder;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw new Error(`Failed to fetch folder ${msFolderId}: ${error.message}`);
    }
  }
}
