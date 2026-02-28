/**
 * POST /api/ai/summarize
 * Generate AI summary of email thread
 * Agent 6.3 - Thread Summarization
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai/client';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (respects RLS)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const { messages, messageIds } = body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      // If messageIds provided instead, fetch messages
      if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
        const { data: fetchedMessages } = await supabase
          .from('messages')
          .select('subject, from_name, from_address, body_text, body_html, sent_at')
          .in('id', messageIds)
          .order('sent_at', { ascending: true });

        if (!fetchedMessages || fetchedMessages.length === 0) {
          return NextResponse.json(
            { error: 'No messages found' },
            { status: 404 }
          );
        }

        // Format messages for AI
        const formattedMessages = fetchedMessages.map((msg) => ({
          from: msg.from_name || msg.from_address,
          subject: msg.subject,
          body: msg.body_text || msg.body_html || '',
          date: new Date(msg.sent_at).toLocaleDateString(),
        }));

        return await generateSummary(user, formattedMessages);
      }

      return NextResponse.json(
        { error: 'Messages array or messageIds is required' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.from || !msg.body) {
        return NextResponse.json(
          { error: 'Each message must have "from" and "body" fields' },
          { status: 400 }
        );
      }
    }

    return await generateSummary(user, messages);
  } catch (error: any) {
    console.error('[AI Summarize] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

async function generateSummary(
  user: { id: string; tenant_id: string; email: string },
  messages: Array<{ from: string; subject?: string; body: string; date?: string }>
) {
  try {
    console.log(`[AI Summarize] User ${user.email} summarizing ${messages.length} messages`);

    const result = await aiClient.summarizeThread({
      userId: user.id,
      tenantId: user.tenant_id,
      messages: messages.map((msg) => ({
        from: msg.from,
        subject: msg.subject || '(No Subject)',
        body: msg.body,
        date: msg.date || new Date().toLocaleDateString(),
      })),
    });

    return NextResponse.json({
      summary: result.summary,
      actionItems: result.actionItems,
      messageCount: messages.length,
      success: true,
    });
  } catch (error: any) {
    // Handle specific AI errors
    if (error.message.includes('AI_ACCESS_DENIED')) {
      return NextResponse.json(
        {
          error: 'AI features require Professional plan or higher',
          code: 'AI_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    if (error.message.includes('AI_RATE_LIMIT_EXCEEDED')) {
      return NextResponse.json(
        {
          error: 'AI token limit reached. Your monthly allocation has been used.',
          code: 'AI_RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // Generic AI error
    throw error;
  }
}
