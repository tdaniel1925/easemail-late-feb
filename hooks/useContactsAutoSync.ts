import { useEffect, useCallback, useRef } from 'react';
import { useContactsStore } from '@/stores/contacts-store';
import { useToastStore } from '@/stores/toast-store';

/**
 * Auto-sync hook for Contacts
 * Periodically syncs contacts from Microsoft Graph API
 *
 * @param accountId - The account ID to sync for (null to disable)
 * @param intervalMs - Sync interval in milliseconds (default: 5 minutes)
 * @param enabled - Whether auto-sync is enabled (default: true)
 */
export function useContactsAutoSync(
  accountId: string | null,
  intervalMs: number = 5 * 60 * 1000, // 5 minutes
  enabled: boolean = true
) {
  const {
    setSyncing,
    setLastSyncAt,
    setContacts,
    setContactTotal,
    setContactsError,
    searchQuery,
    companyFilter,
    sourceFilter,
    favoriteFilter,
    selectedGroupId
  } = useContactsStore();
  const { addToast } = useToastStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform sync operation
   */
  const performSync = useCallback(async (showToast: boolean = false) => {
    if (!accountId) {
      console.log('[useContactsAutoSync] No account selected, skipping sync');
      return;
    }

    try {
      setSyncing(true);
      setContactsError(null);

      // Call sync endpoint
      const syncResponse = await fetch(`/api/contacts/sync?accountId=${accountId}`, {
        method: 'POST',
      });

      if (!syncResponse.ok) {
        throw new Error(`Sync failed: ${syncResponse.statusText}`);
      }

      const syncData = await syncResponse.json();

      // Fetch updated contacts
      const params = new URLSearchParams({
        accountId,
        page: '1',
        limit: '50',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (companyFilter) params.append('company', companyFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (favoriteFilter !== null) params.append('isFavorite', String(favoriteFilter));
      if (selectedGroupId) params.append('groupId', selectedGroupId);

      const contactsResponse = await fetch(`/api/contacts?${params.toString()}`);

      if (!contactsResponse.ok) {
        throw new Error(`Failed to fetch contacts: ${contactsResponse.statusText}`);
      }

      const contactsData = await contactsResponse.json();

      // Update store
      setContacts(contactsData.contacts || []);
      setContactTotal(contactsData.pagination?.total || 0);
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
            id: `contacts-sync-${Date.now()}`,
            type: 'success',
            message: `Contacts synced: ${changes}`,
          });
        }
      }
    } catch (error: any) {
      console.error('[useContactsAutoSync] Sync error:', error);
      setContactsError(error.message || 'Sync failed');

      if (showToast) {
        addToast({
          id: `contacts-sync-error-${Date.now()}`,
          type: 'error',
          message: 'Failed to sync contacts',
        });
      }
    } finally {
      setSyncing(false);
    }
  }, [accountId, searchQuery, companyFilter, sourceFilter, favoriteFilter, selectedGroupId, setSyncing, setLastSyncAt, setContacts, setContactTotal, setContactsError, addToast]);

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
