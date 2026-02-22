import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { WebhookService } from '@/lib/graph/webhook-service';

/**
 * Webhook Renewal Job
 *
 * Runs every 12 hours to renew webhook subscriptions expiring within 24 hours
 * Microsoft Graph webhooks expire after 3 days max and must be renewed
 */
export const renewWebhooksJob = inngest.createFunction(
  {
    id: 'renew-webhooks',
    name: 'Renew Expiring Webhook Subscriptions',
  },
  { cron: '0 */12 * * *' }, // Every 12 hours
  async ({ event, step }) => {
    const result = await step.run('renew-expiring-webhooks', async () => {
      const supabase = createAdminClient();

      // Find subscriptions expiring in the next 24 hours
      const expiringSubscriptions = await WebhookService.getExpiringSoon();

      console.log(`[Webhook Renewal] Found ${expiringSubscriptions.length} subscriptions expiring soon`);

      let renewed = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const subscription of expiringSubscriptions) {
        try {
          console.log(`[Webhook Renewal] Renewing subscription ${subscription.ms_subscription_id} for account ${subscription.account_id}`);

          // Get Graph client for this account
          const graphClient = await createGraphClient(subscription.account_id);

          // Renew subscription
          const webhookService = new WebhookService(graphClient, subscription.account_id);
          await webhookService.renewSubscription(subscription.ms_subscription_id);

          renewed++;
        } catch (error: any) {
          console.error(`[Webhook Renewal] Failed to renew subscription ${subscription.ms_subscription_id}:`, error);
          failed++;
          errors.push(`${subscription.ms_subscription_id}: ${error.message}`);

          // If renewal fails, mark subscription as expired
          await supabase
            .from('webhook_subscriptions')
            .update({
              status: 'expired',
              error_message: error.message,
            })
            .eq('id', subscription.id);
        }

        // Rate limit: wait 100ms between renewals
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`[Webhook Renewal] Renewal complete: ${renewed} renewed, ${failed} failed`);

      return {
        total: expiringSubscriptions.length,
        renewed,
        failed,
        errors,
      };
    });

    return result;
  }
);
