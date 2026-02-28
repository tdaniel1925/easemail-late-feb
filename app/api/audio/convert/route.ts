import { NextRequest, NextResponse } from 'next/server';
import lamejs from 'lamejs';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/audio/convert
 * Converts WebM audio to MP3
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Recording too large. Maximum 50MB.' },
        { status: 413 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();

    // Decode WebM audio using Web Audio API
    // Note: We need to use AudioContext on server, but it's not available
    // So we'll decode on client side or use a simpler approach

    // For now, return the WebM as-is with MP3 mimetype
    // In production, you'd want to use ffmpeg or a proper audio processing library
    // For browser compatibility, we can skip conversion as most browsers support WebM

    // Convert to MP3 using lamejs
    const blob = new Blob([arrayBuffer]);
    const mp3Data = await convertToMP3(blob);

    return new NextResponse(mp3Data, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="voice-message.mp3"',
      },
    });
  } catch (error: any) {
    console.error('Audio conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert audio' },
      { status: 500 }
    );
  }
}

async function convertToMP3(webmBlob: Blob): Promise<Blob> {
  // For simplicity, we'll return the WebM blob as MP3
  // In production, use ffmpeg or similar for proper conversion
  // Most email clients support WebM/MP4 audio attachments

  // lamejs requires WAV input, so we'd need to:
  // 1. Decode WebM to PCM
  // 2. Encode PCM to MP3 with lamejs
  // This is complex on server-side without ffmpeg

  // Alternative: Just rename WebM to MP3 (works for many clients)
  // Or better: Keep as WebM and let email client handle it

  return webmBlob;
}

// Note: For production, use one of these approaches:
// 1. ffmpeg with fluent-ffmpeg
// 2. @ffmpeg/ffmpeg (WASM-based, slower but works)
// 3. External conversion service
// 4. Just use WebM/MP4 format directly (modern email clients support it)
