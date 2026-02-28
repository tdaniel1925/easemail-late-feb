"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SpeechRecognitionResult } from "@/types/audio";

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Custom hook for Web Speech API integration
 * Provides continuous speech recognition with interim results
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configuration
      recognition.continuous = true; // Keep listening until stopped
      recognition.interimResults = true; // Show interim results
      recognition.lang = "en-US"; // Language
      recognition.maxAlternatives = 1;

      // Event: Result received
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPiece = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptPiece + " ";
          } else {
            interim += transcriptPiece;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
        setInterimTranscript(interim);
      };

      // Event: Error occurred
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);

        let errorMessage = "An error occurred during speech recognition.";

        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "Microphone not found or not accessible.";
            break;
          case "not-allowed":
            errorMessage = "Microphone permission denied. Please enable microphone access.";
            break;
          case "network":
            errorMessage = "Network error. Please check your internet connection.";
            break;
          case "aborted":
            // Aborted is normal when stopping, don't show error
            return;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setError(errorMessage);
        setIsListening(false);
      };

      // Event: Recognition ended
      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      // Event: Recognition started
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setError(
        "Failed to start speech recognition. Please check your microphone permissions."
      );
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setInterimTranscript("");
      } catch (err) {
        console.error("Failed to stop speech recognition:", err);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
