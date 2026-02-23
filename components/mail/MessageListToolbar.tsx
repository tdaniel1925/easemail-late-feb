"use client";

import { Archive, Trash2, Mail, MailOpen, Flag, FolderInput, RefreshCw } from "lucide-react";
import { useMailStore } from "@/stores/mail-store";

interface MessageListToolbarProps {
  onRefresh?: () => void;
}

export function MessageListToolbar({ onRefresh }: MessageListToolbarProps) {
  const { selectedMessageIds, clearMessageSelection } = useMailStore();
  const selectedCount = selectedMessageIds.size;

  if (selectedCount === 0) {
    return null;
  }

  const handleArchive = async () => {
    // TODO: Implement archive action
    console.log("Archive", Array.from(selectedMessageIds));
    clearMessageSelection();
  };

  const handleDelete = async () => {
    // TODO: Implement delete action
    console.log("Delete", Array.from(selectedMessageIds));
    clearMessageSelection();
  };

  const handleMarkRead = async () => {
    // TODO: Implement mark as read
    console.log("Mark read", Array.from(selectedMessageIds));
    clearMessageSelection();
  };

  const handleMarkUnread = async () => {
    // TODO: Implement mark as unread
    console.log("Mark unread", Array.from(selectedMessageIds));
    clearMessageSelection();
  };

  const handleFlag = async () => {
    // TODO: Implement flag
    console.log("Flag", Array.from(selectedMessageIds));
    clearMessageSelection();
  };

  const handleMove = async () => {
    // TODO: Implement move to folder
    console.log("Move", Array.from(selectedMessageIds));
  };

  return (
    <div className="flex items-center gap-1 border-b border-border-subtle bg-surface-secondary px-4 py-2">
      <span className="text-xs text-text-secondary">
        {selectedCount} selected
      </span>

      <div className="ml-4 flex items-center gap-0.5">
        <button
          onClick={handleArchive}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Archive"
        >
          <Archive size={14} strokeWidth={1.5} />
          <span>Archive</span>
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Delete"
        >
          <Trash2 size={14} strokeWidth={1.5} />
          <span>Delete</span>
        </button>

        <div className="mx-1 h-4 w-px bg-border-default" />

        <button
          onClick={handleMarkRead}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Mark as read"
        >
          <MailOpen size={14} strokeWidth={1.5} />
        </button>

        <button
          onClick={handleMarkUnread}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Mark as unread"
        >
          <Mail size={14} strokeWidth={1.5} />
        </button>

        <button
          onClick={handleFlag}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Flag"
        >
          <Flag size={14} strokeWidth={1.5} />
        </button>

        <div className="mx-1 h-4 w-px bg-border-default" />

        <button
          onClick={handleMove}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Move to folder"
        >
          <FolderInput size={14} strokeWidth={1.5} />
          <span>Move</span>
        </button>
      </div>

      <button
        onClick={clearMessageSelection}
        className="ml-auto text-xs text-text-secondary hover:text-text-primary"
      >
        Clear
      </button>
    </div>
  );
}
