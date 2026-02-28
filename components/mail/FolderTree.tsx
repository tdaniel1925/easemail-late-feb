"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  Send,
  FileEdit,
  Trash2,
  Archive,
  Folder,
  Star,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useMailStore, type Folder as FolderType } from "@/stores/mail-store";
import { useAccountStore } from "@/stores/account-store";

interface FolderTreeProps {
  accountId?: string;
}

export function FolderTree({ accountId }: FolderTreeProps) {
  const router = useRouter();

  const {
    folders,
    selectedFolderId,
    collapsedFolders,
    isLoadingFolders,
    isLoadingMessages,
    foldersError,
    setFolders,
    setSelectedFolder,
    toggleFolderCollapse,
    setLoadingFolders,
    setFoldersError,
    getRootFolders,
    getChildFolders,
  } = useMailStore();

  const { activeAccountId } = useAccountStore();

  // Use provided accountId or fall back to active account
  const currentAccountId = accountId || activeAccountId;

  // Ref to track the current fetch AbortController
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch folders when account changes
  useEffect(() => {
    if (currentAccountId) {
      fetchFolders(currentAccountId);
    }
  }, [currentAccountId]);

  // Auto-refresh folder counts every 5 seconds for real-time updates
  // Uses AbortController to prevent race conditions
  useEffect(() => {
    if (!currentAccountId) return;

    const abortController = new AbortController();

    const intervalId = setInterval(() => {
      // Silent refresh - don't show loading state
      const silentFetch = async () => {
        try {
          const response = await fetch(`/api/mail/folders?accountId=${currentAccountId}`, {
            signal: abortController.signal,
          });
          if (!response.ok) return;

          const data = await response.json();
          setFolders(data.folders || []);
        } catch (err: any) {
          // Silent fail for aborted requests - don't disrupt user experience
          if (err.name !== 'AbortError') {
            console.error("Background folder refresh failed:", err);
          }
        }
      };

      silentFetch();
    }, 5000); // Refresh every 5 seconds (less aggressive than message refresh)

    return () => {
      clearInterval(intervalId);
      abortController.abort(); // Cancel pending requests
    };
  }, [currentAccountId, setFolders]);

  const fetchFolders = async (accId: string) => {
    // Cancel any pending fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setLoadingFolders(true);
    setFoldersError(null);

    try {
      const response = await fetch(`/api/mail/folders?accountId=${accId}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch folders");
      }

      const data = await response.json();
      setFolders(data.folders || []);

      // Always auto-select inbox when account changes (better UX than keeping old folder selected)
      if (data.folders.length > 0) {
        const inbox = data.folders.find(
          (f: FolderType) =>
            f.display_name === "Inbox" ||
            f.folder_type === "inbox"
        );
        if (inbox) {
          setSelectedFolder(inbox.id);
        } else {
          // Fallback to first folder if no inbox found
          setSelectedFolder(data.folders[0].id);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching folders:", err);
        setFoldersError(err.message);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingFolders(false);
      }
    }
  };

  const getFolderIcon = (folder: FolderType) => {
    const displayName = folder.display_name.toLowerCase();
    const size = 15;
    const strokeWidth = 1.5;

    // Check by folder_type first, then fall back to display_name
    if (folder.folder_type === "inbox" || displayName === "inbox") {
      return <Inbox size={size} strokeWidth={strokeWidth} />;
    }
    if (folder.folder_type === "sent" || displayName.includes("sent")) {
      return <Send size={size} strokeWidth={strokeWidth} />;
    }
    if (folder.folder_type === "drafts" || displayName === "drafts") {
      return <FileEdit size={size} strokeWidth={strokeWidth} />;
    }
    if (
      folder.folder_type === "deleted" ||
      displayName.includes("deleted") ||
      displayName.includes("trash")
    ) {
      return <Trash2 size={size} strokeWidth={strokeWidth} />;
    }
    if (folder.folder_type === "archive" || displayName === "archive") {
      return <Archive size={size} strokeWidth={strokeWidth} />;
    }
    if (folder.is_favorite) {
      return <Star size={size} strokeWidth={strokeWidth} />;
    }

    return <Folder size={size} strokeWidth={strokeWidth} />;
  };

  const handleFolderClick = (e: React.MouseEvent<HTMLButtonElement>, folderId: string, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('=== FOLDER CLICK START ===');
    console.log('Clicked folder:', folderName);
    console.log('Folder ID:', folderId);
    console.log('Current selectedFolderId before update:', selectedFolderId);

    // Update the selected folder in the store
    setSelectedFolder(folderId);

    // Navigate to the mail page to show the messages
    router.push('/mail');

    console.log('setSelectedFolder called, navigating to /mail');
    console.log('=== FOLDER CLICK END ===');
  };

  const handleToggleCollapse = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[FolderTree] Toggling collapse for folder:', folderId);
    toggleFolderCollapse(folderId);
  };

  const renderFolder = (folder: FolderType, depth: number = 0) => {
    const isActive = folder.id === selectedFolderId;
    const isFolderLoading = isActive && isLoadingMessages;
    const children = getChildFolders(folder.graph_id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedFolders.has(folder.id);

    return (
      <div key={folder.id}>
        <button
          type="button"
          onClick={(e) => handleFolderClick(e, folder.id, folder.display_name)}
          className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer ${
            isActive
              ? "bg-surface-tertiary"
              : "hover:bg-surface-tertiary"
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {/* Collapse/expand chevron for folders with children */}
          {hasChildren ? (
            <span
              onClick={(e) => handleToggleCollapse(e, folder.id)}
              className="flex-shrink-0 cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={isCollapsed ? "Expand folder" : "Collapse folder"}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleToggleCollapse(e, folder.id);
                }
              }}
            >
              {isCollapsed ? (
                <ChevronRight
                  size={12}
                  className="text-text-tertiary"
                  strokeWidth={1.5}
                />
              ) : (
                <ChevronDown
                  size={12}
                  className="text-text-tertiary"
                  strokeWidth={1.5}
                />
              )}
            </span>
          ) : (
            <div className="w-3" /> // Spacer for alignment
          )}

          {/* Folder icon */}
          <span
            className={isActive ? "text-text-primary" : "text-text-tertiary"}
          >
            {getFolderIcon(folder)}
          </span>

          {/* Folder name */}
          <span
            className={`flex-1 text-xs ${
              isActive ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            {folder.display_name}
          </span>

          {/* Loading spinner or Unread count badge */}
          {isFolderLoading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            (folder.unread_count || 0) > 0 && (
              <span className="text-xs font-semibold text-text-primary">
                {folder.unread_count}
              </span>
            )
          )}
        </button>

        {/* Render children if not collapsed */}
        {hasChildren && !isCollapsed && (
          <div>
            {children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingFolders) {
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

  if (foldersError) {
    return (
      <div className="px-2 py-2 text-xs text-red-500">
        Error loading folders: {foldersError}
      </div>
    );
  }

  if (!currentAccountId) {
    return (
      <div className="px-2 py-2 text-center text-xs text-text-tertiary">
        Select an account to view folders
      </div>
    );
  }

  const rootFolders = getRootFolders();

  if (rootFolders.length === 0) {
    return (
      <div className="px-2 py-2 text-center text-xs text-text-tertiary">
        No folders found
      </div>
    );
  }

  // Organize folders by type for better display order
  const systemFolders = rootFolders.filter(
    (f) =>
      f.folder_type &&
      ["inbox", "sentitems", "drafts", "deleteditems", "archive"].includes(f.folder_type)
  );
  // Custom folders are everything else (including junkemail, outbox, and actual custom folders)
  const customFolders = rootFolders.filter(
    (f) =>
      !f.folder_type ||
      !["inbox", "sentitems", "drafts", "deleteditems", "archive"].includes(f.folder_type)
  );

  // Sort system folders in specific order
  const systemFolderOrder = ["inbox", "drafts", "sentitems", "archive", "deleteditems"];
  systemFolders.sort((a, b) => {
    const aIndex = systemFolderOrder.indexOf(a.folder_type || "");
    const bIndex = systemFolderOrder.indexOf(b.folder_type || "");
    return aIndex - bIndex;
  });

  console.log('[FolderTree] Rendering folders', {
    totalFolders: folders.length,
    systemFolders: systemFolders.length,
    customFolders: customFolders.length,
    selectedFolderId,
    currentAccountId
  });

  return (
    <div className="space-y-1 px-2">
      {/* System folders */}
      {systemFolders.map((folder) => renderFolder(folder))}

      {/* Favorites section */}
      {folders.some((f) => f.is_favorite) && (
        <>
          <div className="px-2 pb-1 pt-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Favorites
            </span>
          </div>
          {folders
            .filter((f) => f.is_favorite)
            .map((folder) => renderFolder(folder))}
        </>
      )}

      {/* Custom folders */}
      {customFolders.length > 0 && (
        <>
          <div className="px-2 pb-1 pt-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Folders
            </span>
          </div>
          {customFolders.map((folder) => renderFolder(folder))}
        </>
      )}
    </div>
  );
}
