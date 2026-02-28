/**
 * AI Client - Claude API Integration with Cost Management
 * Implements token-based credit system, caching, and usage tracking
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  checkRateLimit,
  logUsage,
  getCachedResult,
  cacheResult,
  estimateCost,
  type AIOperation,
} from './usage-tracker';
import { hasAIAccess } from './credits';

export interface AIGenerateParams {
  userId: string;
  tenantId: string;
  operation: AIOperation;
  prompt: string;
  model?:
    | 'claude-sonnet-4-20250514'
    | 'claude-haiku-3-20250306';
  maxTokens?: number;
  messageId?: string;
}

export interface AIGenerateResult {
  result: string;
  fromCache: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}

/**
 * Model selection by operation (from PROJECT-SPEC.md)
 */
const MODEL_BY_OPERATION: Record<AIOperation, string> = {
  draft: 'claude-sonnet-4-20250514', // Best quality for drafting
  summarize: 'claude-sonnet-4-20250514', // Best quality for summarization
  smart_reply: 'claude-sonnet-4-20250514', // Best quality for replies
  priority_score: 'claude-haiku-3-20250306', // Cheap & fast for scoring
  categorize: 'claude-haiku-3-20250306', // Cheap & fast for categorization
};

export class AIClient {
  private client: Anthropic | null = null;

