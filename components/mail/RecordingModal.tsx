"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AudioWaveform } from "@/components/ui/AudioWaveform";
import { RecordingControls } from "./RecordingControls";
import type { RecordingState, AudioRecording } from "@/types/audio";

interface RecordingModalProps {
  open: boolean;
  onClose: () => void;
  mode: "dictate" | "voice";
  state: RecordingState;
  duration: number;
  audioLevels: number[];
  recording: AudioRecording | null;
  error: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  children?: React.ReactNode;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RecordingModal({
  open,
  onClose,
  mode,
  state,
  duration,
  audioLevels,
  recording,
  error,
  onStart,
  onPause,
  onResume,
  onStop,
  children,
}: RecordingModalProps) {
  const isIdle = state === "idle";
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const maxDuration = 10 * 60 * 1000; // 10 minutes

  const title = mode === "dictate" ? "AI Dictate" : "Voice Message";
  const description = mode === "dictate"
    ? "Speak your email and AI will format it professionally"
    : "Record a voice message to attach to your email";

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRecording && !isPaused) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isRecording, isPaused, onClose]);

  // Auto-close at 10-minute limit
  useEffect(() => {
    if (duration >= maxDuration && (isRecording || isPaused)) {
      onStop();
    }
  }, [duration, isRecording, isPaused, onStop, maxDuration]);

  // Cleanup recording on close
  const handleClose = () => {
    if (isRecording || isPaused) {
      if (confirm("Stop recording and discard?")) {
        onStop();
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-surface-primary p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-text-tertiary">
                {description}
              </Dialog.Description>
            </div>
            <button
              onClick={handleClose}
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

          {/* Timer */}
          <div className="mb-4 text-center">
            <div className="text-2xl font-semibold tabular-nums text-text-primary">
              {formatTime(duration)}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">
              {isRecording && "Recording..."}
              {isPaused && "Paused"}
              {isIdle && !recording && "Press to start"}
              {duration >= maxDuration && "Maximum time reached"}
            </div>
          </div>

          {/* Waveform */}
          <div className="mb-6">
            <AudioWaveform
              audioLevels={audioLevels}
              isRecording={isRecording}
            />
          </div>

          {/* Controls */}
          <div className="mb-4">
            <RecordingControls
              state={state}
              onStart={onStart}
              onPause={onPause}
              onResume={onResume}
              onStop={onStop}
            />
          </div>

          {/* Additional content (for preview, etc.) */}
          {children}

          {/* Info */}
          {isIdle && !recording && (
            <div className="text-center text-xs text-text-tertiary">
              <p>Maximum recording time: 10 minutes</p>
              <p className="mt-1">Press ESC to cancel</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
