import { describe, it, expect, beforeEach } from 'vitest';
import { useContactsStore } from '@/stores/contacts-store';

describe('ContactsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { setContacts, clearContactSelection, clearFilters } = useContactsStore.getState();
    setContacts([]);
    clearContactSelection();
    clearFilters();
  });

  describe('Contact Management', () => {
    it('should set contacts', () => {
      const { setContacts, contacts } = useContactsStore.getState();

      const mockContacts = [
        {
          id: '1',
          account_id: 'acc1',
          graph_id: 'graph1',
          email: 'john@example.com',
          display_name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Acme Inc',
          job_title: 'Developer',
          phone: '555-1234',
          avatar_url: null,
          email_count: 10,
          last_emailed_at: '2024-01-01',
          source: 'graph' as const,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      setContacts(mockContacts);

      expect(useContactsStore.getState().contacts).toEqual(mockContacts);
    });

    it('should append contacts', () => {
      const { setContacts, appendContacts } = useContactsStore.getState();

      setContacts([
        {
          id: '1',
          account_id: 'acc1',
          graph_id: 'graph1',
          email: 'john@example.com',
          display_name: 'John Doe',
          first_name: null,
          last_name: null,
          company: null,
          job_title: null,
          phone: null,
          avatar_url: null,
          email_count: null,
          last_emailed_at: null,
          source: 'graph' as const,
          created_at: null,
          updated_at: null,
        },
      ]);

      appendContacts([
        {
          id: '2',
          account_id: 'acc1',
          graph_id: 'graph2',
          email: 'jane@example.com',
          display_name: 'Jane Smith',
          first_name: null,
          last_name: null,
          company: null,
          job_title: null,
          phone: null,
          avatar_url: null,
          email_count: null,
          last_emailed_at: null,
          source: 'graph' as const,
          created_at: null,
          updated_at: null,
        },
      ]);

      expect(useContactsStore.getState().contacts).toHaveLength(2);
    });

    it('should update contact', () => {
      const { setContacts, updateContact } = useContactsStore.getState();

      setContacts([
        {
          id: '1',
          account_id: 'acc1',
          graph_id: 'graph1',
          email: 'john@example.com',
          display_name: 'John Doe',
          first_name: null,
          last_name: null,
          company: 'Old Company',
          job_title: null,
          phone: null,
          avatar_url: null,
          email_count: null,
          last_emailed_at: null,
          source: 'graph' as const,
          created_at: null,
          updated_at: null,
        },
      ]);

      updateContact('1', { company: 'New Company' });

      const contact = useContactsStore.getState().contacts[0];
      expect(contact.company).toBe('New Company');
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      const { setContacts } = useContactsStore.getState();
      setContacts([
        {
          id: '1',
          account_id: 'acc1',
          graph_id: 'graph1',
          email: 'john@example.com',
          display_name: 'John Doe',
          first_name: null,
          last_name: null,
          company: null,
          job_title: null,
          phone: null,
          avatar_url: null,
          email_count: null,
          last_emailed_at: null,
          source: 'graph' as const,
          created_at: null,
          updated_at: null,
        },
        {
          id: '2',
          account_id: 'acc1',
          graph_id: 'graph2',
          email: 'jane@example.com',
          display_name: 'Jane Smith',
          first_name: null,
          last_name: null,
          company: null,
          job_title: null,
          phone: null,
          avatar_url: null,
          email_count: null,
          last_emailed_at: null,
          source: 'graph' as const,
          created_at: null,
          updated_at: null,
        },
      ]);
    });

    it('should select contact', () => {
      const { selectContact, selectedContactIds } = useContactsStore.getState();

      selectContact('1');

      expect(useContactsStore.getState().selectedContactIds.has('1')).toBe(true);
      expect(useContactsStore.getState().selectedContactIds.size).toBe(1);
    });

    it('should toggle contact selection', () => {
      const { toggleContactSelection } = useContactsStore.getState();

      toggleContactSelection('1');
      expect(useContactsStore.getState().selectedContactIds.has('1')).toBe(true);

      toggleContactSelection('1');
      expect(useContactsStore.getState().selectedContactIds.has('1')).toBe(false);
    });

    it('should select all contacts', () => {
      const { selectAllContacts } = useContactsStore.getState();

      selectAllContacts();

      expect(useContactsStore.getState().selectedContactIds.size).toBe(2);
    });

    it('should clear contact selection', () => {
      const { selectAllContacts, clearContactSelection } = useContactsStore.getState();

      selectAllContacts();
      clearContactSelection();

      expect(useContactsStore.getState().selectedContactIds.size).toBe(0);
    });

    it('should get selected contacts', () => {
      const { selectContact, getSelectedContacts } = useContactsStore.getState();

      selectContact('1');

      const selected = getSelectedContacts();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe('1');
    });
  });

  describe('Filters', () => {
    it('should set search query', () => {
      const { setSearchQuery } = useContactsStore.getState();

      setSearchQuery('john');

      expect(useContactsStore.getState().searchQuery).toBe('john');
    });

    it('should set company filter', () => {
      const { setCompanyFilter } = useContactsStore.getState();

      setCompanyFilter('Acme Inc');

      expect(useContactsStore.getState().companyFilter).toBe('Acme Inc');
    });

    it('should set source filter', () => {
      const { setSourceFilter } = useContactsStore.getState();

      setSourceFilter('graph');

      expect(useContactsStore.getState().sourceFilter).toBe('graph');
    });

    it('should clear filters', () => {
      const { setSearchQuery, setCompanyFilter, setSourceFilter, clearFilters } = useContactsStore.getState();

      setSearchQuery('john');
      setCompanyFilter('Acme');
      setSourceFilter('graph');

      clearFilters();

      expect(useContactsStore.getState().searchQuery).toBe('');
      expect(useContactsStore.getState().companyFilter).toBe(null);
      expect(useContactsStore.getState().sourceFilter).toBe(null);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoadingContacts } = useContactsStore.getState();

      setLoadingContacts(true);
      expect(useContactsStore.getState().isLoadingContacts).toBe(true);

      setLoadingContacts(false);
      expect(useContactsStore.getState().isLoadingContacts).toBe(false);
    });

    it('should set error state', () => {
      const { setContactsError } = useContactsStore.getState();

      setContactsError('Failed to fetch contacts');
      expect(useContactsStore.getState().contactsError).toBe('Failed to fetch contacts');

      setContactsError(null);
      expect(useContactsStore.getState().contactsError).toBe(null);
    });
  });

  describe('Sync State', () => {
    it('should set syncing state', () => {
      const { setSyncing } = useContactsStore.getState();

      setSyncing(true);
      expect(useContactsStore.getState().isSyncing).toBe(true);

      setSyncing(false);
      expect(useContactsStore.getState().isSyncing).toBe(false);
    });

    it('should set last sync timestamp', () => {
      const { setLastSyncAt } = useContactsStore.getState();

      const timestamp = '2024-01-01T12:00:00Z';
      setLastSyncAt(timestamp);

      expect(useContactsStore.getState().lastSyncAt).toBe(timestamp);
    });
  });
});
