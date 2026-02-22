import { inngest } from './client';

export const sendScheduledJob = inngest.createFunction(
  {
    id: 'send-scheduled',
    name: 'Send Scheduled Messages',
  },
  { cron: '*/1 * * * *' }, // Every minute
  async ({ event, step }) => {
    // Scheduled send logic will be implemented in Agent 4
    // This job sends messages where scheduled_for <= NOW()
    return { sent: 0 };
  }
);
