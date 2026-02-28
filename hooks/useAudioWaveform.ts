import { useState, useRef, useEffect, useCallback } from 'react';

const BAR_COUNT = 35; // Number of bars in waveform
const UPDATE_INTERVAL = 1000 / 60; // 60fps

interface UseAudioWaveformReturn {
  audioLevels: number[];
  isAnalyzing: boolean;
}

export function useAudioWaveform(
  stream: MediaStream | null,
  isActive: boolean
): UseAudioWaveformReturn {
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(BAR_COUNT).fill(0));
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isActive) {
      setAudioLevels(new Array(BAR_COUNT).fill(0));
      return;
    }

    const now = Date.now();
    if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }

    lastUpdateRef.current = now;

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Create bar levels by sampling frequency data
    const levels: number[] = [];
    const samplesPerBar = Math.floor(dataArrayRef.current.length / BAR_COUNT);

    for (let i = 0; i < BAR_COUNT; i++) {
      const start = i * samplesPerBar;
      const end = start + samplesPerBar;
      let sum = 0;

      for (let j = start; j < end; j++) {
        sum += dataArrayRef.current[j];
      }

      const average = sum / samplesPerBar;
      const normalized = average / 255; // Normalize to 0-1
      levels.push(normalized);
    }

    setAudioLevels(levels);
    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [isActive]);

  // Initialize Web Audio API when stream is available
  useEffect(() => {
    if (!stream || !isActive) {
      setIsAnalyzing(false);
      setAudioLevels(new Array(BAR_COUNT).fill(0));
      return;
    }

    try {
      // Create audio context
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 512; // Higher value = more frequency resolution
      analyser.smoothingTimeConstant = 0.8; // Smoothing for less jittery visualization

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsAnalyzing(true);
      analyze();
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
      setIsAnalyzing(false);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, isActive, analyze]);

  return {
    audioLevels,
    isAnalyzing,
  };
}
