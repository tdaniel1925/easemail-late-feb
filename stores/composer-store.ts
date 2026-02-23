import { create } from "zustand";

interface ComposerState {
  isOpen: boolean;
  mode: "new" | "reply" | "replyAll" | "forward";
  originalMessageId: string | null;

  openComposer: (mode: "new" | "reply" | "replyAll" | "forward", messageId?: string) => void;
  closeComposer: () => void;
}

export const useComposerStore = create<ComposerState>((set) => ({
  isOpen: false,
  mode: "new",
  originalMessageId: null,

  openComposer: (mode, messageId) =>
    set({
      isOpen: true,
      mode,
      originalMessageId: messageId || null,
    }),

  closeComposer: () =>
    set({
      isOpen: false,
      mode: "new",
      originalMessageId: null,
    }),
}));
