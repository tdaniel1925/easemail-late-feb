"use client";

import { Archive, Trash2, Mail, MailOpen, Flag, FolderInput, RefreshCw } from "lucide-react";
import { useMailStore } from "@/stores/mail-store";
import { toast } from "@/lib/toast";

interface MessageListToolbarProps {
  onRefresh?: () => void;
}

export function MessageListToolbar({ onRefresh }: MessageListToolbarProps) {
  const { selectedMessageIds, clearMessageSelection, updateMessage } = useMailStore();
  const selectedCount = selectedMessageIds.size;

  if (selectedCount === 0) {
    return null;
  }

  const handleArchive = async () => {
    const messageIds = Array.from(selectedMessageIds);
    const count = selectedCount;
    let actionExecuted = false;
    let undoTimeoutId: NodeJS.Timeout;

    // Clear selection immediately for better UX
    clearMessageSelection();

    // Show undo toast
    toast.success({
      title: `${count} message(s) archived`,
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(undoTimeoutId);
          actionExecuted = false;
          toast.info('Archive cancelled');
        },
      },
    });

    // Execute archive after 5 seconds if not undone
    undoTimeoutId = setTimeout(async () => {
      if (actionExecuted) return;
      actionExecuted = true;

      try {
        await Promise.all(
          messageIds.map((id) =>
            fetch(`/api/mail/messages/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "archive" }),
            })
          )
        );
      } catch (err: any) {
        toast.error({
          title: 'Archive failed',
          description: err.message,
        });
      }
    }, 5000);
  };

  const handleDelete = async () => {
    const messageIds = Array.from(selectedMessageIds);
    const count = selectedCount;
    let actionExecuted = false;
    let undoTimeoutId: NodeJS.Timeout;

    // Clear selection immediately for better UX
    clearMessageSelection();

    // Show undo toast
    toast.success({
      title: `${count} message(s) deleted`,
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(undoTimeoutId);
          actionExecuted = false;
          toast.info('Delete cancelled');
        },
      },
    });

    // Execute delete after 5 seconds if not undone
    undoTimeoutId = setTimeout(async () => {
      if (actionExecuted) return;
      actionExecuted = true;

      try {
        await Promise.all(
          messageIds.map((id) =>
            fetch(`/api/mail/messages/${id}`, {
              method: "DELETE",
            })
          )
        );
      } catch (err: any) {
        toast.error({
          title: 'Delete failed',
          description: err.message,
        });
      }
    }, 5000);
  };

  const handleMarkRead = async () => {
    const messageIds = Array.from(selectedMessageIds);
    try {
      await Promise.all(
        messageIds.map((id) => {
          updateMessage(id, { is_read: true });
          return fetch(`/api/mail/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          });
        })
      );
      toast.success({
        title: `${selectedCount} message(s) marked as read`,
      });
      clearMessageSelection();
    } catch (err: any) {
      toast.error({
        title: 'Mark as read failed',
        description: err.message,
      });
    }
  };

  const handleMarkUnread = async () => {
    const messageIds = Array.from(selectedMessageIds);
    try {
      await Promise.all(
        messageIds.map((id) => {
          updateMessage(id, { is_read: false });
          return fetch(`/api/mail/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: false }),
          });
        })
      );
      toast.success({
        title: `${selectedCount} message(s) marked as unread`,
      });
      clearMessageSelection();
    } catch (err: any) {
      toast.error({
        title: 'Mark as unread failed',
        description: err.message,
      });
    }
  };

  const handleFlag = async () => {
    const messageIds = Array.from(selectedMessageIds);
    try {
      await Promise.all(
        messageIds.map((id) => {
          updateMessage(id, { is_flagged: true });
          return fetch(`/api/mail/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFlagged: true }),
          });
        })
      );
      toast.success({
        title: `${selectedCount} message(s) flagged`,
      });
      clearMessageSelection();
    } catch (err: any) {
      toast.error({
        title: 'Flag failed',
        description: err.message,
      });
    }
  };

  const handleMove = async () => {
    // TODO: Implement move to folder with folder picker modal
    toast.info('Move to folder - Coming soon');
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
