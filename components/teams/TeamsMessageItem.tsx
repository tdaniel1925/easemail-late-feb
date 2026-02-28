"use client";

import { useState } from "react";
import { Reply, Smile, Paperclip, AlertCircle } from "lucide-react";
import { type TeamsMessage, useTeamsStore } from "@/stores/teams-store";
import { formatDistanceToNow, format } from "date-fns";
import { EmojiPicker } from "./EmojiPicker";

interface TeamsMessageItemProps {
  message: TeamsMessage;
  onReply?: () => void;
}

export function TeamsMessageItem({ message, onReply }: TeamsMessageItemProps) {
  const setViewedMessage = useTeamsStore((state) => state.setViewedMessage);
  const updateMessage = useTeamsStore((state) => state.updateMessage);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAddingReaction, setIsAddingReaction] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);

  const handleMessageClick = () => {
    setViewedMessage(message.id);
  };

  const handleAddReaction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = async (emoji: string) => {
    setShowEmojiPicker(false);
    setIsAddingReaction(true);
    setReactionError(null);

    try {
      const response = await fetch(`/api/teams/messages/${message.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: message.account_id,
          emoji,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reaction');
      }

      const data = await response.json();

      // Update the message in the store with new reactions
      if (data.reactions) {
        updateMessage(message.id, { reactions: data.reactions });
      }
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      setReactionError(error.message || 'Failed to add reaction');

      // Clear error after 3 seconds
      setTimeout(() => {
        setReactionError(null);
      }, 3000);
    } finally {
      setIsAddingReaction(false);
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  const initials = getInitials(message.from_name, message.from_email);
  const displayName = message.from_name || message.from_email || "Unknown";
  const messageTime = new Date(message.created_at);

  return (
    <div
      data-testid="message-item"
      onClick={handleMessageClick}
      className="group flex gap-3 border-b border-border-subtle px-4 py-3 hover:bg-surface-hover cursor-pointer"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-tertiary text-xs font-medium text-text-secondary">
          {initials}
        </div>
      </div>

      {/* Message content */}
      <div className="min-w-0 flex-1">
        {/* Header: name and timestamp */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-text-primary">{displayName}</span>
          <span className="text-xs text-text-tertiary" title={format(messageTime, "PPpp")}>
            {formatDistanceToNow(messageTime, { addSuffix: true })}
          </span>
          {message.importance !== 'normal' && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                message.importance === 'high' || message.importance === 'urgent'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-blue-500/10 text-blue-600'
              }`}
            >
              {message.importance}
            </span>
          )}
        </div>

        {/* Message body */}
        <div className="mt-1">
          {message.body_html ? (
            <div
              className="prose prose-sm max-w-none text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: message.body_html }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-text-secondary">
              {message.body_text}
            </p>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-text-tertiary">
            <Paperclip size={12} strokeWidth={1.5} />
            <span>{message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Reactions and reply count */}
        <div className="mt-2 flex items-center gap-4">
          {message.reactions && message.reactions.length > 0 && (
            <div data-testid="message-reactions" className="flex items-center gap-1">
              <Smile size={12} strokeWidth={1.5} className="text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{message.reactions.length}</span>
            </div>
          )}
          {(message.reply_count || 0) > 0 && (
            <div className="flex items-center gap-1">
              <Reply size={12} strokeWidth={1.5} className="text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</span>
            </div>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100">
          {/* Add reaction button */}
          <div className="relative">
            <button
              data-testid="add-reaction"
              onClick={handleAddReaction}
              disabled={isAddingReaction}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Smile size={12} strokeWidth={1.5} />
              <span>{isAddingReaction ? 'Adding...' : 'React'}</span>
            </button>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {onReply && (
            <button
              onClick={onReply}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
            >
              <Reply size={12} strokeWidth={1.5} />
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Reaction error */}
        {reactionError && (
          <div className="mt-2 flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
            <AlertCircle size={12} strokeWidth={1.5} />
            <span>{reactionError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
