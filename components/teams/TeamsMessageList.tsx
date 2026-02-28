"use client";

import { useEffect, useCallback, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { useTeamsStore } from "@/stores/teams-store";
import { useAccountStore } from "@/stores/account-store";
import { TeamsMessageItem } from "./TeamsMessageItem";
import { TeamsMessageComposer } from "./TeamsMessageComposer";

export function TeamsMessageList() {
  const {
    messages,
    selectedChannelId,
    channels,
    isLoadingMessages,
    messagesError,
    messageTypeFilter,
    setMessages,
    setLoadingMessages,
    setMessagesError,
  } = useTeamsStore();

  const { activeAccountId } = useAccountStore();
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  // Apply message type filter
  const filteredMessages = messages.filter((message) => {
    if (messageTypeFilter === 'all') return true;

    if (messageTypeFilter === 'important') {
      return message.importance === 'high' || message.importance === 'urgent';
    }

    if (messageTypeFilter === 'mentions') {
      // TODO: Check if message mentions current user
      return message.mentions && message.mentions.length > 0;
    }

    if (messageTypeFilter === 'unread') {
      // TODO: Track read/unread status
      return false; // For now, no unread tracking
    }

    return true;
  });

  // Fetch messages when channel changes
  const fetchMessages = useCallback(async () => {
    if (!activeAccountId || !selectedChannelId) {
      console.log('[TeamsMessageList] Skipping fetch - missing accountId or channelId');
      return;
    }

    console.log('[TeamsMessageList] Fetching messages for channel:', selectedChannelId);

    // Cancel any pending fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setLoadingMessages(true);
    setMessagesError(null);

    try {
      const params = new URLSearchParams({
        accountId: activeAccountId,
        channelId: selectedChannelId,
        page: "1",
        limit: "50",
      });

      const response = await fetch(`/api/teams/messages?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch messages");
      }

      const data = await response.json();
      console.log('[TeamsMessageList] Fetched', data.messages?.length || 0, 'messages');
      setMessages(data.messages || []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching messages:", err);
        setMessagesError(err.message);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingMessages(false);
      }
    }
  }, [activeAccountId, selectedChannelId, setMessages, setLoadingMessages, setMessagesError]);

  useEffect(() => {
    fetchMessages();
  }, [activeAccountId, selectedChannelId, fetchMessages]);

  // Send message handler with optimistic update
  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!activeAccountId || !selectedChannelId) {
      throw new Error('No active account or channel selected');
    }

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      account_id: activeAccountId,
      channel_id: selectedChannelId,
      graph_id: '',
      body_text: messageContent,
      body_html: null,
      from_name: 'You', // Will be replaced with actual user name
      from_email: null,
      reply_to_id: null,
      reply_count: 0,
      reactions: [],
      attachments: [],
      mentions: [],
      is_deleted: false,
      importance: 'normal' as const,
      created_at: new Date().toISOString(),
      updated_at: null,
    };

    // Add optimistically
    setMessages([...messages, optimisticMessage]);

    try {
      const response = await fetch('/api/teams/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: activeAccountId,
          channelId: selectedChannelId,
          content: messageContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Refresh messages to get real data
      await fetchMessages();
    } catch (error) {
      // Remove optimistic message on failure
      setMessages(messages.filter(m => m.id !== optimisticMessage.id));
      throw error;
    }
  }, [activeAccountId, selectedChannelId, messages, setMessages, fetchMessages]);

  // Loading state
  if (isLoadingMessages) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-surface-secondary">
        <div className="flex-1 space-y-0 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 border-b border-border-subtle px-4 py-3"
            >
              <div className="h-8 w-8 animate-pulse-opacity rounded-full bg-surface-tertiary" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3.5 w-1/3 animate-pulse-opacity rounded bg-surface-tertiary" />
                <div className="h-3 w-full animate-pulse-opacity rounded bg-surface-tertiary" />
                <div className="h-3 w-3/4 animate-pulse-opacity rounded bg-surface-tertiary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (messagesError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-secondary">
        <MessageSquare size={48} className="mb-3 text-red-500" strokeWidth={1} />
        <p className="text-sm font-medium text-red-500">Error loading messages</p>
        <p className="mt-1 text-xs text-text-tertiary">{messagesError}</p>
        <button
          onClick={fetchMessages}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No channel selected
  if (!selectedChannelId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-secondary">
        <MessageSquare size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Select a channel to view messages</p>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-secondary">
        <MessageSquare size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">No messages in this channel</p>
      </div>
    );
  }

  // Messages list
  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-secondary">
      {/* Channel header */}
      {selectedChannel && (
        <div className="flex items-center justify-between border-b border-border-default bg-surface-primary px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              # {selectedChannel.channel_name}
            </h2>
            <p className="text-xs text-text-secondary">{selectedChannel.team_name}</p>
          </div>
          <span className="text-xs text-text-tertiary">
            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            {messageTypeFilter !== 'all' && ` (${messages.length} total)`}
          </span>
        </div>
      )}

      {/* Messages list */}
      <div data-testid="messages-container" className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-secondary">
              No {messageTypeFilter !== 'all' ? messageTypeFilter : ''} messages
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <TeamsMessageItem
              key={message.id}
              message={message}
              onReply={() => {
                // Reply functionality
                console.log('Reply to message:', message.id);
              }}
            />
          ))
        )}
      </div>

      {/* Message composer */}
      {selectedChannelId && (
        <TeamsMessageComposer
          channelId={selectedChannelId}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
}
