/**
 * POST /api/ai/draft
 * Generate AI-drafted email from instruction
 * Agent 6.2 - Email Drafting
 *
 * RATE LIMITED: 20 requests per minute per user (AI endpoints are expensive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai/client';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { withRateLimit, getUserIdFromSession } from '@/lib/with-rate-limit';

async function handlePOST(request: NextRequest) {
  try {
    // Get authenticated user (respects RLS)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const {
      instruction,
      context,
      tone = 'professional',
      messageId,
    } = body;

    // Validate instruction
    if (!instruction || instruction.trim().length === 0) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      );
    }

    // Validate tone
    const validTones = ['professional', 'friendly', 'concise', 'formal'];
    if (!validTones.includes(tone)) {
      return NextResponse.json(
        { error: `Invalid tone. Must be one of: ${validTones.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate draft using AI client
    console.log(`[AI Draft] User ${user.email} requesting draft with tone: ${tone}`);

    try {
      const draftedEmail = await aiClient.draftEmail({
        userId: user.id,
        tenantId: user.tenant_id,
        instruction,
        context,
        tone: tone as 'professional' | 'friendly' | 'concise' | 'formal',
      });

      return NextResponse.json({
        draft: draftedEmail,
        tone,
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
  } catch (error: any) {
    console.error('[AI Draft] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate draft' },
      { status: 500 }
    );
  }
}

// Export POST handler with rate limiting
export const POST = withRateLimit(handlePOST, {
  type: 'ai',
  getUserId: getUserIdFromSession,
});

/**
 * GET /api/ai/draft
 * Get available tone options and usage info
 */
async function handleGET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's AI credits
    const { data: credits } = await supabase
      .from('user_ai_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      tones: [
        {
          value: 'professional',
          label: 'Professional',
          description: 'Formal and business-appropriate',
        },
        {
          value: 'friendly',
          label: 'Friendly',
          description: 'Warm and conversational',
        },
        {
          value: 'concise',
          label: 'Concise',
          description: 'Brief and to-the-point',
        },
        {
          value: 'formal',
          label: 'Formal',
          description: 'Very formal and respectful',
        },
      ],
      usage: credits
        ? {
            tokensUsed: credits.tokens_used,
            tokensAllocated: credits.tokens_allocated,
            tokensRemaining: credits.tokens_remaining,
            bonusTokens: credits.bonus_tokens_remaining,
          }
        : null,
    });
  } catch (error: any) {
    console.error('[AI Draft] Error fetching options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch draft options' },
      { status: 500 }
    );
  }
}

// Export GET handler with rate limiting
export const GET = withRateLimit(handleGET, {
  type: 'ai',
  getUserId: getUserIdFromSession,
});
