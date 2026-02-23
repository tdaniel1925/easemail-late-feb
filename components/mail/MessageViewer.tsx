"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { useMailStore } from "@/stores/mail-store";
import { useComposerStore } from "@/stores/composer-store";
import { MessageHeader } from "./MessageHeader";
import { MessageBody } from "./MessageBody";
import { AttachmentList } from "./AttachmentList";

interface FullMessage {
  id: string;
  account_id: string;
  graph_id: string;
  subject: string | null;
  from: {
    name: string | null;
    address: string | null;
  };
  to: any[];
  cc: any[];
  bcc: any[];
  body: {
    html: string | null;
    text: string | null;
    content_type: string | null;
  };
  received_at: string | null;
  is_read: boolean | null;
  is_flagged: boolean | null;
  categories: string[] | null;
  importance: string | null;
  has_attachments: boolean | null;
  attachments?: any[];
}

export function MessageViewer() {
  const { viewedMessageId, updateMessage } = useMailStore();
  const { openComposer } = useComposerStore();
  const [message, setMessage] = useState<FullMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewedMessageId) {
      fetchMessage(viewedMessageId);
    } else {
      setMessage(null);
    }
  }, [viewedMessageId]);

  const fetchMessage = async (messageId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mail/messages/${messageId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch message");
      }

      const data = await response.json();

      // Debug logging to verify data structure
      console.log('[MessageViewer] Message loaded:', {
        id: data.id,
        subject: data.subject,
        toStructure: data.to?.[0],
        ccStructure: data.cc?.[0],
        hasAttachments: data.has_attachments,
        attachmentCount: data.attachments?.length,
        bodyHtmlLength: data.body?.html?.length,
        bodyTextLength: data.body?.text?.length,
      });

      setMessage(data);

      // Mark as read if unread
      if (data && !data.is_read) {
        markAsRead(messageId);
      }
    } catch (err: any) {
      console.error("Error fetching message:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/mail/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        // Update local state
        updateMessage(messageId, { is_read: true });
        setMessage((prev) => (prev ? { ...prev, is_read: true } : null));
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const handleReply = () => {
    if (message) {
      openComposer("reply", message.id);
    }
  };

  const handleReplyAll = () => {
    if (message) {
      openComposer("replyAll", message.id);
    }
  };

  const handleForward = () => {
    if (message) {
      openComposer("forward", message.id);
    }
  };

  const handleArchive = async () => {
    if (!message) return;

    try {
      const response = await fetch(`/api/mail/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive message");
      }

      // TODO: Show toast notification
      console.log("Message archived");
    } catch (err) {
      console.error("Error archiving message:", err);
    }
  };

  const handleDelete = async () => {
    if (!message) return;

    try {
      const response = await fetch(`/api/mail/messages/${message.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // TODO: Show toast notification
      console.log("Message deleted");
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleToggleFlag = async () => {
    if (!message) return;

    const newFlaggedState = !message.is_flagged;

    try {
      const response = await fetch(`/api/mail/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFlagged: newFlaggedState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flag");
      }

      // Update local state
      updateMessage(message.id, { is_flagged: newFlaggedState });
      setMessage((prev) => (prev ? { ...prev, is_flagged: newFlaggedState } : null));
    } catch (err) {
      console.error("Error toggling flag:", err);
    }
  };

  // No message selected
  if (!viewedMessageId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-primary">
        <Mail size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Select a message to view</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-surface-primary">
        {/* Header skeleton */}
        <div className="border-b border-border-default bg-surface-primary px-4 py-3">
          <div className="mb-3 h-6 w-3/4 animate-pulse-opacity rounded bg-surface-tertiary" />
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 animate-pulse-opacity rounded-full bg-surface-tertiary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse-opacity rounded bg-surface-tertiary" />
              <div className="h-3 w-1/3 animate-pulse-opacity rounded bg-surface-tertiary" />
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="flex-1 px-4 py-3">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-3 animate-pulse-opacity rounded bg-surface-tertiary"
                style={{ width: `${Math.random() * 30 + 70}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-primary">
        <Mail size={48} className="mb-3 text-red-500" strokeWidth={1} />
        <p className="text-sm font-medium text-red-500">Error loading message</p>
        <p className="mt-1 text-xs text-text-tertiary">{error}</p>
        <button
          onClick={() => viewedMessageId && fetchMessage(viewedMessageId)}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Message not found
  if (!message) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-primary">
        <Mail size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Message not found</p>
      </div>
    );
  }

  // Message viewer
  return (
    <div className="flex h-full flex-col bg-surface-primary">
      {/* Header - fixed */}
      <div className="flex-shrink-0">
        <MessageHeader
          fromName={message.from.name}
          fromAddress={message.from.address}
          toRecipients={message.to}
          ccRecipients={message.cc}
          subject={message.subject}
          receivedAt={message.received_at}
          isFlagged={message.is_flagged}
          categories={message.categories}
          importance={message.importance}
          onReply={handleReply}
          onReplyAll={handleReplyAll}
          onForward={handleForward}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onToggleFlag={handleToggleFlag}
        />

        {message.has_attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
          <AttachmentList attachments={message.attachments} messageId={message.id} />
        )}
      </div>

      {/* Body - scrollable fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <MessageBody
          bodyHtml={message.body.html}
          bodyText={message.body.text}
          contentType={message.body.content_type}
          fromAddress={message.from.address}
          messageId={message.id}
          attachments={message.attachments}
        />
      </div>
    </div>
  );
}
