export interface AudioRecording {
  blob: Blob;
  duration: number;
  url: string;
}

export type RecordingState = "idle" | "recording" | "paused" | "processing";

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}
