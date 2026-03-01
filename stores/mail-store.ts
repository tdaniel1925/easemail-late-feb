import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

export interface Folder {
  id: string;
  account_id: string;
  graph_id: string;
  display_name: string;
  folder_type: string | null;
  parent_graph_id: string | null;
  unread_count: number | null;
  total_count: number | null;
  is_hidden: boolean | null;
  is_favorite: boolean | null;
  sort_order: number | null;
  last_synced_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Message {
  id: string;
  account_id: string;
  folder_id: string;
  graph_id: string;
  subject: string | null;
  from_name: string | null;
  from_address: string | null;
  to_recipients: any;
  cc_recipients: any;
  bcc_recipients: any;
  preview: string | null;
  body_html: string | null;
  body_text: string | null;
  body_content_type: string | null;
  received_at: string | null;
  sent_at: string | null;
  is_read: boolean | null;
  is_flagged: boolean | null;
  is_draft: boolean | null;
  is_deleted: boolean | null;
  has_attachments: boolean | null;
  attachment_count: number | null;
  importance: string | null;
  categories: string[] | null;
  conversation_id: string | null;
  ai_summary: string | null;
  ai_category: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MailState {
  // Folders
  folders: Folder[];
  selectedFolderId: string | null;
  collapsedFolders: Set<string>;
  isLoadingFolders: boolean;
  foldersError: string | null;

  // Messages
  messages: Message[];
  selectedMessageIds: Set<string>;
  viewedMessageId: string | null;
  isLoadingMessages: boolean;
  messagesError: string | null;
  messagePage: number;
  messageTotal: number;
  hasMoreMessages: boolean;

  // Folder Actions
  setFolders: (folders: Folder[]) => void;
  setSelectedFolder: (folderId: string | null) => void;
  toggleFolderCollapse: (folderId: string) => void;
  setLoadingFolders: (isLoading: boolean) => void;
  setFoldersError: (error: string | null) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;

  // Message Actions
  setMessages: (messages: Message[]) => void;
  appendMessages: (messages: Message[]) => void;
  toggleMessageSelection: (messageId: string) => void;
  selectMessage: (messageId: string) => void;
  selectAllMessages: () => void;
  clearMessageSelection: () => void;
  setViewedMessage: (messageId: string | null) => void;
  setLoadingMessages: (isLoading: boolean) => void;
  setMessagesError: (error: string | null) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setMessagePage: (page: number) => void;
  setMessageTotal: (total: number) => void;
  setHasMoreMessages: (hasMore: boolean) => void;

  // Folder Getters
  getSelectedFolder: () => Folder | null;
  getFolderById: (folderId: string) => Folder | null;
  getChildFolders: (parentGraphId: string | null) => Folder[];
  getRootFolders: () => Folder[];

  // Message Getters
  getSelectedMessages: () => Message[];
  getMessageById: (messageId: string) => Message | null;
  getViewedMessage: () => Message | null;
}

// DISABLED PERSIST MIDDLEWARE - causing infinite loop in production
// TODO: Re-enable with proper hydration handling
export const useMailStore = create<MailState>()(
  subscribeWithSelector((set, get) => ({
    // Folder state
    folders: [],
    selectedFolderId: null,
    collapsedFolders: new Set(),
    isLoadingFolders: false,
    foldersError: null,

    // Message state
    messages: [],
    selectedMessageIds: new Set(),
    viewedMessageId: null,
    isLoadingMessages: false,
    messagesError: null,
    messagePage: 1,
    messageTotal: 0,
    hasMoreMessages: false,

    // Folder actions
    setFolders: (folders) => set({ folders }),

    setSelectedFolder: (folderId) => {
      console.log('=== STORE: setSelectedFolder called ===');
      console.log('New folder ID:', folderId);
      console.log('Previous folder ID:', get().selectedFolderId);
      set({ selectedFolderId: folderId });
      console.log('Store updated, new state:', get().selectedFolderId);
      console.log('=== STORE: setSelectedFolder end ===');
    },

    toggleFolderCollapse: (folderId) =>
      set((state) => {
        const newCollapsed = new Set(state.collapsedFolders);
        if (newCollapsed.has(folderId)) {
          newCollapsed.delete(folderId);
        } else {
          newCollapsed.add(folderId);
        }
        return { collapsedFolders: newCollapsed };
      }),

    setLoadingFolders: (isLoading) => set({ isLoadingFolders: isLoading }),

    setFoldersError: (error) => set({ foldersError: error }),

    updateFolder: (folderId, updates) =>
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === folderId ? { ...folder, ...updates } : folder
        ),
      })),

    // Message actions
    setMessages: (messages) => set({ messages, selectedMessageIds: new Set() }),

    appendMessages: (messages) =>
      set((state) => ({
        messages: [...state.messages, ...messages],
      })),

    toggleMessageSelection: (messageId) =>
      set((state) => {
        const newSelection = new Set(state.selectedMessageIds);
        if (newSelection.has(messageId)) {
          newSelection.delete(messageId);
        } else {
          newSelection.add(messageId);
        }
        return { selectedMessageIds: newSelection };
      }),

    selectMessage: (messageId) =>
      set({ selectedMessageIds: new Set([messageId]) }),

    selectAllMessages: () =>
      set((state) => ({
        selectedMessageIds: new Set(state.messages.map((m) => m.id)),
      })),

    clearMessageSelection: () => set({ selectedMessageIds: new Set() }),

    setViewedMessage: (messageId) => set({ viewedMessageId: messageId }),

    setLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

    setMessagesError: (error) => set({ messagesError: error }),

    updateMessage: (messageId, updates) =>
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      })),

    setMessagePage: (page) => set({ messagePage: page }),

    setMessageTotal: (total) => set({ messageTotal: total }),

    setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),

    // Folder getters
    getSelectedFolder: () => {
      const state = get();
      return state.folders.find((f) => f.id === state.selectedFolderId) || null;
    },

    getFolderById: (folderId) => {
      const state = get();
      return state.folders.find((f) => f.id === folderId) || null;
    },

    getChildFolders: (parentGraphId) => {
      const state = get();
      return state.folders.filter((f) => f.parent_graph_id === parentGraphId);
    },

    getRootFolders: () => {
      const state = get();

      console.log('[mail-store] getRootFolders called, total folders:', state.folders.length);

      // Find the most common parent_graph_id (this is the mailbox root)
      const parentCounts = new Map<string, number>();
      state.folders.forEach((f) => {
        if (f.parent_graph_id) {
          parentCounts.set(f.parent_graph_id, (parentCounts.get(f.parent_graph_id) || 0) + 1);
        }
      });

      console.log('[mail-store] Parent counts:', Array.from(parentCounts.entries()).map(([id, count]) => ({
        parentId: id.substring(0, 20) + '...',
        count
      })));

      // Get the parent with the most children (mailbox root)
      let mailboxRootId: string | null = null;
      let maxCount = 0;
      parentCounts.forEach((count, parentId) => {
        if (count > maxCount) {
          maxCount = count;
          mailboxRootId = parentId;
        }
      });

      console.log('[mail-store] Selected mailbox root:', mailboxRootId?.substring(0, 20) + '...', 'with', maxCount, 'folders');

      // Return all folders with that parent (top-level folders)
      const rootFolders = state.folders.filter((f) => f.parent_graph_id === mailboxRootId);
      console.log('[mail-store] Returning', rootFolders.length, 'root folders:', rootFolders.map(f => f.display_name));
      return rootFolders;
    },

    // Message getters
    getSelectedMessages: () => {
      const state = get();
      return state.messages.filter((m) => state.selectedMessageIds.has(m.id));
    },

    getMessageById: (messageId) => {
      const state = get();
      return state.messages.find((m) => m.id === messageId) || null;
    },

    getViewedMessage: () => {
      const state = get();
      if (!state.viewedMessageId) return null;
      return state.messages.find((m) => m.id === state.viewedMessageId) || null;
    },
  }))
);
