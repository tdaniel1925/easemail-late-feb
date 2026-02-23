"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface LightboxProps {
  images: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  const handlePrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentIndex((prev) => prev - 1);
      setZoom(1);
    }
  }, [canGoPrev]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
      setZoom(1);
    }
  }, [canGoNext]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-md bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        title="Close (Esc)"
      >
        <X size={24} strokeWidth={1.5} />
      </button>

      {/* Toolbar */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="rounded-md bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
          title="Zoom Out (-)"
        >
          <ZoomOut size={20} strokeWidth={1.5} />
        </button>
        <span className="rounded-md bg-black/50 px-3 py-2 text-sm text-white">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="rounded-md bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
          title="Zoom In (+)"
        >
          <ZoomIn size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleDownload}
          className="rounded-md bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          title="Download"
        >
          <Download size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-black/50 px-4 py-2 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Image name */}
      <div className="absolute bottom-16 left-1/2 z-10 max-w-2xl -translate-x-1/2 rounded-md bg-black/50 px-4 py-2 text-center text-sm text-white">
        {currentImage.name}
      </div>

      {/* Previous button */}
      {canGoPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-md bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          title="Previous (←)"
        >
          <ChevronLeft size={32} strokeWidth={1.5} />
        </button>
      )}

      {/* Next button */}
      {canGoNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-md bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          title="Next (→)"
        >
          <ChevronRight size={32} strokeWidth={1.5} />
        </button>
      )}

      {/* Image */}
      <div
        className="flex h-full w-full items-center justify-center overflow-auto p-16"
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="max-h-full max-w-full object-contain transition-transform"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
    </div>
  );
}
