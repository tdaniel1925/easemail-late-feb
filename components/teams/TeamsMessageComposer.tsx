"use client";

import { useState, useEffect } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamsMessageComposerProps {
  channelId: string;
  onSend: (message: string) => Promise<void>;
}

export function TeamsMessageComposer({ channelId, onSend }: TeamsMessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Clear message when channel changes
  useEffect(() => {
    setMessage("");
  }, [channelId]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSend(message);
      setMessage(""); // Clear input after successful send
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div data-testid="message-composer" className="border-t border-border-default bg-surface-primary p-4">
      <div className="flex items-end gap-2">
        {/* Message Input */}
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            data-testid="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={3}
            className={cn(
              "w-full px-3 py-2 text-sm resize-none",
              "bg-bg-secondary border border-border-default rounded",
              "placeholder:text-text-secondary",
              "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
              "transition-colors"
            )}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                className={cn(
                  "h-8 w-8 rounded flex items-center justify-center",
                  "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
                  "transition-colors"
                )}
                title="Add attachment"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  "h-8 w-8 rounded flex items-center justify-center",
                  "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
                  "transition-colors"
                )}
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-text-tertiary">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          data-testid="send-message"
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            "h-10 w-10 rounded flex items-center justify-center flex-shrink-0",
            "bg-accent text-white",
            "hover:bg-accent-hover",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
