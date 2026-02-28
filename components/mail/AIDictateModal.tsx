"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, FileText, Check } from "lucide-react";
import { RecordingModal } from "./RecordingModal";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface AIDictateModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

type DictateState =
  | "idle"
  | "recording"
  | "paused"
  | "stopped"
  | "processing"
  | "preview";

export function AIDictateModal({
  open,
  onClose,
  onInsert,
}: AIDictateModalProps) {
  // Audio recording for waveform visualization
  const {
    state: audioState,
    duration,
    audioLevel,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    pauseRecording: pauseAudioRecording,
    resumeRecording: resumeAudioRecording,
    clearRecording: clearAudioRecording,
  } = useAudioRecorder();

  // Speech recognition for transcript
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [dictateState, setDictateState] = useState<DictateState>("idle");
  const [formattedText, setFormattedText] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  // Generate audio levels for waveform visualization
  const audioLevels = new Array(35).fill(audioLevel);

  // Sync dictate state with audio/speech state
  useEffect(() => {
    if (audioState === "recording" && isListening) {
      setDictateState("recording");
    } else if (audioState === "paused") {
      setDictateState("paused");
    } else if (audioState === "idle" && !isListening && transcript) {
      setDictateState("stopped");
    }
  }, [audioState, isListening, transcript]);

  const handleStart = useCallback(() => {
    if (!isSupported) {
      setFormatError(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    setFormatError(null);
    resetTranscript();
    setFormattedText("");

    // Start both audio recording (for waveform) and speech recognition
    startAudioRecording();
    startListening();
  }, [
    isSupported,
    resetTranscript,
    startAudioRecording,
    startListening,
  ]);

  const handlePause = useCallback(() => {
    pauseAudioRecording();
    stopListening();
  }, [pauseAudioRecording, stopListening]);

  const handleResume = useCallback(() => {
    resumeAudioRecording();
    startListening();
  }, [resumeAudioRecording, startListening]);

  const handleStop = useCallback(() => {
    stopAudioRecording();
    stopListening();
    setDictateState("stopped");
  }, [stopAudioRecording, stopListening]);

  const handleFormat = useCallback(async () => {
    if (!transcript || transcript.trim().length === 0) {
      setFormatError("No transcript to format. Please record some speech first.");
      return;
    }

    setIsFormatting(true);
    setFormatError(null);
    setDictateState("processing");

    try {
      const response = await fetch("/api/ai/format-dictation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to format dictation");
      }

      const data = await response.json();
      setFormattedText(data.formattedText);
      setDictateState("preview");
    } catch (err: any) {
      console.error("Failed to format dictation:", err);
      setFormatError(err.message || "Failed to format dictation");
      setDictateState("stopped");
    } finally {
      setIsFormatting(false);
    }
  }, [transcript]);

  const handleInsert = useCallback(() => {
    if (formattedText) {
      onInsert(formattedText);
      handleReRecord();
      onClose();
    }
  }, [formattedText, onInsert, onClose]);

  const handleReRecord = useCallback(() => {
    clearAudioRecording();
    resetTranscript();
    setFormattedText("");
    setFormatError(null);
    setDictateState("idle");
  }, [clearAudioRecording, resetTranscript]);

  const handleClose = useCallback(() => {
    if (dictateState === "recording" || dictateState === "paused") {
      if (confirm("Stop recording and discard?")) {
        handleStop();
        clearAudioRecording();
        resetTranscript();
        setFormattedText("");
        onClose();
      }
    } else {
      handleReRecord();
      onClose();
    }
  }, [
    dictateState,
    handleStop,
    clearAudioRecording,
    resetTranscript,
    onClose,
    handleReRecord,
  ]);

  // Combined error message
  const errorMessage = formatError || speechError;

  return (
    <RecordingModal
      open={open}
      onClose={handleClose}
      mode="dictate"
      state={
        isFormatting
          ? "processing"
          : dictateState === "recording"
          ? "recording"
          : dictateState === "paused"
          ? "paused"
          : "idle"
      }
      duration={duration}
      audioLevels={audioLevels}
      recording={null}
      error={errorMessage}
      onStart={handleStart}
      onPause={handlePause}
      onResume={handleResume}
      onStop={handleStop}
    >
      {/* Live Transcript Display */}
      {(dictateState === "recording" ||
        dictateState === "paused" ||
        dictateState === "stopped") &&
        (transcript || interimTranscript) && (
          <div className="space-y-4">
            <div className="rounded-md border border-border-default bg-surface-secondary p-4 max-h-40 overflow-y-auto">
              <div className="text-xs text-text-secondary mb-2 font-medium">
                Live Transcript:
              </div>
              <div className="text-xs text-text-primary whitespace-pre-wrap">
                {transcript}
                {interimTranscript && (
                  <span className="text-text-tertiary italic">
                    {interimTranscript}
                  </span>
                )}
              </div>
            </div>

            {/* Format Button (shown after stopping) */}
            {dictateState === "stopped" && (
              <div className="flex gap-2">
                <button
                  onClick={handleReRecord}
                  disabled={isFormatting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                  Re-record
                </button>
                <button
                  onClick={handleFormat}
                  disabled={isFormatting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFormatting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Formatting...
                    </>
                  ) : (
                    <>
                      <FileText size={14} strokeWidth={1.5} />
                      Format with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      {/* Formatted Text Preview */}
      {dictateState === "preview" && formattedText && (
        <div className="space-y-4">
          <div className="rounded-md border border-border-default bg-surface-secondary p-4 max-h-60 overflow-y-auto">
            <div className="text-xs text-text-secondary mb-2 font-medium">
              Formatted Email:
            </div>
            <div className="text-xs text-text-primary whitespace-pre-wrap">
              {formattedText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReRecord}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
            >
              <RotateCcw size={14} strokeWidth={1.5} />
              Re-record
            </button>
            <button
              onClick={handleInsert}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Check size={14} strokeWidth={1.5} />
              Insert into Email
            </button>
          </div>
        </div>
      )}

      {/* Initial Instructions */}
      {dictateState === "idle" && !transcript && (
        <div className="text-center text-xs text-text-tertiary">
          <p className="mb-2">
            Press the microphone button and speak your email message.
          </p>
          <p className="mb-2">
            AI will format it into a professional email when you're done.
          </p>
          {!isSupported && (
            <p className="mt-2 text-red-500 font-medium">
              Speech recognition is not supported in your browser.
              <br />
              Please use Chrome, Edge, or Safari.
            </p>
          )}
        </div>
      )}
    </RecordingModal>
  );
}
