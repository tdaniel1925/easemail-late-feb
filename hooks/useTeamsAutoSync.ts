import { useEffect, useCallback, useRef } from 'react';
import { useTeamsStore } from '@/stores/teams-store';
import { useToastStore } from '@/stores/toast-store';

/**
 * Auto-sync hook for Teams
 * Periodically syncs teams channels and messages from Microsoft Graph API
 *
 * @param accountId - The account ID to sync for (null to disable)
 * @param intervalMs - Sync interval in milliseconds (default: 3 minutes for messages)
 * @param enabled - Whether auto-sync is enabled (default: true)
 */
export function useTeamsAutoSync(
  accountId: string | null,
  intervalMs: number = 3 * 60 * 1000, // 3 minutes (more frequent for chat)
  enabled: boolean = true
) {
  const {
    setSyncing,
    setLastSyncAt,
    setChannels,
    setMessages,
    setLoadingChannels,
    setLoadingMessages,
    setChannelsError,
    setMessagesError,
    selectedChannelId,
    teamIdFilter,
    showFavoritesOnly
  } = useTeamsStore();
  const { addToast } = useToastStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform sync operation
   */
  const performSync = useCallback(async (showToast: boolean = false) => {
    if (!accountId) {
      console.log('[useTeamsAutoSync] No account selected, skipping sync');
      return;
    }

    try {
      setSyncing(true);
      setChannelsError(null);
      setMessagesError(null);

      // Call sync endpoint
      const syncResponse = await fetch(`/api/teams/sync?accountId=${accountId}`, {
        method: 'POST',
      });

      if (!syncResponse.ok) {
        throw new Error(`Sync failed: ${syncResponse.statusText}`);
      }

      const syncData = await syncResponse.json();

      // Fetch updated channels
      const channelsParams = new URLSearchParams({
        accountId,
      });

      if (teamIdFilter) channelsParams.append('teamId', teamIdFilter);
      if (showFavoritesOnly) channelsParams.append('favoritesOnly', 'true');

      const channelsResponse = await fetch(`/api/teams/channels?${channelsParams.toString()}`);

      if (!channelsResponse.ok) {
        throw new Error(`Failed to fetch channels: ${channelsResponse.statusText}`);
      }

      const channelsData = await channelsResponse.json();
      setChannels(channelsData.channels || []);

      // If a channel is selected, fetch its messages
      if (selectedChannelId) {
        const messagesParams = new URLSearchParams({
          accountId,
          channelId: selectedChannelId,
          page: '1',
          limit: '50',
        });

        const messagesResponse = await fetch(`/api/teams/messages?${messagesParams.toString()}`);

        if (!messagesResponse.ok) {
          throw new Error(`Failed to fetch messages: ${messagesResponse.statusText}`);
        }

        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      }

      setLastSyncAt(new Date().toISOString());

      if (showToast && syncData.result) {
        const { channelsSynced, messagesSynced } = syncData.result;
        const parts = [
          channelsSynced > 0 && `${channelsSynced} channels`,
          messagesSynced > 0 && `${messagesSynced} messages`,
        ].filter(Boolean).join(', ');

        if (parts) {
          addToast({
            id: `teams-sync-${Date.now()}`,
            type: 'success',
            message: `Teams synced: ${parts}`,
          });
        }
      }
    } catch (error: any) {
      console.error('[useTeamsAutoSync] Sync error:', error);
      setChannelsError(error.message || 'Sync failed');

      if (showToast) {
        addToast({
          id: `teams-sync-error-${Date.now()}`,
          type: 'error',
          message: 'Failed to sync Teams',
        });
      }
    } finally {
      setSyncing(false);
    }
  }, [accountId, selectedChannelId, teamIdFilter, showFavoritesOnly, setSyncing, setLastSyncAt, setChannels, setMessages, setChannelsError, setMessagesError, addToast]);

  /**
   * Manual sync trigger (with toast notification)
   */
  const triggerSync = useCallback(() => {
    performSync(true);
  }, [performSync]);

  /**
   * Set up auto-sync interval
   */
  useEffect(() => {
    if (!enabled || !accountId) {
      // Clear any existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      return;
    }

    // Initial sync (without toast)
    performSync(false);

    // Set up recurring sync
    const scheduleNextSync = () => {
      syncTimeoutRef.current = setTimeout(() => {
        performSync(false);
        scheduleNextSync(); // Schedule next sync
      }, intervalMs);
    };

    scheduleNextSync();

    // Cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [enabled, accountId, intervalMs, performSync]);

  return {
    triggerSync,
  };
}
