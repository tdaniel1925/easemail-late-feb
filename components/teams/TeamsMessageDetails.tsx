"use client";

import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamsMessage } from "@/stores/teams-store";

interface TeamsMessageDetailsProps {
  message: TeamsMessage;
  accountId: string;
  onClose: () => void;
}

interface Reply {
  id: string;
  body_text: string | null;
  from_name: string | null;
  created_at: string;
}

export function TeamsMessageDetails({ message, accountId, onClose }: TeamsMessageDetailsProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch replies when message changes
  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoadingReplies(true);
      try {
        const response = await fetch(
          `/api/teams/messages/${message.id}/replies?accountId=${accountId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch replies');
        }

        const data = await response.json();
        setReplies(data.replies || []);
      } catch (error) {
        console.error('Error fetching replies:', error);
      } finally {
        setIsLoadingReplies(false);
      }
    };

    fetchReplies();
  }, [message.id, accountId]);

  const handleSendReply = async () => {
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/teams/messages/${message.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          content: replyText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      const data = await response.json();
      setReplies((prev) => [...prev, data.reply]);
      setReplyText("");
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div
      data-testid="message-details"
      className="flex h-full flex-col border-l border-border-default bg-surface-primary"
      style={{ width: "400px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Thread</h3>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Original message */}
      <div className="border-b border-border-default px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-medium text-text-secondary">
            {message.from_name?.[0] || "?"}
          </div>
          <span className="text-xs font-medium text-text-primary">
            {message.from_name || "Unknown"}
          </span>
          <span className="text-xs text-text-tertiary">
            {new Date(message.created_at).toLocaleString()}
          </span>
        </div>
        <div
          className="text-xs text-text-secondary"
          dangerouslySetInnerHTML={{
            __html: message.body_html || message.body_text || "",
          }}
        />
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 text-xs font-medium text-text-tertiary">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </div>

        {isLoadingReplies ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-1/3 animate-pulse-opacity rounded bg-surface-tertiary" />
                <div className="h-3 w-full animate-pulse-opacity rounded bg-surface-tertiary" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} data-testid="reply-item" className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-surface-tertiary flex items-center justify-center text-[10px] font-medium text-text-secondary">
                    {reply.from_name?.[0] || "?"}
                  </div>
                  <span className="text-xs font-medium text-text-primary">
                    {reply.from_name || "Unknown"}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="pl-7 text-xs text-text-secondary">
                  {reply.body_text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply input */}
      <div className="border-t border-border-default p-4">
        <div className="flex items-end gap-2">
          <textarea
            data-testid="reply-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to this message..."
            rows={2}
            className={cn(
              "flex-1 px-3 py-2 text-xs resize-none",
              "bg-bg-secondary border border-border-default rounded",
              "placeholder:text-text-secondary",
              "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
              "transition-colors"
            )}
          />
          <button
            data-testid="send-reply"
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending}
            className={cn(
              "h-8 w-8 rounded flex items-center justify-center flex-shrink-0",
              "bg-accent text-white",
              "hover:bg-accent-hover",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
            title="Send reply"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
