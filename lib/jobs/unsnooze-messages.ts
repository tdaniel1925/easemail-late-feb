import { inngest } from './client';

export const unsnoozeMessagesJob = inngest.createFunction(
  {
    id: 'unsnooze-messages',
    name: 'Unsnooze Messages',
  },
  { cron: '*/1 * * * *' }, // Every minute
  async ({ event, step }) => {
    // Unsnooze logic will be implemented in Agent 5
    // This job returns snoozed messages to inbox where snooze_until <= NOW()
    return { unsnoozed: 0 };
  }
);
