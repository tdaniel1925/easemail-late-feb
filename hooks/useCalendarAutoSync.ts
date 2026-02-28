import { useEffect, useCallback, useRef } from 'react';
import { useCalendarStore } from '@/stores/calendar-store';
import { useToastStore } from '@/stores/toast-store';

/**
 * Auto-sync hook for Calendar
 * Periodically syncs calendar events from Microsoft Graph API
 *
 * @param accountId - The account ID to sync for (null to disable)
 * @param intervalMs - Sync interval in milliseconds (default: 5 minutes)
 * @param enabled - Whether auto-sync is enabled (default: true)
 */
export function useCalendarAutoSync(
  accountId: string | null,
  intervalMs: number = 5 * 60 * 1000, // 5 minutes
  enabled: boolean = true
) {
  const {
    setSyncing,
    setLastSyncAt,
    setEvents,
    setEventTotal,
    setEventsError,
    currentDate,
    currentView,
    responseStatusFilter,
    isOnlineMeetingFilter
  } = useCalendarStore();
  const { addToast } = useToastStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform sync operation
   */
  const performSync = useCallback(async (showToast: boolean = false) => {
    if (!accountId) {
      console.log('[useCalendarAutoSync] No account selected, skipping sync');
      return;
    }

    try {
      setSyncing(true);
      setEventsError(null);

      // Call sync endpoint
      const syncResponse = await fetch(`/api/calendar/sync?accountId=${accountId}`, {
        method: 'POST',
      });

      if (!syncResponse.ok) {
        throw new Error(`Sync failed: ${syncResponse.statusText}`);
      }

      const syncData = await syncResponse.json();

      // Calculate date range based on current view
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);

      switch (currentView) {
        case 'day':
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          startDate.setDate(1); // Start of month
          endDate.setMonth(startDate.getMonth() + 1);
          endDate.setDate(0); // Last day of month
          break;
        case 'agenda':
          endDate.setMonth(startDate.getMonth() + 3); // Next 3 months
          break;
      }

      // Fetch updated events
      const params = new URLSearchParams({
        accountId,
        page: '1',
        limit: '100',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (responseStatusFilter) params.append('responseStatus', responseStatusFilter);
      if (isOnlineMeetingFilter !== null) params.append('isOnlineMeeting', String(isOnlineMeetingFilter));

      const eventsResponse = await fetch(`/api/calendar/events?${params.toString()}`);

      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
      }

      const eventsData = await eventsResponse.json();

      // Update store
      setEvents(eventsData.events || []);
      setEventTotal(eventsData.pagination?.total || 0);
      setLastSyncAt(new Date().toISOString());

      if (showToast && syncData.result) {
        const { created, updated, deleted } = syncData.result;
        const changes = [
          created > 0 && `${created} created`,
          updated > 0 && `${updated} updated`,
          deleted > 0 && `${deleted} deleted`,
        ].filter(Boolean).join(', ');

        if (changes) {
          addToast({
            id: `calendar-sync-${Date.now()}`,
            type: 'success',
            message: `Calendar synced: ${changes}`,
          });
        }
      }
    } catch (error: any) {
      console.error('[useCalendarAutoSync] Sync error:', error);
      setEventsError(error.message || 'Sync failed');

      if (showToast) {
        addToast({
          id: `calendar-sync-error-${Date.now()}`,
          type: 'error',
          message: 'Failed to sync calendar',
        });
      }
    } finally {
      setSyncing(false);
    }
  }, [accountId, currentDate, currentView, responseStatusFilter, isOnlineMeetingFilter, setSyncing, setLastSyncAt, setEvents, setEventTotal, setEventsError, addToast]);

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
