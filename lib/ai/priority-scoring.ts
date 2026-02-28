/**
 * AI Priority Scoring & Categorization
 * Background processing for new messages
 * Agent 6.5
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { aiClient } from './client';

export interface PriorityScore {
  score: number; // 0.0-1.0
  category: string;
  sentiment: string;
}

/**
 * Process priority scoring for a single message
 */
export async function scoreMessagePriority(
  messageId: string,
  accountId: string
): Promise<PriorityScore | null> {
  try {
    const supabase = createAdminClient();

    // Fetch message details
    const { data: message } = await supabase
      .from('messages')
      .select('id, from_name, from_address, subject, body_text, body_html, account_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      console.error(`[Priority Scoring] Message ${messageId} not found`);
      return null;
    }

    // Get account's user and tenant
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('user_id, email')
      .eq('id', accountId)
      .single();

    if (!account) {
      console.error(`[Priority Scoring] Account ${accountId} not found`);
      return null;
    }

    // Get user's tenant_id
    const { data: user } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', account.user_id)
      .single();

    if (!user) {
      console.error(`[Priority Scoring] User ${account.user_id} not found`);
      return null;
    }

    // Score the message using AI
    console.log(`[Priority Scoring] Scoring message ${messageId} from ${message.from_address}`);

    const result = await aiClient.scorePriority({
      userId: user.id,
      tenantId: user.tenant_id,
      messageId: message.id,
      from: message.from_address,
      subject: message.subject || '(No Subject)',
      body: message.body_text || message.body_html || '',
    });

    // Update message with AI metadata
    await supabase
      .from('messages')
      .update({
        ai_priority_score: result.score,
        ai_category: result.category,
        ai_sentiment: result.sentiment,
        ai_processed_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    console.log(
      `[Priority Scoring] ✓ Message ${messageId}: score=${result.score.toFixed(2)}, category=${result.category}, sentiment=${result.sentiment}`
    );

    return result;
  } catch (error: any) {
    console.error(`[Priority Scoring] Failed to score message ${messageId}:`, error.message);
    return null;
  }
}

/**
 * Process priority scoring for multiple messages (batch)
 */
export async function batchScoreMessages(
  messageIds: string[],
  accountId: string
): Promise<{ scored: number; failed: number }> {
  let scored = 0;
  let failed = 0;

  for (const messageId of messageIds) {
    const result = await scoreMessagePriority(messageId, accountId);
    if (result) {
      scored++;
    } else {
      failed++;
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { scored, failed };
}

/**
 * Get unprocessed messages for priority scoring
 */
export async function getUnprocessedMessages(
  accountId: string,
  limit: number = 50
): Promise<string[]> {
  const supabase = createAdminClient();

  const { data: messages } = await supabase
    .from('messages')
    .select('id')
    .eq('account_id', accountId)
    .is('ai_processed_at', null)
    .eq('is_deleted', false)
    .order('received_at', { ascending: false })
    .limit(limit);

  return messages?.map((m) => m.id) || [];
}

/**
 * Process priority scoring for all unprocessed messages in an account
 * This can be triggered after initial sync or periodically
 */
export async function processAccountPriorityScoring(
  accountId: string,
  batchSize: number = 50
): Promise<void> {
  console.log(`[Priority Scoring] Starting batch processing for account ${accountId}`);

  let totalScored = 0;
  let totalFailed = 0;

  while (true) {
    const messageIds = await getUnprocessedMessages(accountId, batchSize);

    if (messageIds.length === 0) {
      break; // No more unprocessed messages
    }

    console.log(`[Priority Scoring] Processing batch of ${messageIds.length} messages`);

    const { scored, failed } = await batchScoreMessages(messageIds, accountId);

    totalScored += scored;
    totalFailed += failed;

    console.log(`[Priority Scoring] Batch complete: ${scored} scored, ${failed} failed`);

    // If we got fewer messages than batch size, we're done
    if (messageIds.length < batchSize) {
      break;
    }
  }

  console.log(
    `[Priority Scoring] ✅ Complete: ${totalScored} messages scored, ${totalFailed} failed`
  );
}
