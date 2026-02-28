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

/**
 * Determine folder type based on display name
 * Maps Microsoft's well-known folder names to our folder_type enum
 */
function getFolderType(displayName: string): string {
  const normalizedName = displayName.toLowerCase();

  if (normalizedName === 'inbox') return 'inbox';
  if (normalizedName === 'drafts') return 'drafts';
  if (normalizedName === 'sent items' || normalizedName === 'sent') return 'sentitems';
  if (normalizedName === 'deleted items' || normalizedName === 'trash') return 'deleteditems';
  if (normalizedName === 'archive') return 'archive';
  if (normalizedName === 'junk email' || normalizedName === 'spam') return 'junkemail';
  if (normalizedName === 'outbox') return 'outbox';

  // All other folders are custom
  return 'custom';
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
                  folder_type: getFolderType(graphFolder.displayName),
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
                folder_type: getFolderType(graphFolder.displayName),
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

      // Fix duplicate folders after sync (mark primary folders)
      await this.fixDuplicateFolders();

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

  /**
   * Fix duplicate folders by marking the primary folder for each folder_type
   * For each account + folder_type combination, marks the folder with the most messages as primary
   * Only considers visible (non-hidden) folders to avoid marking hidden folders as primary
   */
  private async fixDuplicateFolders(): Promise<void> {
    const supabase = createAdminClient();

    try {
      // Get all visible folders for this account (exclude hidden folders)
      const { data: folders, error: fetchError } = await supabase
        .from('account_folders')
        .select('id, folder_type, display_name, total_count, unread_count, created_at, is_hidden')
        .eq('account_id', this.accountId)
        .is('is_hidden', false); // Only process visible folders

      if (fetchError) {
        console.error(`Failed to fetch folders for duplicate fix: ${fetchError.message}`);
        return;
      }

      if (!folders || folders.length === 0) {
        return;
      }

      // Also mark any hidden folders as non-primary (safety measure)
      await supabase
        .from('account_folders')
        .update({ is_primary: false })
        .eq('account_id', this.accountId)
        .eq('is_hidden', true);

      // Group folders by folder_type
      const foldersByType = new Map<string, typeof folders>();
      for (const folder of folders) {
        const existing = foldersByType.get(folder.folder_type) || [];
        existing.push(folder);
        foldersByType.set(folder.folder_type, existing);
      }

      // Process each folder_type group
      for (const [folderType, typeFolders] of foldersByType.entries()) {
        if (typeFolders.length <= 1) {
          // No duplicates, ensure single folder is marked as primary
          await supabase
            .from('account_folders')
            .update({ is_primary: true })
            .eq('id', typeFolders[0].id);
          continue;
        }

        // Multiple folders of same type - mark the one with most messages as primary
        // Sort by: total_count DESC, unread_count DESC, created_at ASC
        const sorted = [...typeFolders].sort((a, b) => {
          if (b.total_count !== a.total_count) {
            return b.total_count - a.total_count;
          }
          if (b.unread_count !== a.unread_count) {
            return b.unread_count - a.unread_count;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const primaryFolder = sorted[0];
        const secondaryFolders = sorted.slice(1);

        // Mark primary folder
        await supabase
          .from('account_folders')
          .update({ is_primary: true })
          .eq('id', primaryFolder.id);

        console.log(`✅ Marked "${primaryFolder.display_name}" (${primaryFolder.total_count} messages) as primary ${folderType}`);

        // Mark secondary folders
        for (const secondaryFolder of secondaryFolders) {
          await supabase
            .from('account_folders')
            .update({ is_primary: false })
            .eq('id', secondaryFolder.id);

          console.log(`   Marked "${secondaryFolder.display_name}" (${secondaryFolder.total_count} messages) as secondary`);
        }
      }
    } catch (error: any) {
      console.error(`Failed to fix duplicate folders: ${error.message}`);
      // Don't throw - this is a cleanup operation, shouldn't fail the sync
    }
  }
}
