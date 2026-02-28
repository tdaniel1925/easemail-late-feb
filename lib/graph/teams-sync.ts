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

interface TeamsSyncResult {
  teams: DeltaSyncResult;
  channels: DeltaSyncResult;
  messages: DeltaSyncResult;
  totalErrors: string[];
}

interface GraphTeam {
  id: string;
  displayName: string;
  description?: string;
}

interface GraphChannel {
  id: string;
  displayName: string;
  description?: string;
  membershipType?: string;
}

interface GraphMessage {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime?: string;
  deletedDateTime?: string;
  body?: {
    contentType: string;
    content: string;
  };
  from?: {
    user?: {
      displayName?: string;
      userPrincipalName?: string;
    };
  };
  replyToId?: string;
  importance?: string;
  attachments?: any[];
  mentions?: any[];
  reactions?: any[];
  '@removed'?: {
    reason: string;
  };
}

export class TeamsDeltaSyncService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Perform full Teams sync: teams → channels → messages
   */
  async syncTeams(): Promise<TeamsSyncResult> {
    const result: TeamsSyncResult = {
      teams: { synced: 0, created: 0, updated: 0, deleted: 0, errors: [] },
      channels: { synced: 0, created: 0, updated: 0, deleted: 0, errors: [] },
      messages: { synced: 0, created: 0, updated: 0, deleted: 0, errors: [] },
      totalErrors: [],
    };

    try {
      // Step 1: Sync teams
      const teams = await this.syncJoinedTeams();
      result.teams = teams;

      // Step 2: For each team, sync channels
      const teamsData = await this.getStoredTeams();
      for (const team of teamsData) {
        try {
          const channelsResult = await this.syncTeamChannels(team.graph_team_id, team.team_name);
          result.channels.synced += channelsResult.synced;
          result.channels.created += channelsResult.created;
          result.channels.updated += channelsResult.updated;
          result.channels.deleted += channelsResult.deleted;
          result.channels.errors.push(...channelsResult.errors);
        } catch (error: any) {
          const errorMsg = `Failed to sync channels for team ${team.team_name}: ${error.message}`;
          console.error(`[Teams Sync] ${errorMsg}`);
          result.channels.errors.push(errorMsg);
        }
      }

      // Step 3: For each channel, sync messages (using delta tokens)
      const channelsData = await this.getStoredChannels();
      for (const channel of channelsData) {
        try {
          const messagesResult = await this.syncChannelMessages(
            channel.graph_team_id,
            channel.graph_channel_id,
            channel.id
          );
          result.messages.synced += messagesResult.synced;
          result.messages.created += messagesResult.created;
          result.messages.updated += messagesResult.updated;
          result.messages.deleted += messagesResult.deleted;
          result.messages.errors.push(...messagesResult.errors);
        } catch (error: any) {
          const errorMsg = `Failed to sync messages for channel ${channel.channel_name}: ${error.message}`;
          console.error(`[Teams Sync] ${errorMsg}`);
          result.messages.errors.push(errorMsg);
        }
      }

      result.totalErrors = [
        ...result.teams.errors,
        ...result.channels.errors,
        ...result.messages.errors,
      ];

      return result;
    } catch (error: any) {
      result.totalErrors.push(`Teams sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Sync joined teams
   */
  private async syncJoinedTeams(): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      console.log(`[Teams Sync] Fetching joined teams`);
      const response = await this.graphClient.api('/me/joinedTeams').get();

      const teams: GraphTeam[] = response.value || [];
      console.log(`[Teams Sync] Fetched ${teams.length} teams`);

      const supabase = createAdminClient();

      // Get existing teams for this account
      const { data: existingChannels } = await supabase
        .from('teams_channels')
        .select('graph_team_id')
        .eq('account_id', this.accountId);

      const existingTeamIds = new Set(existingChannels?.map(c => c.graph_team_id) || []);

      // Mark teams that no longer exist as deleted (we'll handle this in channel sync)
      for (const teamId of existingTeamIds) {
        if (!teams.find(t => t.id === teamId)) {
          // Delete all channels for this team
          await supabase
            .from('teams_channels')
            .delete()
            .eq('account_id', this.accountId)
            .eq('graph_team_id', teamId);
          result.deleted++;
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Failed to sync joined teams: ${error.message}`);
      return result;
    }
  }

  /**
   * Sync channels for a specific team
   */
  private async syncTeamChannels(teamId: string, teamName: string): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      console.log(`[Teams Sync] Fetching channels for team: ${teamName}`);
      const response = await this.graphClient
        .api(`/teams/${teamId}/channels`)
        .get();

      const channels: GraphChannel[] = response.value || [];
      console.log(`[Teams Sync] Fetched ${channels.length} channels for ${teamName}`);

      for (const channel of channels) {
        try {
          const isNew = await this.upsertChannel(teamId, teamName, channel);
          if (isNew) {
            result.created++;
            console.log(`[Teams Sync] ✓ Created channel: ${teamName} / ${channel.displayName}`);
          } else {
            result.updated++;
            console.log(`[Teams Sync] ↻ Updated channel: ${teamName} / ${channel.displayName}`);
          }
          result.synced++;
        } catch (error: any) {
          console.error(`[Teams Sync] ✗ Failed to sync channel ${channel.displayName}: ${error.message}`);
          result.errors.push(`Failed to sync channel ${channel.displayName}: ${error.message}`);
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Failed to sync channels for team ${teamName}: ${error.message}`);
      return result;
    }
  }

  /**
   * Sync messages for a specific channel using delta tokens
   */
  private async syncChannelMessages(
    teamId: string,
    channelId: string,
    channelUuid: string
  ): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Get current delta token for this channel
      const resourceType = `teams:${teamId}:${channelId}`;
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('delta_token')
        .eq('account_id', this.accountId)
        .eq('resource_type', resourceType)
        .single();

      const deltaToken = syncState?.delta_token;

      // Build delta query URL
      let deltaUrl = `/teams/${teamId}/channels/${channelId}/messages/delta`;

      // If we have a delta token, use it for incremental sync
      if (deltaToken) {
        deltaUrl = deltaToken; // Delta token contains full URL
        console.log(`[Teams Sync] Using delta token for channel ${channelId}`);
      } else {
        console.log(`[Teams Sync] Starting initial sync for channel ${channelId}`);
      }

      // Fetch messages using delta query
      let hasMore = true;
      let nextLink = deltaUrl;
      let newDeltaToken: string | undefined;

      while (hasMore) {
        try {
          const response = await this.graphClient.api(nextLink).get();

          const messages: GraphMessage[] = response.value || [];
          console.log(`[Teams Sync] Fetched ${messages.length} messages from channel`);

          // Process each message
          for (const message of messages) {
            try {
              if (message['@removed']) {
                // Message was deleted
                await this.deleteMessage(message.id);
                result.deleted++;
              } else {
                // Message was created or updated
                const isNew = await this.upsertMessage(channelUuid, message);
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
          result.errors.push(`Delta query failed for channel: ${error.message}`);
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
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Failed to sync messages for channel: ${error.message}`);
      return result;
    }
  }

  /**
   * Upsert a channel into the database
   */
  private async upsertChannel(
    teamId: string,
    teamName: string,
    channel: GraphChannel
  ): Promise<boolean> {
    const supabase = createAdminClient();

    // Check if channel exists
    const { data: existing } = await supabase
      .from('teams_channels')
      .select('id')
      .eq('account_id', this.accountId)
      .eq('graph_team_id', teamId)
      .eq('graph_channel_id', channel.id)
      .single();

    const channelData = {
      account_id: this.accountId,
      graph_team_id: teamId,
      graph_channel_id: channel.id,
      team_name: teamName,
      channel_name: channel.displayName,
      description: channel.description || null,
      is_favorite: false,
      member_count: 0,
      unread_count: 0,
    };

    if (existing) {
      // Update existing channel
      const { error } = await supabase
        .from('teams_channels')
        .update({
          ...channelData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update channel: ${error.message}`);
      }

      return false; // Updated
    } else {
      // Create new channel
      const { error } = await supabase
        .from('teams_channels')
        .insert(channelData);

      if (error) {
        throw new Error(`Failed to create channel: ${error.message}`);
      }

      return true; // Created
    }
  }

  /**
   * Upsert a message into the database
   */
  private async upsertMessage(channelUuid: string, message: GraphMessage): Promise<boolean> {
    const supabase = createAdminClient();

    // Check if message exists
    const { data: existing } = await supabase
      .from('teams_messages')
      .select('id')
      .eq('account_id', this.accountId)
      .eq('graph_id', message.id)
      .single();

    // Handle reply-to relationship
    let replyToUuid: string | null = null;
    if (message.replyToId) {
      const { data: replyToMsg } = await supabase
        .from('teams_messages')
        .select('id')
        .eq('account_id', this.accountId)
        .eq('graph_id', message.replyToId)
        .single();

      replyToUuid = replyToMsg?.id || null;
    }

    const messageData = {
      account_id: this.accountId,
      channel_id: channelUuid,
      graph_id: message.id,
      body_html: message.body?.contentType === 'html' ? message.body.content : null,
      body_text: message.body?.contentType === 'text' ? message.body.content : null,
      from_name: message.from?.user?.displayName || null,
      from_email: message.from?.user?.userPrincipalName || null,
      reply_to_id: replyToUuid,
      reply_count: 0,
      reactions: message.reactions || [],
      attachments: message.attachments || [],
      mentions: message.mentions || [],
      is_deleted: !!message.deletedDateTime,
      importance: message.importance?.toLowerCase() || 'normal',
      created_at: new Date(message.createdDateTime).toISOString(),
    };

    if (existing) {
      // Update existing message
      const { error } = await supabase
        .from('teams_messages')
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
      const { error } = await supabase
        .from('teams_messages')
        .insert(messageData);

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
      .from('teams_messages')
      .delete()
      .eq('account_id', this.accountId)
      .eq('graph_id', graphId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  /**
   * Get stored teams for this account
   */
  private async getStoredTeams(): Promise<Array<{ graph_team_id: string; team_name: string }>> {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from('teams_channels')
      .select('graph_team_id, team_name')
      .eq('account_id', this.accountId);

    // Deduplicate by team_id
    const teamsMap = new Map<string, string>();
    data?.forEach(channel => {
      if (!teamsMap.has(channel.graph_team_id)) {
        teamsMap.set(channel.graph_team_id, channel.team_name);
      }
    });

    return Array.from(teamsMap.entries()).map(([graph_team_id, team_name]) => ({
      graph_team_id,
      team_name,
    }));
  }

  /**
   * Get stored channels for this account
   */
  private async getStoredChannels(): Promise<Array<{
    id: string;
    graph_team_id: string;
    graph_channel_id: string;
    channel_name: string;
  }>> {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from('teams_channels')
      .select('id, graph_team_id, graph_channel_id, channel_name')
      .eq('account_id', this.accountId);

    return data || [];
  }

  /**
   * Get sync statistics for an account
   */
  static async getSyncStats(accountId: string): Promise<{
    totalChannels: number;
    totalMessages: number;
    unreadMessages: number;
    lastSyncAt: string | null;
  }> {
    const supabase = createAdminClient();

    const { count: channelCount } = await supabase
      .from('teams_channels')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const { count: messageCount } = await supabase
      .from('teams_messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Get unread count from channels
    const { data: channels } = await supabase
      .from('teams_channels')
      .select('unread_count')
      .eq('account_id', accountId);

    const unreadCount = channels?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

    // Get last sync time (most recent across all channels)
    const { data: syncStates } = await supabase
      .from('sync_state')
      .select('last_sync_at')
      .eq('account_id', accountId)
      .like('resource_type', 'teams:%')
      .order('last_sync_at', { ascending: false })
      .limit(1);

    return {
      totalChannels: channelCount || 0,
      totalMessages: messageCount || 0,
      unreadMessages: unreadCount,
      lastSyncAt: syncStates?.[0]?.last_sync_at || null,
    };
  }
}
