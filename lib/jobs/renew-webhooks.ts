import { inngest } from './client';

export const renewWebhooksJob = inngest.createFunction(
  {
    id: 'renew-webhooks',
    name: 'Renew Expiring Webhooks',
  },
  { cron: '0 */12 * * *' }, // Every 12 hours
  async ({ event, step }) => {
    // Webhook renewal logic will be implemented in Agent 3
    // This job renews webhook subscriptions expiring in < 12 hours
    return { renewed: 0 };
  }
);
