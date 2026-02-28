"use client";

import { useState } from "react";
import { Reply, ReplyAll, Forward, Archive, Trash2, Flag, MoreHorizontal, Printer, AlertCircle, UserCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Recipient {
  emailAddress: {
    name?: string;
    address: string;
  };
}

interface MessageHeaderProps {
  fromName: string | null;
  fromAddress: string | null;
  toRecipients: any;
  ccRecipients: any;
  subject: string | null;
  receivedAt: string | null;
  isFlagged: boolean | null;
  categories: string[] | null;
  importance: string | null;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleFlag: () => void;
  onShowContact?: () => void;
}

export function MessageHeader({
  fromName,
  fromAddress,
  toRecipients,
  ccRecipients,
  subject,
  receivedAt,
  isFlagged,
  categories,
  importance,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onToggleFlag,
  onShowContact,
}: MessageHeaderProps) {
  const [showAllTo, setShowAllTo] = useState(false);
  const [showCc, setShowCc] = useState(false);

  const formatRecipients = (recipients: any) => {
    if (!recipients) return [];
    try {
      const parsed = typeof recipients === "string" ? JSON.parse(recipients) : recipients;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getRecipientDisplay = (r: any): string => {
    // Handle different recipient formats defensively
    if (!r) return 'Unknown';
    return (
      r?.emailAddress?.name ||
      r?.emailAddress?.address ||
      r?.name ||
      r?.address ||
      r?.email ||
      'Unknown'
    );
  };

  const toList = formatRecipients(toRecipients);
  const ccList = formatRecipients(ccRecipients);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    const absoluteTime = format(date, "PPP 'at' p"); // e.g., "Feb 21, 2026 at 3:42 PM"
    return { relativeTime, absoluteTime };
  };

  const dateInfo = formatDate(receivedAt);

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

  return (
    <div className="border-b border-border-default bg-surface-primary">
      {/* Action Toolbar - Sticky */}
      <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-secondary px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onReply}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            title="Reply"
          >
            <Reply size={14} strokeWidth={1.5} />
            <span>Reply</span>
          </button>
          <button
            onClick={onReplyAll}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            title="Reply All"
          >
            <ReplyAll size={14} strokeWidth={1.5} />
            <span>Reply All</span>
          </button>
          <button
            onClick={onForward}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            title="Forward"
          >
            <Forward size={14} strokeWidth={1.5} />
            <span>Forward</span>
          </button>

          <div className="mx-2 h-4 w-px bg-border-default" />

          <button
            onClick={onArchive}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title="Archive"
          >
            <Archive size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-red-500"
            title="Delete"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={onToggleFlag}
            className={`rounded-md p-1.5 transition-colors hover:bg-surface-hover ${
              isFlagged ? "text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
            title={isFlagged ? "Unflag" : "Flag"}
          >
            <Flag size={16} strokeWidth={1.5} fill={isFlagged ? "currentColor" : "none"} />
          </button>

          <div className="mx-2 h-4 w-px bg-border-default" />

          <button
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title="More actions"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Message Info */}
      <div className="px-4 py-3">
        {/* Subject */}
        <h1 className="mb-3 text-lg font-semibold text-text-primary">{subject || "(No subject)"}</h1>

        {/* From */}
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            {getInitials(fromName, fromAddress)}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {fromName || fromAddress || "Unknown"}
              </span>
              {fromAddress && fromName && (
                <span className="text-xs text-text-tertiary">&lt;{fromAddress}&gt;</span>
              )}
              {/* Contact info button */}
              {fromAddress && onShowContact && (
                <button
                  onClick={onShowContact}
                  className="ml-1 rounded-md p-1 transition-colors hover:bg-surface-hover"
                  title="View contact info"
                >
                  <UserCircle size={14} className="text-text-tertiary" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* To */}
            <div className="mt-1 flex items-baseline gap-1 text-xs text-text-secondary">
              <span>to</span>
              {toList.length > 0 ? (
                <>
                  {showAllTo ? (
                    <span>
                      {toList.map((r: any, i: number) => (
                        <span key={i}>
                          {getRecipientDisplay(r)}
                          {i < toList.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <>
                      <span>{getRecipientDisplay(toList[0])}</span>
                      {toList.length > 1 && (
                        <button
                          onClick={() => setShowAllTo(true)}
                          className="text-text-tertiary hover:underline"
                        >
                          and {toList.length - 1} {toList.length - 1 === 1 ? "other" : "others"}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <span>me</span>
              )}

              {ccList.length > 0 && (
                <>
                  <span className="mx-1">•</span>
                  <button
                    onClick={() => setShowCc(!showCc)}
                    className="text-text-tertiary hover:underline"
                  >
                    {ccList.length} cc
                  </button>
                </>
              )}
            </div>

            {/* CC (expanded) */}
            {showCc && ccList.length > 0 && (
              <div className="mt-1 text-xs text-text-secondary">
                <span>cc: </span>
                {ccList.map((r: any, i: number) => (
                  <span key={i}>
                    {getRecipientDisplay(r)}
                    {i < ccList.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-text-secondary" title={dateInfo.absoluteTime}>
              {dateInfo.relativeTime}
            </div>
            {importance === "high" && (
              <div className="mt-1 flex items-center justify-end gap-1 text-red-500">
                <AlertCircle size={12} strokeWidth={2} />
                <span className="text-[10px] font-medium">High importance</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories/Labels */}
        {categories && categories.length > 0 && (
          <div className="flex gap-1">
            {categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="rounded bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
