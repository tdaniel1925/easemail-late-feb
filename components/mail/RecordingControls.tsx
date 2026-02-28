"use client";

import { Mic, Pause, Square } from "lucide-react";
import type { RecordingState } from "@/types/audio";

interface RecordingControlsProps {
  state: RecordingState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordingControls({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: RecordingControlsProps) {
  const isIdle = state === "idle";
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isProcessing = state === "processing";

  return (
    <div className="flex items-center justify-center gap-3">
      {isIdle && (
        <button
          onClick={onStart}
          disabled={disabled || isProcessing}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Start recording"
        >
          <Mic size={20} strokeWidth={2} />
        </button>
      )}

      {isRecording && (
        <>
          <button
            onClick={onPause}
            disabled={disabled || isProcessing}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-secondary text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Pause recording"
          >
            <Pause size={16} strokeWidth={2} />
          </button>
          <button
            onClick={onStop}
            disabled={disabled || isProcessing}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Stop recording"
          >
            <Square size={18} strokeWidth={2} fill="currentColor" />
          </button>
        </>
      )}

      {isPaused && (
        <>
          <button
            onClick={onResume}
            disabled={disabled || isProcessing}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Resume recording"
          >
            <Mic size={20} strokeWidth={2} />
          </button>
          <button
            onClick={onStop}
            disabled={disabled || isProcessing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Stop recording"
          >
            <Square size={16} strokeWidth={2} fill="currentColor" />
          </button>
        </>
      )}

      {isProcessing && (
        <div className="flex h-12 w-12 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
    </div>
  );
}
