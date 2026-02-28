import { NextRequest, NextResponse } from "next/server";
import { formatDictation } from "@/lib/ai/client";

const MAX_TRANSCRIPT_LENGTH = 50000; // ~10 minutes of speech

/**
 * POST /api/ai/format-dictation
 * Formats a speech-to-text transcript into a professional email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript cannot be empty" },
        { status: 400 }
      );
    }

    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Transcript too long. Maximum ${MAX_TRANSCRIPT_LENGTH} characters.`,
        },
        { status: 413 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "AI service is not configured. Please contact your administrator.",
        },
        { status: 503 }
      );
    }

    // Format the transcript using Claude AI
    const result = await formatDictation(transcript);

    return NextResponse.json({
      formattedText: result.formattedText,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error("Format dictation error:", error);

    // Handle specific error types
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        {
          error:
            "AI service configuration error. Please contact your administrator.",
        },
        { status: 503 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        {
          error:
            "AI service is currently busy. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to format dictation",
      },
      { status: 500 }
    );
  }
}
