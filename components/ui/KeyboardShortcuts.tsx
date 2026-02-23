"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Keyboard } from "lucide-react";
import { KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { useState, useEffect } from "react";

interface KeyboardShortcutsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = ["INPUT", "TEXTAREA"].includes(target.tagName) ||
                          target.isContentEditable;

      if (e.key === "?" && !isInputField && !e.shiftKey) {
        e.preventDefault();
        handleOpenChange(true);
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-surface-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <div className="flex items-center gap-3">
              <Keyboard size={20} className="text-text-secondary" strokeWidth={2} />
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <Dialog.Close className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary">
              <X size={18} strokeWidth={2} />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="max-h-[600px] overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {Object.entries(KEYBOARD_SHORTCUTS).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="text-sm text-text-primary">
                          {shortcut.description}
                        </span>
                        <KeyboardKey keyCombo={shortcut.key} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border-default px-6 py-4">
            <p className="text-xs text-text-tertiary">
              Press <KeyboardKey keyCombo="?" /> to toggle this help, or{" "}
              <KeyboardKey keyCombo="Esc" /> to close
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function KeyboardKey({ keyCombo }: { keyCombo: string }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.includes("Mac"));
  }, []);

  const keys = keyCombo.split(" then ").map((part) => part.trim());

  return (
    <div className="flex items-center gap-1">
      {keys.map((keyPart, partIndex) => (
        <div key={partIndex} className="flex items-center gap-1">
          {partIndex > 0 && (
            <span className="text-xs text-text-tertiary">then</span>
          )}
          <div className="flex items-center gap-1">
            {keyPart.split(" + ").map((key, keyIndex) => (
              <div key={keyIndex} className="flex items-center gap-1">
                {keyIndex > 0 && (
                  <span className="text-xs text-text-tertiary">+</span>
                )}
                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border-default bg-surface-secondary px-2 text-xs font-mono text-text-primary shadow-sm">
                  {key.replace("Cmd/Ctrl", isMac ? "⌘" : "Ctrl")}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
