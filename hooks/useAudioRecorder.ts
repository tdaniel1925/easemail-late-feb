import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioRecording, RecordingState } from '@/types/audio';

const MAX_RECORDING_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

interface UseAudioRecorderReturn {
  state: RecordingState;
  duration: number;
  audioLevel: number;
  recording: AudioRecording | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();

  // Analyze audio levels for waveform
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume (0-1)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = average / 255;

    setAudioLevel(normalizedLevel);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setAudioLevel(0);
  }, []);

  // Update duration timer
  const updateDuration = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
    setDuration(elapsed);

    // Auto-stop at 10 minutes
    if (elapsed >= MAX_RECORDING_TIME) {
      stopRecording();
      setError('Maximum recording time (10 minutes) reached');
    }
  }, [stopRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up Web Audio API for level analysis
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const finalDuration = duration;

        setRecording({
          blob,
          url,
          duration: finalDuration,
        });

        setState('idle');

        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };

      // Start recording
      mediaRecorder.start(100); // Capture in 100ms chunks
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setState('recording');

      // Start analysis and timer
      analyzeAudio();
      timerRef.current = setInterval(updateDuration, 100);

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access required');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found');
      } else {
        setError('Failed to start recording');
      }
      setState('idle');
    }
  }, [analyzeAudio, updateDuration, duration]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      pausedTimeRef.current = Date.now() - startTimeRef.current;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setAudioLevel(0);
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');

      const pauseDuration = Date.now() - pausedTimeRef.current - startTimeRef.current;
      pausedTimeRef.current += pauseDuration;

      analyzeAudio();
      timerRef.current = setInterval(updateDuration, 100);
    }
  }, [analyzeAudio, updateDuration]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
    setRecording(null);
    setDuration(0);
    setError(null);
  }, [recording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      if (recording?.url) {
        URL.revokeObjectURL(recording.url);
      }
    };
  }, [recording]);

  return {
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
  };
}
