"use client";

import { useEffect, useCallback, useState } from "react";
import { Mail, RefreshCw, Filter, CloudDownload } from "lucide-react";
import { useMailStore } from "@/stores/mail-store";
import { useAccountStore } from "@/stores/account-store";
import { MessageListItem } from "./MessageListItem";
import { MessageListToolbar } from "./MessageListToolbar";

export function MessageList() {
  const {
    messages,
    selectedMessageIds,
    selectedFolderId,
    isLoadingMessages,
    messagesError,
    setMessages,
    toggleMessageSelection,
    selectMessage,
    setViewedMessage,
    setLoadingMessages,
    setMessagesError,
    selectAllMessages,
    clearMessageSelection,
  } = useMailStore();

  const { activeAccountId } = useAccountStore();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch messages when account or folder changes
  useEffect(() => {
    if (activeAccountId && selectedFolderId) {
      fetchMessages();
    }
  }, [activeAccountId, selectedFolderId]);

  const fetchMessages = async () => {
    if (!activeAccountId) return;

    setLoadingMessages(true);
    setMessagesError(null);

    try {
      const params = new URLSearchParams({
        accountId: activeAccountId,
        ...(selectedFolderId && { folderId: selectedFolderId }),
        page: "1",
        limit: "50",
      });

      const response = await fetch(`/api/mail/messages?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setMessagesError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMessageSelect = useCallback(
    (messageId: string, isCheckbox: boolean) => {
      if (isCheckbox) {
        // Checkbox click - toggle selection for bulk actions
        toggleMessageSelection(messageId);
      } else {
        // Row click - view message in reading pane
        setViewedMessage(messageId);
      }
    },
    [toggleMessageSelection, setViewedMessage]
  );

  const handleRefresh = () => {
    fetchMessages();
  };

  const handleReSync = async () => {
    if (!activeAccountId || isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`/api/sync/account?accountId=${activeAccountId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync messages');
      }

      // Refresh messages after sync completes
      await fetchMessages();
      alert('Messages re-synced successfully with full content!');
    } catch (err: any) {
      console.error('Error syncing messages:', err);
      alert(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedMessageIds.size === messages.length) {
      clearMessageSelection();
    } else {
      selectAllMessages();
    }
  };

  // Loading state
  if (isLoadingMessages) {
    return (
      <div className="flex h-full flex-col bg-surface-primary">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <div className="h-5 w-24 animate-pulse-opacity rounded bg-surface-tertiary" />
          <div className="h-8 w-8 animate-pulse-opacity rounded bg-surface-tertiary" />
        </div>
        <div className="flex-1 space-y-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 border-b border-border-subtle px-4 py-2"
              style={{ height: "72px" }}
            >
              <div className="h-4 w-4 animate-pulse-opacity rounded bg-surface-tertiary" />
              <div className="h-7 w-7 animate-pulse-opacity rounded-full bg-surface-tertiary" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-3/4 animate-pulse-opacity rounded bg-surface-tertiary" />
                <div className="h-3 w-full animate-pulse-opacity rounded bg-surface-tertiary" />
                <div className="h-2 w-5/6 animate-pulse-opacity rounded bg-surface-tertiary" />
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
      <div className="flex h-full flex-col bg-surface-primary">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Messages</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Mail size={48} className="mx-auto mb-3 text-text-tertiary" strokeWidth={1} />
            <p className="text-sm text-red-500">Error loading messages</p>
            <p className="mt-1 text-xs text-text-tertiary">{messagesError}</p>
            <button
              onClick={fetchMessages}
              className="mt-4 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No account selected
  if (!activeAccountId) {
    return (
      <div className="flex h-full flex-col bg-surface-primary">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Messages</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Mail size={48} className="mx-auto mb-3 text-text-tertiary" strokeWidth={1} />
            <p className="text-sm text-text-secondary">Select an account to view messages</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col bg-surface-primary">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Inbox</h2>
          <button
            onClick={handleRefresh}
            className="rounded-md p-1.5 transition-colors hover:bg-surface-tertiary"
            title="Refresh"
          >
            <RefreshCw size={16} className="text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Mail size={48} className="mx-auto mb-3 text-text-tertiary" strokeWidth={1} />
            <p className="text-sm font-medium text-text-primary">No messages</p>
            <p className="mt-1 text-xs text-text-tertiary">This folder is empty</p>
          </div>
        </div>
      </div>
    );
  }

  // Message list
  return (
    <div className="flex h-full flex-col bg-surface-primary">
      {/* Header - cleaner, denser */}
      <div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-border-default px-3">
        <span className="text-sm font-medium text-text-primary">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleReSync}
            disabled={isSyncing}
            className="rounded p-1.5 transition-colors hover:bg-surface-tertiary disabled:opacity-50"
            title="Re-Sync with Full Content"
          >
            <CloudDownload size={14} className={isSyncing ? "animate-pulse text-accent" : "text-text-secondary"} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleRefresh}
            className="rounded p-1.5 transition-colors hover:bg-surface-tertiary"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Message list - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <MessageListItem
            key={message.id}
            message={message}
            isSelected={selectedMessageIds.has(message.id)}
            onSelect={handleMessageSelect}
          />
        ))}
      </div>
    </div>
  );
}
