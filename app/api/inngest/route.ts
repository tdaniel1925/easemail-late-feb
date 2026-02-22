import { serve } from 'inngest/next';
import { inngest } from '@/lib/jobs/client';
import { refreshTokensJob } from '@/lib/jobs/refresh-tokens';
import { renewWebhooksJob } from '@/lib/jobs/renew-webhooks';
import { syncMessagesJob } from '@/lib/jobs/sync-messages';
import { sendScheduledJob } from '@/lib/jobs/send-scheduled';
import { unsnoozeMessagesJob } from '@/lib/jobs/unsnooze-messages';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    refreshTokensJob,
    renewWebhooksJob,
    syncMessagesJob,
    sendScheduledJob,
    unsnoozeMessagesJob,
  ],
});
