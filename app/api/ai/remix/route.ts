import { NextRequest, NextResponse } from "next/server";
import { remixEmail } from "@/lib/ai/client";

const MAX_TEXT_LENGTH = 50000; // Maximum text length

/**
 * POST /api/ai/remix
 * Improves existing email text with AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters.`,
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

    // Remix the email using Claude AI
    const result = await remixEmail(text);

    return NextResponse.json({
      improvedText: result.formattedText,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error("Remix email error:", error);

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
        error: error.message || "Failed to remix email",
      },
      { status: 500 }
    );
  }
}
