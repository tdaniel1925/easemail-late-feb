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
      className={`flex cursor-pointer gap-3 border-b border-border-subtle px-4 py-2 transition-colors ${
        isSelected
          ? "border-l-2 border-l-accent bg-surface-selected"
          : "border-l-2 border-l-transparent hover:bg-surface-hover"
      }`}
      style={{ minHeight: "72px" }}
    >
      {/* Checkbox */}
      <div className="flex flex-shrink-0 items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxClick}
          onClick={handleCheckboxClick}
          className="h-4 w-4 rounded border-border-default text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0"
        />
      </div>

      {/* Unread indicator dot */}
      {isUnread && (
        <div className="flex flex-shrink-0 items-start pt-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-shrink-0 items-start pt-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
          {getInitials(message.from_name, message.from_address)}
        </div>
      </div>

      {/* Message content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Top row: from name and date */}
        <div className="flex items-center gap-2">
          <span
            className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm ${
              isUnread ? "font-semibold text-text-primary" : "font-normal text-text-primary"
            }`}
          >
            {message.from_name || message.from_address || "Unknown"}
          </span>
          <span className="flex-shrink-0 text-xs text-text-tertiary">
            {formatDate(message.received_at)}
          </span>
        </div>

        {/* Subject */}
        <div
          className={`overflow-hidden text-ellipsis whitespace-nowrap text-sm ${
            isUnread ? "font-semibold text-text-primary" : "font-normal text-text-primary"
          }`}
        >
          {message.subject || "(No subject)"}
        </div>

        {/* Preview */}
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-text-secondary">
          {message.preview || ""}
        </div>

        {/* Bottom row: icons and labels */}
        <div className="flex items-center gap-2 pt-0.5">
          {message.has_attachments && (
            <Paperclip size={11} className="text-text-tertiary" strokeWidth={1.5} />
          )}

          {message.categories && message.categories.length > 0 && (
            <div className="flex gap-1">
              {message.categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] text-text-secondary"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Flag icon */}
          {isFlagged && (
            <div className="ml-auto">
              <Flag
                size={11}
                className="text-accent"
                strokeWidth={1.5}
                fill="currentColor"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
