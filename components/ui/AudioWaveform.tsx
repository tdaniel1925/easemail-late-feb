"use client";

import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  audioLevels: number[];
  isRecording: boolean;
  className?: string;
}

export function AudioWaveform({ audioLevels, isRecording, className = "" }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousLevelsRef = useRef<number[]>(audioLevels);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match display size (for sharp rendering)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barCount = audioLevels.length;
    const barWidth = (width / barCount) * 0.7; // 70% width for bars, 30% for gaps
    const gap = (width / barCount) * 0.3;

    // Smooth transition between previous and current levels
    const currentLevels = audioLevels.map((level, i) => {
      const prev = previousLevelsRef.current[i] || 0;
      const smoothing = 0.3;
      return prev + (level - prev) * smoothing;
    });

    previousLevelsRef.current = currentLevels;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw bars
    currentLevels.forEach((level, i) => {
      const x = i * (barWidth + gap);
      const barHeight = Math.max(level * height * 0.8, 2); // Min 2px height
      const y = (height - barHeight) / 2; // Center vertically

      // Rounded rectangle for each bar
      const radius = barWidth / 2;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, radius);

      // Color based on recording state and level
      if (isRecording) {
        // Active recording: coral gradient based on level
        const intensity = Math.min(level + 0.3, 1); // Add base intensity
        ctx.fillStyle = `rgba(255, 127, 80, ${intensity})`; // Coral #FF7F50
      } else {
        // Inactive: grayscale
        ctx.fillStyle = "#6B7280"; // gray-500
      }

      ctx.fill();
    });
  }, [audioLevels, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: "80px" }}
    />
  );
}
