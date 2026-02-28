import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { Contact, ContactGroup } from '@/types/contacts';

type SortField = 'name' | 'email' | 'company' | 'lastEmailed' | 'created';
type SortOrder = 'asc' | 'desc';

interface ContactsState {
  // Contacts
  contacts: Contact[];
  selectedContactIds: Set<string>;
  viewedContactId: string | null;
  isLoadingContacts: boolean;
  contactsError: string | null;
  contactPage: number;
  contactTotal: number;
  hasMoreContacts: boolean;

  // Contact Groups
  groups: ContactGroup[];
  selectedGroupId: string | null;
  isLoadingGroups: boolean;
  groupsError: string | null;

  // Editor
  editorMode: 'create' | 'edit' | null;
  editingContactId: string | null;

  // Filters
  searchQuery: string;
  companyFilter: string | null;
  sourceFilter: 'graph' | 'manual' | 'inferred' | null;
  favoriteFilter: boolean | null;
  sortField: SortField;
  sortOrder: SortOrder;

  // Sync status
  isSyncing: boolean;
  lastSyncAt: string | null;

  // Contact Actions
  setContacts: (contacts: Contact[]) => void;
  appendContacts: (contacts: Contact[]) => void;
  toggleContactSelection: (contactId: string) => void;
  selectContact: (contactId: string) => void;
  selectAllContacts: () => void;
  clearContactSelection: () => void;
  setViewedContact: (contactId: string | null) => void;
  setLoadingContacts: (isLoading: boolean) => void;
  setContactsError: (error: string | null) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  setContactPage: (page: number) => void;
  setContactTotal: (total: number) => void;
  setHasMoreContacts: (hasMore: boolean) => void;

  // Group Actions
  setGroups: (groups: ContactGroup[]) => void;
  setSelectedGroup: (groupId: string | null) => void;
  setLoadingGroups: (isLoading: boolean) => void;
  setGroupsError: (error: string | null) => void;
  updateGroup: (groupId: string, updates: Partial<ContactGroup>) => void;

  // Editor Actions
  openEditor: (mode: 'create' | 'edit', contactId?: string) => void;
  closeEditor: () => void;

  // Filter Actions
  setSearchQuery: (query: string) => void;
  setCompanyFilter: (company: string | null) => void;
  setSourceFilter: (source: 'graph' | 'manual' | 'inferred' | null) => void;
  setFavoriteFilter: (isFavorite: boolean | null) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  clearFilters: () => void;

  // Sync Actions
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (timestamp: string | null) => void;

  // Contact Getters
  getSelectedContacts: () => Contact[];
  getContactById: (contactId: string) => Contact | null;
  getViewedContact: () => Contact | null;
  getFilteredContacts: () => Contact[];
  getSelectedGroup: () => ContactGroup | null;
}

