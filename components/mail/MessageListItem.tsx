"use client";

import { Paperclip, Flag, Star } from "lucide-react";
import { type Message } from "@/stores/mail-store";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from "date-fns";

interface MessageListItemProps {
  message: Message;
  isSelected: boolean;
  onSelect: (messageId: string, isCheckbox: boolean) => void;
}

export function MessageListItem({
  message,
  isSelected,
  onSelect,
}: MessageListItemProps) {
  const isUnread = !message.is_read;
  const isFlagged = message.is_flagged;

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (isToday(date)) {
      return format(date, "h:mm a");
    }

    if (isYesterday(date)) {
      return "Yesterday";
    }

    if (isThisWeek(date)) {
      return format(date, "EEEE"); // Monday, Tuesday, etc.
    }

    return format(date, "MMM d"); // Jan 15
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(message.id, true);
  };

  const handleRowClick = () => {
    onSelect(message.id, false);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex cursor-pointer gap-2.5 border-b border-border-subtle px-3 py-2 transition-colors ${
        isSelected
          ? "border-l-2 border-l-accent bg-accent-subtle"
          : "border-l-2 border-l-transparent hover:bg-surface-hover"
      }`}
      style={{ minHeight: "60px" }}
    >
      {/* Unread indicator dot */}
      {isUnread && (
        <div className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent" />
      )}

      {/* Message content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {/* Top row: from name and date */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
              isUnread ? "text-sm font-semibold text-text-primary" : "text-sm font-normal text-text-secondary"
            }`}
          >
            {message.from_name || message.from_address || "Unknown"}
          </span>
          <span className="flex-shrink-0 text-xs text-text-tertiary">
            {formatDate(message.received_at)}
          </span>
        </div>

        {/* Subject */}
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-text-primary">
          {message.subject || "(No subject)"}
        </div>

        {/* Preview */}
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-tight text-text-tertiary">
          {message.preview || ""}
        </div>
      </div>

      {/* Hover icons */}
      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {message.has_attachments && (
          <Paperclip size={12} className="text-text-tertiary" strokeWidth={1.5} />
        )}
        {isFlagged && (
          <Flag
            size={12}
            className="text-accent"
            strokeWidth={1.5}
            fill="currentColor"
          />
        )}
      </div>
    </div>
  );
}
