"use client";

import { useState, useCallback } from "react";
import { RotateCcw, Paperclip } from "lucide-react";
import { RecordingModal } from "./RecordingModal";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface VoiceMessageRecorderProps {
  open: boolean;
  onClose: () => void;
  onAttach: (file: File) => void;
}

export function VoiceMessageRecorder({
  open,
  onClose,
  onAttach,
}: VoiceMessageRecorderProps) {
  const {
    state,
    duration,
    audioLevel,
    recording,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  } = useAudioRecorder();

  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Generate audio levels for waveform visualization
  const audioLevels = new Array(35).fill(audioLevel);

  const handleReRecord = useCallback(() => {
    clearRecording();
    setConvertError(null);
  }, [clearRecording]);

  const handleAttach = useCallback(async () => {
    if (!recording) return;

    setIsConverting(true);
    setConvertError(null);

    try {
      // Convert WebM to MP3
      const formData = new FormData();
      formData.append("audio", recording.blob, "recording.webm");

      const response = await fetch("/api/audio/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to convert audio");
      }

      const mp3Blob = await response.blob();

      // Create file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const fileName = `voice-message-${timestamp}.mp3`;
      const file = new File([mp3Blob], fileName, { type: "audio/mpeg" });

      // Attach to email
      onAttach(file);

      // Close modal and cleanup
      clearRecording();
      onClose();
    } catch (err: any) {
      console.error("Failed to attach voice message:", err);
      setConvertError(err.message || "Failed to attach voice message");
    } finally {
      setIsConverting(false);
    }
  }, [recording, onAttach, clearRecording, onClose]);

  const handleClose = useCallback(() => {
    if (state === "recording" || state === "paused") {
      if (confirm("Stop recording and discard?")) {
        stopRecording();
        clearRecording();
        onClose();
      }
    } else {
      clearRecording();
      onClose();
    }
  }, [state, stopRecording, clearRecording, onClose]);

  return (
    <RecordingModal
      open={open}
      onClose={handleClose}
      mode="voice"
      state={isConverting ? "processing" : state}
      duration={duration}
      audioLevels={audioLevels}
      recording={recording}
      error={error || convertError}
      onStart={startRecording}
      onPause={pauseRecording}
      onResume={resumeRecording}
      onStop={stopRecording}
    >
      {/* Preview after recording */}
      {recording && state === "idle" && (
        <div className="space-y-4">
          {/* Audio Player */}
          <div className="rounded-md border border-border-default bg-surface-secondary p-4">
            <audio
              src={recording.url}
              controls
              className="w-full"
              style={{ height: "40px" }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReRecord}
              disabled={isConverting}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} strokeWidth={1.5} />
              Re-record
            </button>
            <button
              onClick={handleAttach}
              disabled={isConverting}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Converting...
                </>
              ) : (
                <>
                  <Paperclip size={14} strokeWidth={1.5} />
                  Attach to Email
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </RecordingModal>
  );
}
