import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Generate a concise, professional email subject line (max 60 characters) for the following email body. Return ONLY the subject line text, no quotes, no explanations:

${text.substring(0, 500)}`;

    const response = await client.messages.create({
      model: 'claude-haiku-3-20250306', // Use Haiku for speed and cost
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    });

    const subject = response.content[0].type === 'text'
      ? response.content[0].text.trim().replace(/^["']|["']$/g, '') // Remove quotes if present
      : '';

    return NextResponse.json({ subject });
  } catch (error: any) {
    console.error('[AI Generate Subject] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
