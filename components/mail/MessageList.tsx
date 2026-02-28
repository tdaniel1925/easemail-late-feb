"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { shallow } from "zustand/shallow";
import { Mail, RefreshCw, Filter, CloudDownload } from "lucide-react";
import { useMailStore } from "@/stores/mail-store";
import { useAccountStore } from "@/stores/account-store";
import { MessageListItem } from "./MessageListItem";
import { MessageListToolbar } from "./MessageListToolbar";
import { toast } from "@/lib/toast";

export function MessageList() {
  console.log('[MessageList] Component rendering...');

  // PERFORMANCE: Use shallow comparison to prevent unnecessary re-renders
  // Only re-render when these specific values actually change
  const {
    selectedFolderId,
    messages,
    selectedMessageIds,
    isLoadingMessages,
    messagesError,
    folders,
  } = useMailStore(
    (state) => ({
      selectedFolderId: state.selectedFolderId,
      messages: state.messages,
      selectedMessageIds: state.selectedMessageIds,
      isLoadingMessages: state.isLoadingMessages,
      messagesError: state.messagesError,
      folders: state.folders,
    }),
    shallow
  );

  console.log('[MessageList] Current selectedFolderId from store:', selectedFolderId);

  const setMessages = useMailStore((state) => state.setMessages);
  const appendMessages = useMailStore((state) => state.appendMessages);
  const toggleMessageSelection = useMailStore((state) => state.toggleMessageSelection);
  const selectMessage = useMailStore((state) => state.selectMessage);
  const setViewedMessage = useMailStore((state) => state.setViewedMessage);
  const setLoadingMessages = useMailStore((state) => state.setLoadingMessages);
  const setMessagesError = useMailStore((state) => state.setMessagesError);
  const selectAllMessages = useMailStore((state) => state.selectAllMessages);
  const clearMessageSelection = useMailStore((state) => state.clearMessageSelection);

  const { activeAccountId } = useAccountStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ensure messages is always an array (defensive programming for store rehydration)
  const messagesList = Array.isArray(messages) ? messages : [];

  // Get current folder to display total count
  const currentFolder = folders.find((f) => f.id === selectedFolderId);
  const totalMessages = currentFolder?.total_count || 0;

  // Ref to track the current fetch AbortController
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!activeAccountId || !selectedFolderId) {
      console.log('[MessageList] Skipping fetch - missing accountId or folderId', { activeAccountId, selectedFolderId });
      return;
    }

    console.log('[MessageList] Fetching messages for folder:', selectedFolderId);

    // Cancel any pending fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setLoadingMessages(true);
    setMessagesError(null);
    setCurrentPage(1);
    setHasMore(true);

    try {
      const params = new URLSearchParams({
        accountId: activeAccountId,
        ...(selectedFolderId && { folderId: selectedFolderId }),
        page: "1",
        limit: "50",
      });

      const response = await fetch(`/api/mail/messages?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch messages");
      }

      const data = await response.json();
      console.log('[MessageList] Fetched', data.messages?.length || 0, 'messages');
      setMessages(data.messages || []);

      // Check if there are more messages
      if (data.pagination) {
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        // If no pagination data, assume no more messages if less than 50
        setHasMore((data.messages || []).length >= 50);
      }
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
  }, [activeAccountId, selectedFolderId, setMessages, setLoadingMessages, setMessagesError]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeAccountId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({
        accountId: activeAccountId,
        ...(selectedFolderId && { folderId: selectedFolderId }),
        page: String(nextPage),
        limit: "50",
      });

      const response = await fetch(`/api/mail/messages?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load more messages");
      }

      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        appendMessages(data.messages);
        setCurrentPage(nextPage);

        // Check if there are more messages
        if (data.pagination) {
          setHasMore(data.pagination.page < data.pagination.pages);
        } else {
          setHasMore(data.messages.length >= 50);
        }
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Error loading more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeAccountId, currentPage, hasMore, isLoadingMore, selectedFolderId, appendMessages]);

  // Fetch messages when account or folder changes
  // DO NOT include fetchMessages in dependencies - it causes issues with re-renders
  useEffect(() => {
    console.log('=== MESSAGE LIST EFFECT TRIGGERED ===');
    console.log('activeAccountId:', activeAccountId);
    console.log('selectedFolderId:', selectedFolderId);
    console.log('Will fetch:', !!(activeAccountId && selectedFolderId));

    if (activeAccountId && selectedFolderId) {
      console.log('Calling fetchMessages now...');
      fetchMessages();
    } else {
      console.log('Skipping fetch - missing accountId or folderId');
    }
    console.log('=== MESSAGE LIST EFFECT END ===');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId, selectedFolderId]);

  // Auto-refresh messages every 30 seconds for real-time updates
  // PERFORMANCE: Changed from 3s to 30s to reduce API load and prevent excessive re-renders
  // Fetches ALL loaded pages to preserve scroll position and pagination state
  useEffect(() => {
    if (!activeAccountId || !selectedFolderId) return;

    // AbortController to cancel pending requests when dependencies change
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const intervalId = setInterval(() => {
      // Silent refresh - don't show loading state
      const silentFetch = async () => {
        try {
          // Save scroll position before refresh
          const scrollTop = scrollContainerRef.current?.scrollTop || 0;

          // Fetch all pages that are currently loaded (1 through currentPage)
          const pagePromises = [];
          for (let page = 1; page <= currentPage; page++) {
            const params = new URLSearchParams({
              accountId: activeAccountId,
              ...(selectedFolderId && { folderId: selectedFolderId }),
              page: String(page),
              limit: "50",
            });
            pagePromises.push(
              fetch(`/api/mail/messages?${params}`, { signal: abortController.signal })
                .then(r => r.json())
            );
          }

          const results = await Promise.all(pagePromises);

          // Combine all messages from all pages
          const allMessages = results.flatMap(data => data.messages || []);
          setMessages(allMessages);

          // Update hasMore status from the last page
          const lastPageData = results[results.length - 1];
          if (lastPageData?.pagination) {
            setHasMore(lastPageData.pagination.page < lastPageData.pagination.pages);
          }

          // Restore scroll position after DOM update
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollTop;
            }
          });
        } catch (err: any) {
          // Silent fail for aborted requests - don't disrupt user experience
          if (err.name !== 'AbortError') {
            console.error("Background refresh failed:", err);
          }
        }
      };

      silentFetch();
    }, 30000); // Refresh every 30 seconds (was 3s - reduced for performance)

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      abortController.abort(); // Cancel pending requests when unmounting or dependencies change
    };
  }, [activeAccountId, selectedFolderId, currentPage, setMessages]);

  // Scroll detection for infinite scroll
  // PERFORMANCE: Debounced to prevent excessive function calls
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll detection (100ms)
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (isNearBottom && hasMore && !isLoadingMore && !isLoadingMessages) {
          loadMoreMessages();
        }
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, isLoadingMessages]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (messagesList.length === 0) return;

      const currentIndex = messagesList.findIndex((m) => m.id === selectedMessageIds.values().next().value);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Navigate to next message
          if (currentIndex < messagesList.length - 1) {
            const nextMessage = messagesList[currentIndex + 1];
            setViewedMessage(nextMessage.id);
            // Scroll message into view
            document.getElementById(`message-${nextMessage.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          // Navigate to previous message
          if (currentIndex > 0) {
            const prevMessage = messagesList[currentIndex - 1];
            setViewedMessage(prevMessage.id);
            // Scroll message into view
            document.getElementById(`message-${prevMessage.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
          break;

        case 'Enter':
          // View currently selected message (if checkbox selected)
          if (selectedMessageIds.size === 1) {
            const messageId = selectedMessageIds.values().next().value;
            setViewedMessage(messageId);
          }
          break;

        case 'e':
        case 'E':
          // Archive selected message(s)
          e.preventDefault();
          if (selectedMessageIds.size > 0) {
            selectedMessageIds.forEach(async (messageId) => {
              try {
                await fetch(`/api/mail/messages/${messageId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "archive" }),
                });
              } catch (err) {
                console.error("Error archiving message:", err);
              }
            });
            toast.success({
              title: `${selectedMessageIds.size} message(s) archived`,
            });
            clearMessageSelection();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messagesList, selectedMessageIds, setViewedMessage, clearMessageSelection]);

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
      toast.success({
        title: 'Sync complete',
        description: 'Messages re-synced successfully with full content',
      });
    } catch (err: any) {
      console.error('Error syncing messages:', err);
      toast.error({
        title: 'Sync failed',
        description: err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedMessageIds.size === messagesList.length) {
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
  if (messagesList.length === 0) {
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
          {totalMessages > 0
            ? `${messagesList.length.toLocaleString()} of ${totalMessages.toLocaleString()} ${totalMessages === 1 ? "message" : "messages"}`
            : `${messagesList.length} ${messagesList.length === 1 ? "message" : "messages"}`
          }
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

      {/* Multi-select toolbar - shows when messages are selected */}
      <MessageListToolbar onRefresh={handleRefresh} />

      {/* Message list - scrollable */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {messagesList.map((message) => (
          <MessageListItem
            key={message.id}
            message={message}
            isSelected={selectedMessageIds.has(message.id)}
            onSelect={handleMessageSelect}
          />
        ))}

        {/* Loading indicator for infinite scroll */}
        {isLoadingMore && (
          <div className="flex items-center justify-center border-t border-border-subtle py-4">
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
              <span>Loading more messages...</span>
            </div>
          </div>
        )}

        {/* End of messages indicator */}
        {!hasMore && messagesList.length > 0 && (
          <div className="flex items-center justify-center border-t border-border-subtle py-4">
            <p className="text-xs text-text-tertiary">No more messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
