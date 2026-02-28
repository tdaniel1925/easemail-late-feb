/**
 * AI Usage Tracking, Caching, and Rate Limiting
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createHash } from 'crypto';
import { consumeTokens, hasAIAccess } from './credits';

export type AIOperation = 'draft' | 'summarize' | 'smart_reply' | 'priority_score' | 'categorize';

export interface LogUsageParams {
  tenantId: string;
  userId: string;
  operation: AIOperation;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  messageId?: string;
}

/**
 * Model pricing (per million tokens)
 * From PROJECT-SPEC.md
 */
const PRICING = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-3-20250306': { input: 0.25, output: 1.25 },
} as const;

/**
 * Estimate cost for an AI operation
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const price =
    PRICING[model as keyof typeof PRICING] ||
    PRICING['claude-sonnet-4-20250514']; // Default to Sonnet pricing

  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

/**
 * Check if user has available tokens and pre-authorize the operation
 * Returns estimated tokens needed for the operation
 */
export async function checkRateLimit(
  userId: string,
  operation: AIOperation
): Promise<boolean> {
  // Check if user has AI access (not on starter plan)
  const hasAccess = await hasAIAccess(userId);
  if (!hasAccess) {
    return false;
  }

  // Estimate tokens needed for operation (from PROJECT-SPEC.md table)
  const estimatedTokens = getEstimatedTokens(operation);

  // Check if user has enough tokens
  const { allowed } = await consumeTokens(userId, estimatedTokens);

  return allowed;
}

/**
 * Get estimated token count for an operation (from PROJECT-SPEC.md)
 */
function getEstimatedTokens(operation: AIOperation): number {
  const TOKEN_ESTIMATES = {
    draft: 2800, // 2000 input + 800 output
    summarize: 1000, // 800 input + 200 output
    smart_reply: 900, // 600 input + 300 output
    priority_score: 250, // 200 input + 50 output
    categorize: 250, // 200 input + 50 output
  };

  return TOKEN_ESTIMATES[operation];
}

/**
 * Log AI usage to database
 */
export async function logUsage(params: LogUsageParams): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('ai_usage').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    operation: params.operation,
    model: params.model,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    estimated_cost_usd: params.estimatedCost,
    message_id: params.messageId,
  });

  if (error) {
    console.error('Failed to log AI usage:', error);
    // Don't throw - logging failures shouldn't break the user experience
  }
}

/**
 * Get cached AI result for a given operation and input
 */
export async function getCachedResult(
  operation: AIOperation,
  input: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const inputHash = hashInput(input);

  const { data, error } = await supabase
    .from('ai_cache')
    .select('result, hit_count')
    .eq('operation', operation)
    .eq('input_hash', inputHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  // Increment hit count and update last_accessed_at
  await supabase
    .from('ai_cache')
    .update({
      hit_count: data.hit_count + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('operation', operation)
    .eq('input_hash', inputHash);

  return data.result.text || null;
}

/**
 * Cache an AI result for future use
 */
export async function cacheResult(
  operation: AIOperation,
  input: string,
  result: string,
  ttlDays: number = 7
): Promise<void> {
  const supabase = createAdminClient();

  const inputHash = hashInput(input);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const { error } = await supabase.from('ai_cache').upsert(
    {
      operation,
      input_hash: inputHash,
      result: { text: result }, // Store as JSONB
      expires_at: expiresAt.toISOString(),
      hit_count: 1,
      last_accessed_at: new Date().toISOString(),
    },
    {
      onConflict: 'operation,input_hash',
    }
  );

  if (error) {
    console.error('Failed to cache AI result:', error);
    // Don't throw - caching failures shouldn't break the user experience
  }
}

/**
 * Hash input for cache lookup (SHA256)
 */
function hashInput(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Get AI usage statistics for a user (current month)
 */
export async function getUserUsageStats(userId: string): Promise<{
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  byOperation: Record<AIOperation, { calls: number; tokens: number; cost: number }>;
}> {
  const supabase = createAdminClient();

  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    throw new Error(`Failed to get usage stats: ${error.message}`);
  }

  const stats = {
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    byOperation: {
      draft: { calls: 0, tokens: 0, cost: 0 },
      summarize: { calls: 0, tokens: 0, cost: 0 },
      smart_reply: { calls: 0, tokens: 0, cost: 0 },
      priority_score: { calls: 0, tokens: 0, cost: 0 },
      categorize: { calls: 0, tokens: 0, cost: 0 },
    },
  };

  data?.forEach((record) => {
    const tokens = record.input_tokens + record.output_tokens;
    const cost = record.estimated_cost_usd;

    stats.totalCalls++;
    stats.totalTokens += tokens;
    stats.totalCost += cost;

    const operation = record.operation as AIOperation;
    if (stats.byOperation[operation]) {
      stats.byOperation[operation].calls++;
      stats.byOperation[operation].tokens += tokens;
      stats.byOperation[operation].cost += cost;
    }
  });

  return stats;
}

/**
 * Get tenant-level AI usage statistics (for admin dashboard)
 */
export async function getTenantUsageStats(tenantId: string): Promise<{
  totalCalls: number;
  totalCost: number;
  topUsers: Array<{ userId: string; calls: number; cost: number }>;
  topOperations: Array<{ operation: AIOperation; calls: number; cost: number }>;
}> {
  const supabase = createAdminClient();

  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    throw new Error(`Failed to get tenant usage stats: ${error.message}`);
  }

  // Aggregate stats
  const userMap = new Map<string, { calls: number; cost: number }>();
  const operationMap = new Map<AIOperation, { calls: number; cost: number }>();
  let totalCalls = 0;
  let totalCost = 0;

  data?.forEach((record) => {
    totalCalls++;
    totalCost += record.estimated_cost_usd;

    // User stats
    const userStats = userMap.get(record.user_id) || { calls: 0, cost: 0 };
    userStats.calls++;
    userStats.cost += record.estimated_cost_usd;
    userMap.set(record.user_id, userStats);

    // Operation stats
    const operation = record.operation as AIOperation;
    const opStats = operationMap.get(operation) || { calls: 0, cost: 0 };
    opStats.calls++;
    opStats.cost += record.estimated_cost_usd;
    operationMap.set(operation, opStats);
  });

  // Top 10 users
  const topUsers = Array.from(userMap.entries())
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  // Top operations
  const topOperations = Array.from(operationMap.entries())
    .map(([operation, stats]) => ({ operation, ...stats }))
    .sort((a, b) => b.cost - a.cost);

  return {
    totalCalls,
    totalCost,
    topUsers,
    topOperations,
  };
}

/**
 * Clean up expired cache entries (should be called by cron job)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const supabase = createAdminClient();

  const { error, count } = await supabase
    .from('ai_cache')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup expired cache:', error);
    return 0;
  }

  return count || 0;
}
