import { useEffect } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { useSearchStore } from "@/stores/search-store";
import { useMailStore } from "@/stores/mail-store";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
  key: string;
  description: string;
  handler: () => void;
  enabled?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function useKeyboardShortcuts() {
  const { openComposer } = useComposerStore();
  const { openSearch } = useSearchStore();
  const { viewedMessageId, messages, setViewedMessage } = useMailStore();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = ["INPUT", "TEXTAREA"].includes(target.tagName) ||
                          target.isContentEditable;

      // Search shortcuts (work everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
        return;
      }

      if (e.key === "/" && !isInputField) {
        e.preventDefault();
        openSearch();
        return;
      }

      // Shortcuts that only work when NOT in input fields
      if (isInputField) return;

      // Compose shortcuts
      if (e.key === "c") {
        e.preventDefault();
        openComposer("new");
        return;
      }

      // Reply shortcuts (only if a message is viewed)
      // IMPORTANT: Don't intercept when Ctrl/Cmd is pressed (e.g., Ctrl+Shift+R for browser refresh)
      if (viewedMessageId && !e.ctrlKey && !e.metaKey) {
        if (e.key === "r" && !e.shiftKey) {
          e.preventDefault();
          openComposer("reply", viewedMessageId);
          return;
        }

        if (e.key === "R" || (e.key === "r" && e.shiftKey)) {
          e.preventDefault();
          openComposer("replyAll", viewedMessageId);
          return;
        }

        if (e.key === "f") {
          e.preventDefault();
          openComposer("forward", viewedMessageId);
          return;
        }
      }

      // Navigation shortcuts (j/k for next/previous message)
      if (messages.length > 0) {
        const currentIndex = messages.findIndex((m) => m.id === viewedMessageId);

        if (e.key === "j") {
          e.preventDefault();
          // Go to next message
          if (currentIndex < messages.length - 1) {
            setViewedMessage(messages[currentIndex + 1].id);
          }
          return;
        }

        if (e.key === "k") {
          e.preventDefault();
          // Go to previous message
          if (currentIndex > 0) {
            setViewedMessage(messages[currentIndex - 1].id);
          } else if (currentIndex === -1 && messages.length > 0) {
            // No message selected, select first
            setViewedMessage(messages[0].id);
          }
          return;
        }
      }

      // Navigation to different sections
      if (e.key === "g") {
        // Wait for second key
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === "i") {
            e2.preventDefault();
            router.push("/mail?folder=inbox");
          } else if (e2.key === "s") {
            e2.preventDefault();
            router.push("/mail?folder=sent");
          } else if (e2.key === "d") {
            e2.preventDefault();
            router.push("/mail?folder=drafts");
          }
          window.removeEventListener("keydown", handleSecondKey);
        };

        window.addEventListener("keydown", handleSecondKey);
        setTimeout(() => {
          window.removeEventListener("keydown", handleSecondKey);
        }, 2000);
      }

      // Settings
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/settings");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openComposer, openSearch, viewedMessageId, messages, setViewedMessage, router]);
}

// Export shortcut definitions for help modal
export const KEYBOARD_SHORTCUTS: Record<string, ShortcutConfig[]> = {
  "General": [
    { key: "Cmd/Ctrl + K", description: "Open search", handler: () => {}, ctrlKey: true },
    { key: "/", description: "Open search", handler: () => {} },
    { key: "Cmd/Ctrl + ,", description: "Open settings", handler: () => {}, ctrlKey: true },
    { key: "?", description: "Show keyboard shortcuts", handler: () => {} },
  ],
  "Compose": [
    { key: "c", description: "Compose new email", handler: () => {} },
    { key: "r", description: "Reply to email", handler: () => {} },
    { key: "Shift + R", description: "Reply all", handler: () => {}, shiftKey: true },
    { key: "f", description: "Forward email", handler: () => {} },
  ],
  "Navigation": [
    { key: "j", description: "Next message", handler: () => {} },
    { key: "k", description: "Previous message", handler: () => {} },
    { key: "g then i", description: "Go to Inbox", handler: () => {} },
    { key: "g then s", description: "Go to Sent", handler: () => {} },
    { key: "g then d", description: "Go to Drafts", handler: () => {} },
  ],
};
