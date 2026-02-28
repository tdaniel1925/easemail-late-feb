"use client";

import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = [
  { emoji: "👍", label: "thumbs up" },
  { emoji: "👎", label: "thumbs down" },
  { emoji: "❤️", label: "heart" },
  { emoji: "😊", label: "smile" },
  { emoji: "😂", label: "laugh" },
  { emoji: "🎉", label: "party" },
  { emoji: "🔥", label: "fire" },
  { emoji: "✅", label: "check" },
  { emoji: "👀", label: "eyes" },
  { emoji: "🙏", label: "pray" },
];

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Picker */}
      <div
        data-testid="emoji-picker"
        className="absolute z-50 mt-1 rounded border border-border-default bg-surface-primary shadow-lg p-2"
        style={{ width: "200px" }}
      >
        <div className="grid grid-cols-5 gap-1">
          {COMMON_EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              data-testid={`emoji-${emoji}`}
              onClick={() => handleEmojiClick(emoji)}
              className={cn(
                "h-8 w-8 rounded flex items-center justify-center text-lg",
                "hover:bg-bg-hover transition-colors"
              )}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
