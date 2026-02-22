import { inngest } from './client';

export const syncMessagesJob = inngest.createFunction(
  {
    id: 'sync-messages',
    name: 'Sync Messages for Account',
  },
  { event: 'mail/sync.requested' },
  async ({ event, step }) => {
    // Message sync logic will be implemented in Agent 3
    // This job performs delta sync for a specific account
    const { accountId } = event.data;
    return { accountId, messagesSynced: 0 };
  }
);
