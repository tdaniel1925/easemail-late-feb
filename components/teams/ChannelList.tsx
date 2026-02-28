"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { Hash, Star, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamsStore } from "@/stores/teams-store";
import { useAccountStore } from "@/stores/account-store";

export function ChannelList() {
  const {
    channels,
    selectedChannelId,
    isLoadingChannels,
    channelsError,
    teamIdFilter,
    showFavoritesOnly,
    setChannels,
    setSelectedChannel,
    toggleFavoriteChannel,
    setLoadingChannels,
    setChannelsError,
  } = useTeamsStore();

  const { activeAccountId } = useAccountStore();
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch channels when account changes
  const fetchChannels = useCallback(async () => {
    if (!activeAccountId) {
      console.log('[ChannelList] Skipping fetch - missing accountId');
      setChannels([]);
      setChannelsError(null);
      return;
    }

    console.log('[ChannelList] Fetching channels');

    // Cancel any pending fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setLoadingChannels(true);
    setChannelsError(null);

    try {
      const params = new URLSearchParams({
        accountId: activeAccountId,
      });

      if (teamIdFilter) {
        params.append('teamId', teamIdFilter);
      }

      if (showFavoritesOnly) {
        params.append('isFavorite', 'true');
      }

      const response = await fetch(`/api/teams/channels?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch channels");
      }

      const data = await response.json();
      console.log('[ChannelList] Fetched', data.channels?.length || 0, 'channels');
      setChannels(data.channels || []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching channels:", err);
        setChannelsError(err.message);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingChannels(false);
      }
    }
  }, [activeAccountId, teamIdFilter, showFavoritesOnly, setChannels, setLoadingChannels, setChannelsError]);

  useEffect(() => {
    fetchChannels();
  }, [activeAccountId, teamIdFilter, showFavoritesOnly, fetchChannels]);

  const handleChannelClick = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  const handleFavoriteClick = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    toggleFavoriteChannel(channelId);
  };

  // Filter channels by search query
  const filteredChannels = searchQuery
    ? channels.filter((channel) =>
        channel.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.team_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : channels;

  // Group channels by team
  const groupedChannels: { [teamId: string]: { teamName: string; channels: any[] } } = {};
  filteredChannels.forEach((channel) => {
    if (!groupedChannels[channel.graph_team_id]) {
      groupedChannels[channel.graph_team_id] = {
        teamName: channel.team_name,
        channels: [],
      };
    }
    groupedChannels[channel.graph_team_id].channels.push(channel);
  });

  // Loading state
  if (isLoadingChannels) {
    return (
      <div className="space-y-1 px-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-8 animate-pulse-opacity rounded-md bg-surface-tertiary"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (channelsError) {
    return (
      <div className="px-2 py-2 text-xs text-red-500">
        Error loading channels: {channelsError}
      </div>
    );
  }

  // No account selected
  if (!activeAccountId) {
    return (
      <div className="px-2 py-2 text-center text-xs text-text-tertiary">
        Select an account to view channels
      </div>
    );
  }

  // Empty state
  if (channels.length === 0) {
    return (
      <div className="px-2 py-2 text-center text-xs text-text-tertiary">
        No channels found
      </div>
    );
  }

  // Render channels grouped by team
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="px-2 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <input
            data-testid="channels-search"
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-7 pl-8 pr-3 text-xs",
              "bg-bg-secondary border border-border-default rounded",
              "placeholder:text-text-secondary",
              "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* Channels list */}
      <div className="px-2 space-y-4">
        {Object.entries(groupedChannels).map(([teamId, { teamName, channels: teamChannels }]) => (
        <div key={teamId}>
          {/* Team header */}
          <div data-testid="team-item" className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            {teamName}
          </div>

          {/* Channels */}
          <div className="space-y-0.5">
            {teamChannels.map((channel) => {
              const isActive = channel.id === selectedChannelId;

              return (
                <button
                  data-testid="channel-item"
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`group mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                    isActive
                      ? "bg-surface-tertiary"
                      : "hover:bg-surface-tertiary"
                  }`}
                >
                  {/* Channel icon */}
                  <span className={isActive ? "text-text-primary" : "text-text-tertiary"}>
                    <Hash size={15} strokeWidth={1.5} />
                  </span>

                  {/* Channel name */}
                  <span
                    className={`flex-1 text-xs ${
                      isActive ? "text-text-primary font-medium" : "text-text-secondary"
                    }`}
                  >
                    {channel.channel_name}
                  </span>

                  {/* Unread badge */}
                  {(channel.unread_count || 0) > 0 && (
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {channel.unread_count}
                    </span>
                  )}

                  {/* Favorite star */}
                  <button
                    data-testid="favorite-channel"
                    onClick={(e) => handleFavoriteClick(e, channel.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-yellow-500"
                  >
                    <Star
                      data-testid={channel.is_favorite ? "favorite-icon" : undefined}
                      size={12}
                      strokeWidth={1.5}
                      fill={channel.is_favorite ? "currentColor" : "none"}
                      className={channel.is_favorite ? "text-yellow-500" : ""}
                    />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
