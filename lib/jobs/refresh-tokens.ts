import { inngest } from './client';

export const refreshTokensJob = inngest.createFunction(
  {
    id: 'refresh-tokens',
    name: 'Refresh Expiring Tokens',
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ event, step }) => {
    // Token refresh logic will be implemented in Agent 2
    // This job proactively refreshes tokens expiring in < 5 minutes
    return { refreshed: 0 };
  }
);
