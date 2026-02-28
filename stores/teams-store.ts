import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TeamsChannel {
  id: string;
  account_id: string;
  graph_team_id: string;
  graph_channel_id: string;
  team_name: string;
  channel_name: string;
  description: string | null;
  is_favorite: boolean | null;
  member_count: number | null;
  unread_count: number | null;
  last_activity_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeamsMessage {
  id: string;
  account_id: string;
  channel_id: string;
  graph_id: string;
  body_html: string | null;
  body_text: string | null;
  from_name: string | null;
  from_email: string | null;
  reply_to_id: string | null;
  reply_count: number | null;
  reactions: any[];
  attachments: any[];
  mentions: any[];
  is_deleted: boolean | null;
  importance: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string | null;
}

interface TeamsState {
  // Channels
  channels: TeamsChannel[];
  selectedChannelId: string | null;
  favoriteChannels: Set<string>;
  isLoadingChannels: boolean;
  channelsError: string | null;

  // Messages
  messages: TeamsMessage[];
  selectedMessageIds: Set<string>;
  viewedMessageId: string | null;
  isLoadingMessages: boolean;
  messagesError: string | null;
  messagePage: number;
  messageTotal: number;
  hasMoreMessages: boolean;

  // Filters
  teamIdFilter: string | null;
  showFavoritesOnly: boolean;
  messageTypeFilter: 'all' | 'important' | 'mentions' | 'unread';

  // Sync status
  isSyncing: boolean;
  lastSyncAt: string | null;

  // Channel Actions
  setChannels: (channels: TeamsChannel[]) => void;
  setSelectedChannel: (channelId: string | null) => void;
  toggleFavoriteChannel: (channelId: string) => void;
  setLoadingChannels: (isLoading: boolean) => void;
  setChannelsError: (error: string | null) => void;
  updateChannel: (channelId: string, updates: Partial<TeamsChannel>) => void;

  // Message Actions
  setMessages: (messages: TeamsMessage[]) => void;
  appendMessages: (messages: TeamsMessage[]) => void;
  toggleMessageSelection: (messageId: string) => void;
  selectMessage: (messageId: string) => void;
  selectAllMessages: () => void;
  clearMessageSelection: () => void;
  setViewedMessage: (messageId: string | null) => void;
  setLoadingMessages: (isLoading: boolean) => void;
  setMessagesError: (error: string | null) => void;
  updateMessage: (messageId: string, updates: Partial<TeamsMessage>) => void;
  setMessagePage: (page: number) => void;
  setMessageTotal: (total: number) => void;
  setHasMoreMessages: (hasMore: boolean) => void;

  // Filter Actions
  setTeamIdFilter: (teamId: string | null) => void;
  setShowFavoritesOnly: (showFavorites: boolean) => void;
  setMessageTypeFilter: (filter: 'all' | 'important' | 'mentions' | 'unread') => void;
  clearFilters: () => void;

  // Sync Actions
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (timestamp: string | null) => void;

  // Channel Getters
  getSelectedChannel: () => TeamsChannel | null;
  getChannelById: (channelId: string) => TeamsChannel | null;
  getChannelsByTeam: (teamId: string) => TeamsChannel[];
  getFavoriteChannels: () => TeamsChannel[];

  // Message Getters
  getSelectedMessages: () => TeamsMessage[];
  getMessageById: (messageId: string) => TeamsMessage | null;
  getViewedMessage: () => TeamsMessage | null;
  getMessagesByChannel: (channelId: string) => TeamsMessage[];
}

export const useTeamsStore = create<TeamsState>()(
  persist(
    (set, get) => ({
      // Channels state
      channels: [],
      selectedChannelId: null,
      favoriteChannels: new Set(),
      isLoadingChannels: false,
      channelsError: null,

      // Messages state
      messages: [],
      selectedMessageIds: new Set(),
      viewedMessageId: null,
      isLoadingMessages: false,
      messagesError: null,
      messagePage: 1,
      messageTotal: 0,
      hasMoreMessages: false,

      // Filters state
      teamIdFilter: null,
      showFavoritesOnly: false,
      messageTypeFilter: 'all',

      // Sync state
      isSyncing: false,
      lastSyncAt: null,

      // Channel actions
      setChannels: (channels) => set({ channels }),

      setSelectedChannel: (channelId) => set({ selectedChannelId: channelId }),

      toggleFavoriteChannel: (channelId) =>
        set((state) => {
          const newFavorites = new Set(state.favoriteChannels);
          if (newFavorites.has(channelId)) {
            newFavorites.delete(channelId);
          } else {
            newFavorites.add(channelId);
          }
          return { favoriteChannels: newFavorites };
        }),

      setLoadingChannels: (isLoading) => set({ isLoadingChannels: isLoading }),

      setChannelsError: (error) => set({ channelsError: error }),

      updateChannel: (channelId, updates) =>
        set((state) => ({
          channels: state.channels.map((channel) =>
            channel.id === channelId ? { ...channel, ...updates } : channel
          ),
        })),

      // Message actions
      setMessages: (messages) => set({ messages }),

      appendMessages: (messages) =>
        set((state) => ({
          messages: [...state.messages, ...messages],
        })),

      toggleMessageSelection: (messageId) =>
        set((state) => {
          const newSelected = new Set(state.selectedMessageIds);
          if (newSelected.has(messageId)) {
            newSelected.delete(messageId);
          } else {
            newSelected.add(messageId);
          }
          return { selectedMessageIds: newSelected };
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
          messages: state.messages.map((message) =>
            message.id === messageId ? { ...message, ...updates } : message
          ),
        })),

      setMessagePage: (page) => set({ messagePage: page }),

      setMessageTotal: (total) => set({ messageTotal: total }),

      setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),

      // Filter actions
      setTeamIdFilter: (teamId) => set({ teamIdFilter: teamId }),

      setShowFavoritesOnly: (showFavorites) =>
        set({ showFavoritesOnly: showFavorites }),

      setMessageTypeFilter: (filter) => set({ messageTypeFilter: filter }),

      clearFilters: () =>
        set({
          teamIdFilter: null,
          showFavoritesOnly: false,
          messageTypeFilter: 'all',
        }),

      // Sync actions
      setSyncing: (isSyncing) => set({ isSyncing }),

      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

      // Channel getters
      getSelectedChannel: () => {
        const { channels, selectedChannelId } = get();
        return (
          channels.find((channel) => channel.id === selectedChannelId) || null
        );
      },

      getChannelById: (channelId) => {
        const { channels } = get();
        return channels.find((channel) => channel.id === channelId) || null;
      },

      getChannelsByTeam: (teamId) => {
        const { channels } = get();
        return channels.filter((channel) => channel.graph_team_id === teamId);
      },

      getFavoriteChannels: () => {
        const { channels, favoriteChannels } = get();
        return channels.filter((channel) => favoriteChannels.has(channel.id));
      },

      // Message getters
      getSelectedMessages: () => {
        const { messages, selectedMessageIds } = get();
        return messages.filter((message) => selectedMessageIds.has(message.id));
      },

      getMessageById: (messageId) => {
        const { messages } = get();
        return messages.find((message) => message.id === messageId) || null;
      },

      getViewedMessage: () => {
        const { messages, viewedMessageId } = get();
        return (
          messages.find((message) => message.id === viewedMessageId) || null
        );
      },

      getMessagesByChannel: (channelId) => {
        const { messages } = get();
        return messages.filter((message) => message.channel_id === channelId);
      },
    }),
    {
      name: 'teams-store',
      partialize: (state) => ({
        selectedChannelId: state.selectedChannelId,
        favoriteChannels: state.favoriteChannels,
        teamIdFilter: state.teamIdFilter,
        showFavoritesOnly: state.showFavoritesOnly,
        messageTypeFilter: state.messageTypeFilter,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