  constructor() {
    // Don't initialize client in constructor - do it lazily when needed
    // This allows the module to be imported without requiring the API key
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          'ANTHROPIC_API_KEY is not configured. Please add it to your .env.local file.'
        );
      }

      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    return this.client;
  }

  /**
   * Generate AI response with cost management, caching, and rate limiting
   */
  async generate(params: AIGenerateParams): Promise<AIGenerateResult> {
    const {
      userId,
      tenantId,
      operation,
      prompt,
      model,
      maxTokens = 500,
      messageId,
    } = params;

    // 1. Check if user has AI access (not on starter plan)
    const hasAccess = await hasAIAccess(userId);
    if (!hasAccess) {
      throw new Error('AI_ACCESS_DENIED: Upgrade to Professional plan or higher to use AI features');
    }

    // 2. Check rate limit (token budget)
    const allowed = await checkRateLimit(userId, operation);
    if (!allowed) {
      throw new Error('AI_RATE_LIMIT_EXCEEDED: Insufficient AI tokens. Your monthly allocation has been reached.');
    }

    // 3. Check cache
    const cached = await getCachedResult(operation, prompt);
    if (cached) {
      console.log(`[AI] Cache hit for ${operation}`);
      return { result: cached, fromCache: true };
    }

    // 4. Select model based on operation
    const selectedModel = model || MODEL_BY_OPERATION[operation];

    // 5. Call Claude API
    console.log(`[AI] Calling Claude API for ${operation} with model ${selectedModel}`);

    const client = this.getClient(); // Get client (validates API key)
    const response = await client.messages.create({
      model: selectedModel,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = response.content[0].type === 'text' ? response.content[0].text : '';

    // 6. Log usage and cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = estimateCost(selectedModel, inputTokens, outputTokens);

    await logUsage({
      tenantId,
      userId,
      operation,
      model: selectedModel,
      inputTokens,
      outputTokens,
      estimatedCost: cost,
      messageId,
    });

    console.log(
      `[AI] ${operation} completed: ${inputTokens} input + ${outputTokens} output tokens (~$${cost.toFixed(6)})`
    );

    // 7. Cache result for future use (7 day TTL)
    await cacheResult(operation, prompt, result);

    return {
      result,
      fromCache: false,
      usage: {
        inputTokens,
        outputTokens,
        estimatedCost: cost,
      },
    };
  }

  /**
   * Draft an email from a prompt
   */
  async draftEmail(params: {
    userId: string;
    tenantId: string;
    instruction: string;
    context?: string;
    tone?: 'professional' | 'friendly' | 'concise' | 'formal';
  }): Promise<string> {
    const { instruction, context, tone = 'professional' } = params;

    const prompt = buildDraftPrompt(instruction, context, tone);

    const result = await this.generate({
      ...params,
      operation: 'draft',
      prompt,
      maxTokens: 1000,
    });

    return result.result;
  }

  /**
   * Summarize an email thread
   */
  async summarizeThread(params: {
    userId: string;
    tenantId: string;
    messages: Array<{ from: string; subject: string; body: string; date: string }>;
  }): Promise<{ summary: string; actionItems: string[] }> {
    const prompt = buildSummarizePrompt(params.messages);

    const result = await this.generate({
      ...params,
      operation: 'summarize',
      prompt,
      maxTokens: 300,
    });

    // Parse the result (expecting JSON format)
    try {
      const parsed = JSON.parse(result.result);
      return {
        summary: parsed.summary || result.result,
        actionItems: parsed.action_items || [],
      };
    } catch {
      // Fallback if not JSON
      return {
        summary: result.result,
        actionItems: [],
      };
    }
  }

  /**
   * Generate smart reply suggestions
   */
  async generateSmartReplies(params: {
    userId: string;
    tenantId: string;
    messageBody: string;
    messageSubject: string;
    messageFrom: string;
  }): Promise<{ short: string; medium: string; detailed: string }> {
    const prompt = buildSmartReplyPrompt(
      params.messageBody,
      params.messageSubject,
      params.messageFrom
    );

    const result = await this.generate({
      ...params,
      operation: 'smart_reply',
      prompt,
      maxTokens: 400,
    });

    // Parse the result (expecting JSON format)
    try {
      const parsed = JSON.parse(result.result);
      return {
        short: parsed.short || 'Thanks!',
        medium: parsed.medium || 'Thank you for your message. I will get back to you soon.',
        detailed:
          parsed.detailed ||
          'Thank you for reaching out. I have received your message and will review it carefully. I will get back to you with a detailed response shortly.',
      };
    } catch {
      // Fallback if not JSON
      return {
        short: 'Thanks!',
        medium: 'Thank you for your message.',
        detailed: result.result,
      };
    }
  }

  /**
   * Score message priority (0.0-1.0)
   */
  async scorePriority(params: {
    userId: string;
    tenantId: string;
    messageId: string;
    from: string;
    subject: string;
    body: string;
  }): Promise<{ score: number; category: string; sentiment: string }> {
    const prompt = buildPriorityScorePrompt(params.from, params.subject, params.body);

    const result = await this.generate({
      ...params,
      operation: 'priority_score',
      prompt,
      maxTokens: 100,
    });

    // Parse the result (expecting JSON format)
    try {
      const parsed = JSON.parse(result.result);
      return {
        score: parsed.score || 0.5,
        category: parsed.category || 'general',
        sentiment: parsed.sentiment || 'neutral',
      };
    } catch {
      // Fallback if not JSON
      return {
        score: 0.5,
        category: 'general',
        sentiment: 'neutral',
      };
    }
  }
}

/**
 * Build prompt for email drafting
 */
function buildDraftPrompt(
  instruction: string,
  context: string | undefined,
  tone: string
): string {
  return `You are an email drafting assistant. Write a professional email based on the user's instruction.

Instruction: ${instruction}

${context ? `Context/Thread History:\n${context}\n` : ''}

Tone: ${tone}

Write ONLY the email body (no subject line, no signatures). Return plain text or HTML if formatting is needed.`;
}

/**
 * Build prompt for thread summarization
 */
function buildSummarizePrompt(
  messages: Array<{ from: string; subject: string; body: string; date: string }>
): string {
  const threadText = messages
    .map((m, i) => `Message ${i + 1} (${m.date} from ${m.from}):\n${m.body}\n`)
    .join('\n---\n');

  return `Summarize the following email thread. Provide a 2-3 sentence summary and extract any action items.

${threadText}

Return your response in JSON format:
{
  "summary": "2-3 sentence summary of the thread",
  "action_items": ["action 1", "action 2", ...]
}`;
}

/**
 * Build prompt for smart replies
 */
function buildSmartReplyPrompt(
  messageBody: string,
  messageSubject: string,
  messageFrom: string
): string {
  return `Generate 3 reply suggestions for this email (short, medium, detailed).

Subject: ${messageSubject}
From: ${messageFrom}

Message:
${messageBody}

Return your response in JSON format:
{
  "short": "Brief reply (5-10 words)",
  "medium": "Medium reply (1-2 sentences)",
  "detailed": "Detailed reply (2-3 sentences)"
}`;
}

/**
 * Build prompt for priority scoring
 */
function buildPriorityScorePrompt(
  from: string,
  subject: string,
  body: string
): string {
  return `Analyze this email and provide a priority score (0.0-1.0), category, and sentiment.

From: ${from}
Subject: ${subject}

Body:
${body.substring(0, 500)}

Return your response in JSON format:
{
  "score": 0.8,  // 0.0 = low priority, 1.0 = high priority
  "category": "client_communication" | "internal" | "newsletter" | "notification" | "urgent" | "general",
  "sentiment": "positive" | "neutral" | "negative" | "urgent"
}`;
}

/**
 * Format speech-to-text transcript into professional email
 */
export async function formatDictation(transcript: string): Promise<{
  formattedText: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are an email formatting assistant. Convert the following dictated speech into a well-formatted professional email.

CRITICAL FORMATTING RULES:
1. Start with the greeting (e.g., "Hi John,")
2. Add a BLANK LINE after the greeting
3. Format the main body content into clear paragraphs
4. Separate body paragraphs with BLANK LINES (\\n\\n)
5. The final closing sentence (e.g., "I'll buzz you later", "Let me know", "Talk soon") should be on its own line
6. Add a BLANK LINE before the final closing sentence
7. Fix grammar and punctuation
8. Remove filler words and verbal tics ("um", "uh", "like", etc.)
9. Maintain the speaker's tone and intent
10. Return ONLY the formatted email body text (no subject line, no signature block)

EXAMPLE FORMAT:
Hi [Name],

[First paragraph of content]

[Second paragraph if needed]

[Final closing sentence]

Dictated speech:
${transcript}

Formatted email:`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const formattedText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  return {
    formattedText,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

/**
 * Improve/rewrite email text with AI
 */
export async function remixEmail(text: string): Promise<{
  formattedText: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are an email writing assistant. Improve the following email text by:

- Fixing grammar and spelling errors
- Making it clearer and more concise
- Improving professionalism while maintaining the original tone
- Better organizing the content
- Preserving the original meaning and intent

Return ONLY the improved email text in plain text format with double line breaks (\\n\\n) between paragraphs. Do not add subject lines or signatures.

Original text:
${text}

Improved version:`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const formattedText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  return {
    formattedText,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

// Export singleton instance
export const aiClient = new AIClient();