export const useContactsStore = create<ContactsState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Contacts state
        contacts: [],
        selectedContactIds: new Set(),
        viewedContactId: null,
        isLoadingContacts: false,
        contactsError: null,
        contactPage: 1,
        contactTotal: 0,
        hasMoreContacts: false,

        // Groups state
        groups: [],
        selectedGroupId: null,
        isLoadingGroups: false,
        groupsError: null,

        // Editor state
        editorMode: null,
        editingContactId: null,

        // Filters state
        searchQuery: '',
        companyFilter: null,
        sourceFilter: null,
        favoriteFilter: null,
        sortField: 'name' as SortField,
        sortOrder: 'asc' as SortOrder,

        // Sync state
        isSyncing: false,
        lastSyncAt: null,

      // Contact actions
      setContacts: (contacts) => set({ contacts }),

      appendContacts: (contacts) =>
        set((state) => ({
          contacts: [...state.contacts, ...contacts],
        })),

      toggleContactSelection: (contactId) =>
        set((state) => {
          const newSelected = new Set(state.selectedContactIds);
          if (newSelected.has(contactId)) {
            newSelected.delete(contactId);
          } else {
            newSelected.add(contactId);
          }
          return { selectedContactIds: newSelected };
        }),

      selectContact: (contactId) =>
        set({ selectedContactIds: new Set([contactId]) }),

      selectAllContacts: () =>
        set((state) => ({
          selectedContactIds: new Set(state.contacts.map((c) => c.id)),
        })),

      clearContactSelection: () => set({ selectedContactIds: new Set() }),

      setViewedContact: (contactId) => set({ viewedContactId: contactId }),

      setLoadingContacts: (isLoading) => set({ isLoadingContacts: isLoading }),

      setContactsError: (error) => set({ contactsError: error }),

      updateContact: (contactId, updates) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === contactId ? { ...contact, ...updates } : contact
          ),
        })),

      setContactPage: (page) => set({ contactPage: page }),

      setContactTotal: (total) => set({ contactTotal: total }),

      setHasMoreContacts: (hasMore) => set({ hasMoreContacts: hasMore }),

      // Group actions
      setGroups: (groups) => set({ groups }),

      setSelectedGroup: (groupId) => set({ selectedGroupId: groupId }),

      setLoadingGroups: (isLoading) => set({ isLoadingGroups: isLoading }),

      setGroupsError: (error) => set({ groupsError: error }),

      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          ),
        })),

      // Editor actions
      openEditor: (mode, contactId) =>
        set({
          editorMode: mode,
          editingContactId: contactId || null,
        }),

      closeEditor: () =>
        set({
          editorMode: null,
          editingContactId: null,
        }),

      // Filter actions
      setSearchQuery: (query) => set({ searchQuery: query }),

      setCompanyFilter: (company) => set({ companyFilter: company }),

      setSourceFilter: (source) => set({ sourceFilter: source }),

      setFavoriteFilter: (isFavorite) => set({ favoriteFilter: isFavorite }),

      setSortField: (field) => set({ sortField: field }),

      setSortOrder: (order) => set({ sortOrder: order }),

      clearFilters: () =>
        set({
          searchQuery: '',
          companyFilter: null,
          sourceFilter: null,
          favoriteFilter: null,
          selectedGroupId: null,
          sortField: 'name',
          sortOrder: 'asc',
        }),

      // Sync actions
      setSyncing: (isSyncing) => set({ isSyncing }),

      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

      // Contact getters
      getSelectedContacts: () => {
        const { contacts, selectedContactIds } = get();
        return contacts.filter((contact) => selectedContactIds.has(contact.id));
      },

      getContactById: (contactId) => {
        const { contacts } = get();
        return contacts.find((contact) => contact.id === contactId) || null;
      },

      getViewedContact: () => {
        const { contacts, viewedContactId } = get();
        return (
          contacts.find((contact) => contact.id === viewedContactId) || null
        );
      },

      getFilteredContacts: () => {
        const {
          contacts,
          searchQuery,
          companyFilter,
          sourceFilter,
          favoriteFilter,
          selectedGroupId,
          sortField,
          sortOrder,
        } = get();

        let filtered = [...contacts];

        // Apply search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (contact) =>
              contact.display_name?.toLowerCase().includes(query) ||
              contact.email.toLowerCase().includes(query) ||
              contact.first_name?.toLowerCase().includes(query) ||
              contact.last_name?.toLowerCase().includes(query) ||
              contact.company?.toLowerCase().includes(query)
          );
        }

        // Apply company filter
        if (companyFilter) {
          filtered = filtered.filter(
            (contact) => contact.company === companyFilter
          );
        }

        // Apply source filter
        if (sourceFilter) {
          filtered = filtered.filter(
            (contact) => contact.source === sourceFilter
          );
        }

        // Apply favorite filter
        if (favoriteFilter !== null) {
          filtered = filtered.filter(
            (contact) => contact.is_favorite === favoriteFilter
          );
        }

        // Apply group filter (would need to join with contact_group_members)
        // This is a placeholder - actual implementation would query the database
        // For now, this just shows the pattern
        if (selectedGroupId) {
          // TODO: Filter by group membership when implementing group features
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortField) {
            case 'name':
              aValue = a.display_name || a.email;
              bValue = b.display_name || b.email;
              break;
            case 'email':
              aValue = a.email;
              bValue = b.email;
              break;
            case 'company':
              aValue = a.company || '';
              bValue = b.company || '';
              break;
            case 'lastEmailed':
              aValue = a.last_emailed_at || '';
              bValue = b.last_emailed_at || '';
              break;
            case 'created':
              aValue = a.created_at || '';
              bValue = b.created_at || '';
              break;
            default:
              return 0;
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        });

        return filtered;
      },

      getSelectedGroup: () => {
        const { groups, selectedGroupId } = get();
        return groups.find((group) => group.id === selectedGroupId) || null;
      },
      }),
      {
        name: 'contacts-store',
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          companyFilter: state.companyFilter,
          sourceFilter: state.sourceFilter,
          favoriteFilter: state.favoriteFilter,
          selectedGroupId: state.selectedGroupId,
          sortField: state.sortField,
          sortOrder: state.sortOrder,
          lastSyncAt: state.lastSyncAt,
        }),
      }
    )
  )
);
