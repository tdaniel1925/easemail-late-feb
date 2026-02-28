import { describe, it, expect, beforeEach } from 'vitest';
import { useTeamsStore } from '@/stores/teams-store';

describe('TeamsStore', () => {
  beforeEach(() => {
    const { setChannels, setMessages, clearMessageSelection, clearFilters } = useTeamsStore.getState();
    setChannels([]);
    setMessages([]);
    clearMessageSelection();
    clearFilters();
  });

  it('should set channels', () => {
    const { setChannels } = useTeamsStore.getState();

    const mockChannels = [
      {
        id: '1',
        account_id: 'acc1',
        graph_team_id: 'team1',
        graph_channel_id: 'channel1',
        team_name: 'Engineering Team',
        channel_name: 'General',
        description: 'General discussion',
        is_favorite: false,
        member_count: 10,
        unread_count: 5,
        last_activity_at: '2024-01-01',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    setChannels(mockChannels);
    expect(useTeamsStore.getState().channels).toEqual(mockChannels);
  });

  it('should set messages', () => {
    const { setMessages } = useTeamsStore.getState();

    const mockMessages = [
      {
        id: '1',
        account_id: 'acc1',
        channel_id: 'channel1',
        graph_id: 'msg1',
        body_html: '<p>Hello team</p>',
        body_text: 'Hello team',
        from_name: 'John Doe',
        from_email: 'john@example.com',
        reply_to_id: null,
        reply_count: 0,
        reactions: [],
        attachments: [],
        mentions: [],
        is_deleted: false,
        importance: 'normal' as const,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
    ];

    setMessages(mockMessages);
    expect(useTeamsStore.getState().messages).toEqual(mockMessages);
  });

  it('should select channel', () => {
    const { setSelectedChannel } = useTeamsStore.getState();

    setSelectedChannel('channel1');
    expect(useTeamsStore.getState().selectedChannelId).toBe('channel1');
  });

  it('should toggle favorite channel', () => {
    const { toggleFavoriteChannel } = useTeamsStore.getState();

    toggleFavoriteChannel('channel1');
    expect(useTeamsStore.getState().favoriteChannels.has('channel1')).toBe(true);

    toggleFavoriteChannel('channel1');
    expect(useTeamsStore.getState().favoriteChannels.has('channel1')).toBe(false);
  });

  it('should get channels by team', () => {
    const { setChannels, getChannelsByTeam } = useTeamsStore.getState();

    setChannels([
      {
        id: '1',
        account_id: 'acc1',
        graph_team_id: 'team1',
        graph_channel_id: 'channel1',
        team_name: 'Engineering',
        channel_name: 'General',
        description: null,
        is_favorite: null,
        member_count: null,
        unread_count: null,
        last_activity_at: null,
        created_at: null,
        updated_at: null,
      },
      {
        id: '2',
        account_id: 'acc1',
        graph_team_id: 'team1',
        graph_channel_id: 'channel2',
        team_name: 'Engineering',
        channel_name: 'Dev',
        description: null,
        is_favorite: null,
        member_count: null,
        unread_count: null,
        last_activity_at: null,
        created_at: null,
        updated_at: null,
      },
      {
        id: '3',
        account_id: 'acc1',
        graph_team_id: 'team2',
        graph_channel_id: 'channel3',
        team_name: 'Marketing',
        channel_name: 'General',
        description: null,
        is_favorite: null,
        member_count: null,
        unread_count: null,
        last_activity_at: null,
        created_at: null,
        updated_at: null,
      },
    ]);

    const team1Channels = getChannelsByTeam('team1');
    expect(team1Channels).toHaveLength(2);
  });
});
