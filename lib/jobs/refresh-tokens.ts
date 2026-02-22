import { inngest } from './client';
import { createClient } from '@/lib/supabase/server';
import { tokenService } from '@/lib/graph/token-service';

export const refreshTokensJob = inngest.createFunction(
  {
    id: 'refresh-tokens',
    name: 'Refresh Expiring Tokens',
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ event, step }) => {
    const results = await step.run('refresh-expiring-tokens', async () => {
      const supabase = await createClient();

      // Find tokens expiring in the next 30 minutes
      const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);

      const { data: expiringTokens, error } = await supabase
        .from('account_tokens')
        .select('account_id, expires_at, account:connected_accounts(email, status)')
        .lt('expires_at', thirtyMinutesFromNow.toISOString())
        .gt('refresh_failure_count', 0) // Only try if not already failing
        .order('expires_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Failed to query expiring tokens:', error);
        return { refreshed: 0, failed: 0, skipped: 0 };
      }

      if (!expiringTokens || expiringTokens.length === 0) {
        console.log('No expiring tokens found');
        return { refreshed: 0, failed: 0, skipped: 0 };
      }

      console.log(
        `Found ${expiringTokens.length} tokens expiring in the next 30 minutes`
      );

      let refreshed = 0;
      let failed = 0;
      let skipped = 0;

      for (const tokenRecord of expiringTokens) {
        const account = Array.isArray(tokenRecord.account)
          ? tokenRecord.account[0]
          : tokenRecord.account;

        // Skip accounts that are disabled or disconnected
        if (!account || ['disabled', 'disconnected'].includes(account.status)) {
          console.log(
            `Skipping ${tokenRecord.account_id} - account is ${account?.status}`
          );
          skipped++;
          continue;
        }

        try {
          console.log(
            `Refreshing token for account ${tokenRecord.account_id} (${account.email})`
          );

          await tokenService.refreshToken(tokenRecord.account_id);
          refreshed++;

          console.log(
            `Successfully refreshed token for ${tokenRecord.account_id}`
          );
        } catch (refreshError: any) {
          console.error(
            `Failed to refresh token for ${tokenRecord.account_id}:`,
            refreshError.message
          );
          failed++;

          // recordRefreshFailure is already called by tokenService.refreshToken
          // So we don't need to call it again here
        }

        // Rate limit: wait 100ms between refreshes to avoid overwhelming Microsoft
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(
        `Token refresh complete: ${refreshed} refreshed, ${failed} failed, ${skipped} skipped`
      );

      return { refreshed, failed, skipped };
    });

    return results;
  }
);
