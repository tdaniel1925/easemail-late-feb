/**
 * POST /api/ai/smart-replies
 * Generate smart reply suggestions for email
 * Agent 6.4 - Smart Replies
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
    const { messageId, messageBody, messageSubject, messageFrom } = body;

    // Validate input - either messageId or all message fields required
    if (!messageId && (!messageBody || !messageFrom)) {
      if (messageId) {
        // Fetch message from database
        const { data: message } = await supabase
          .from('messages')
          .select('subject, from_name, from_address, body_text, body_html')
          .eq('id', messageId)
          .single();

        if (!message) {
          return NextResponse.json(
            { error: 'Message not found' },
            { status: 404 }
          );
        }

        return await generateReplies(user, {
          body: message.body_text || message.body_html || '',
          subject: message.subject,
          from: message.from_name || message.from_address,
        });
      }

      return NextResponse.json(
        { error: 'Either messageId or (messageBody, messageFrom) is required' },
        { status: 400 }
      );
    }

    return await generateReplies(user, {
      body: messageBody,
      subject: messageSubject || '(No Subject)',
      from: messageFrom,
    });
  } catch (error: any) {
    console.error('[AI Smart Replies] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate smart replies' },
      { status: 500 }
    );
  }
}

async function generateReplies(
  user: { id: string; tenant_id: string; email: string },
  message: { body: string; subject: string; from: string }
) {
  try {
    console.log(`[AI Smart Replies] User ${user.email} generating replies for message from ${message.from}`);

    const replies = await aiClient.generateSmartReplies({
      userId: user.id,
      tenantId: user.tenant_id,
      messageBody: message.body,
      messageSubject: message.subject,
      messageFrom: message.from,
    });

    return NextResponse.json({
      replies: [
        {
          type: 'short',
          label: 'Quick Reply',
          text: replies.short,
        },
        {
          type: 'medium',
          label: 'Standard Reply',
          text: replies.medium,
        },
        {
          type: 'detailed',
          label: 'Detailed Reply',
          text: replies.detailed,
        },
      ],
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
