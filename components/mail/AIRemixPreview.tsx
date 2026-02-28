"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, RotateCcw } from "lucide-react";

interface AIRemixPreviewProps {
  open: boolean;
  onClose: () => void;
  originalText: string;
  onAccept: (improvedText: string) => void;
}

export function AIRemixPreview({
  open,
  onClose,
  originalText,
  onAccept,
}: AIRemixPreviewProps) {
  const [improvedText, setImprovedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch improved text when modal opens
  useEffect(() => {
    if (open && originalText) {
      fetchImprovedText();
    }
  }, [open, originalText]);

  const fetchImprovedText = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/remix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: originalText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to improve text");
      }

      const data = await response.json();
      setImprovedText(data.improvedText);
    } catch (err: any) {
      console.error("Failed to improve text:", err);
      setError(err.message || "Failed to improve text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (improvedText) {
      onAccept(improvedText);
      onClose();
    }
  };

  const handleRetry = () => {
    fetchImprovedText();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-surface-primary p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary">
                AI Remix
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-text-tertiary">
                Compare your original text with the AI-improved version
              </Dialog.Description>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 transition-colors hover:bg-surface-tertiary"
              aria-label="Close"
            >
              <X size={16} className="text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mb-4" />
              <p className="text-sm text-text-secondary">
                AI is improving your email...
              </p>
            </div>
          )}

          {/* Side-by-Side Comparison */}
          {!isLoading && (improvedText || error) && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Original Text */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-text-secondary">
                    Original
                  </div>
                  <div className="rounded-md border border-border-default bg-surface-secondary p-4 max-h-96 overflow-y-auto">
                    <div className="text-xs text-text-primary whitespace-pre-wrap">
                      {originalText}
                    </div>
                  </div>
                </div>

                {/* Improved Text */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-text-secondary">
                    AI Improved
                  </div>
                  <div className="rounded-md border border-accent bg-surface-secondary p-4 max-h-96 overflow-y-auto">
                    {improvedText ? (
                      <div className="text-xs text-text-primary whitespace-pre-wrap">
                        {improvedText}
                      </div>
                    ) : (
                      <div className="text-xs text-text-tertiary italic">
                        Failed to generate improved version
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                {error && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
                  >
                    <RotateCcw size={14} strokeWidth={1.5} />
                    Retry
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
                >
                  Keep Original
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!improvedText}
                  className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={14} strokeWidth={1.5} />
                  Use Improved Version
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
