/**
 * AI Token Credit Management
 * Manages monthly token allocations and bonus credits per user
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface UserCredits {
  id: string;
  user_id: string;
  tenant_id: string;
  plan: 'starter' | 'professional' | 'team' | 'enterprise';
  tokens_allocated: number;
  tokens_used: number;
  tokens_remaining: number;
  last_reset_at: string;
  next_reset_at: string;
  bonus_tokens: number;
  bonus_tokens_used: number;
  bonus_tokens_remaining: number;
}

/**
 * Token budgets by plan (from PROJECT-SPEC.md)
 */
export const TOKEN_BUDGETS = {
  starter: 0, // AI disabled
  professional: 500_000, // ~170 draft operations or ~2000 summaries
  team: 1_500_000, // ~500 drafts or ~6000 summaries
  enterprise: 5_000_000, // ~1700 drafts or ~20000 summaries
} as const;

/**
 * Get user's AI credit balance
 */
export async function getUserCredits(userId: string): Promise<UserCredits> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_ai_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get user credits: ${error.message}`);
  }

  if (!data) {
    throw new Error('User AI credits not found');
  }

  return data;
}

/**
 * Initialize AI credits for a new user
 */
export async function initializeUserCredits(
  userId: string,
  tenantId: string,
  plan: keyof typeof TOKEN_BUDGETS
): Promise<UserCredits> {
  const supabase = createAdminClient();

  const tokensAllocated = TOKEN_BUDGETS[plan];

  const { data, error } = await supabase
    .from('user_ai_credits')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      plan,
      tokens_allocated: tokensAllocated,
      tokens_used: 0,
      last_reset_at: new Date().toISOString(),
      next_reset_at: getNextResetDate().toISOString(),
      bonus_tokens: 0,
      bonus_tokens_used: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to initialize user credits: ${error.message}`);
  }

  return data;
}

/**
 * Reset monthly credits (called by cron job or when checking if reset is due)
 */
export async function resetMonthlyCredits(userId: string): Promise<void> {
  const supabase = createAdminClient();

  const credits = await getUserCredits(userId);

  // Update allocation based on current plan
  const tokensAllocated = TOKEN_BUDGETS[credits.plan];

  const { error } = await supabase
    .from('user_ai_credits')
    .update({
      tokens_used: 0,
      tokens_allocated: tokensAllocated,
      last_reset_at: new Date().toISOString(),
      next_reset_at: getNextResetDate().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to reset monthly credits: ${error.message}`);
  }
}

/**
 * Consume tokens from user's balance
 * Bonus tokens are used first, then monthly allocation
 */
export async function consumeTokens(
  userId: string,
  tokensNeeded: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createAdminClient();

  let credits = await getUserCredits(userId);

  // Check if reset is needed
  const now = new Date();
  const nextReset = new Date(credits.next_reset_at);

  if (now >= nextReset) {
    await resetMonthlyCredits(userId);
    credits = await getUserCredits(userId); // Re-fetch after reset
  }

  // Calculate available tokens (bonus tokens used first)
  const bonusAvailable = credits.bonus_tokens - credits.bonus_tokens_used;
  const monthlyAvailable = credits.tokens_allocated - credits.tokens_used;
  const totalAvailable = bonusAvailable + monthlyAvailable;

  if (tokensNeeded > totalAvailable) {
    return { allowed: false, remaining: totalAvailable };
  }

  // Consume bonus tokens first, then monthly allocation
  if (bonusAvailable >= tokensNeeded) {
    // Use only bonus tokens
    const { error } = await supabase
      .from('user_ai_credits')
      .update({
        bonus_tokens_used: credits.bonus_tokens_used + tokensNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to consume bonus tokens: ${error.message}`);
    }
  } else if (bonusAvailable > 0) {
    // Use all bonus tokens, then monthly
    const monthlyNeeded = tokensNeeded - bonusAvailable;
    const { error } = await supabase
      .from('user_ai_credits')
      .update({
        bonus_tokens_used: credits.bonus_tokens, // Use all bonus tokens
        tokens_used: credits.tokens_used + monthlyNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to consume tokens: ${error.message}`);
    }
  } else {
    // Use only monthly tokens
    const { error } = await supabase
      .from('user_ai_credits')
      .update({
        tokens_used: credits.tokens_used + tokensNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to consume monthly tokens: ${error.message}`);
    }
  }

  return { allowed: true, remaining: totalAvailable - tokensNeeded };
}

/**
 * Add bonus tokens to user's account
 * Use cases: onboarding, referrals, apologies, promotions
 */
export async function addBonusTokens(
  userId: string,
  bonusTokens: number,
  reason?: string
): Promise<void> {
  const supabase = createAdminClient();

  const credits = await getUserCredits(userId);

  const { error } = await supabase
    .from('user_ai_credits')
    .update({
      bonus_tokens: credits.bonus_tokens + bonusTokens,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to add bonus tokens: ${error.message}`);
  }

  console.log(
    `Added ${bonusTokens} bonus tokens to user ${userId}${reason ? ` (${reason})` : ''}`
  );
}

/**
 * Update user's plan and token allocation
 */
export async function updateUserPlan(
  userId: string,
  newPlan: keyof typeof TOKEN_BUDGETS
): Promise<void> {
  const supabase = createAdminClient();

  const tokensAllocated = TOKEN_BUDGETS[newPlan];

  const { error } = await supabase
    .from('user_ai_credits')
    .update({
      plan: newPlan,
      tokens_allocated: tokensAllocated,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update user plan: ${error.message}`);
  }
}

/**
 * Get total tokens consumed by a user (current month)
 */
export async function getMonthlyUsage(userId: string): Promise<{
  tokensUsed: number;
  tokensAllocated: number;
  percentUsed: number;
}> {
  const credits = await getUserCredits(userId);

  const percentUsed =
    credits.tokens_allocated > 0
      ? (credits.tokens_used / credits.tokens_allocated) * 100
      : 0;

  return {
    tokensUsed: credits.tokens_used,
    tokensAllocated: credits.tokens_allocated,
    percentUsed: Math.round(percentUsed),
  };
}

/**
 * Calculate next monthly reset date (30 days from now)
 */
function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
}

/**
 * Check if user has AI access based on plan
 */
export async function hasAIAccess(userId: string): Promise<boolean> {
  try {
    const credits = await getUserCredits(userId);
    return credits.plan !== 'starter'; // Starter plan has AI disabled
  } catch (error) {
    return false;
  }
}
