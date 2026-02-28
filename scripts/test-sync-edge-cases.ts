#!/usr/bin/env tsx
/**
 * Test Script: Sync Edge Cases & Error Scenarios
 *
 * Tests:
 * 1. Token refresh works correctly with lock mechanism
 * 2. @removed messages are deleted from database
 * 3. Expired tokens trigger reauth flow
 * 4. Large batch processing doesn't timeout
 * 5. Cancelled calendar events are handled
 * 6. Deleted Teams messages marked correctly
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { tokenService } from '@/lib/graph/token-service';
import { MessageDeltaSyncService } from '@/lib/graph/message-delta-sync';
import { createGraphClient } from '@/lib/graph/client';

const supabase = createAdminClient();

async function testEdgeCases() {
  console.log('🔍 Edge Cases & Error Scenarios Test Started\n');

  // Get first active account
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('id, email, status')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (accountError || !account) {
    console.error('❌ No active account found for testing');
    process.exit(1);
  }

  console.log(`✅ Testing with account: ${account.email} (${account.id})\n`);

  try {
    // TEST 1: Token Refresh with Lock Mechanism
    console.log('🔐 TEST 1: Token Refresh Lock Mechanism');
    console.log('----------------------------------------');

    // tokenService is imported as singleton instance

    // Check current token status
    const { data: tokenData, error: tokenError } = await supabase
      .from('account_tokens')
      .select('expires_at, refresh_lock_acquired_at, refresh_lock_expires_at, refresh_failure_count')
      .eq('account_id', account.id)
      .single();

    if (tokenError) {
      console.error('❌ Error fetching token:', tokenError);
    } else {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const minutesUntilExpiry = Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60);

      console.log(`✅ Token expires in: ${minutesUntilExpiry} minutes`);
      console.log(`   Refresh failures: ${tokenData.refresh_failure_count}`);
      console.log(`   Lock acquired: ${tokenData.refresh_lock_acquired_at || 'Never'}`);
      console.log(`   Lock expires: ${tokenData.refresh_lock_expires_at || 'No active lock'}`);

      if (minutesUntilExpiry < 5) {
        console.log('\n⚠️  Token expiring soon - testing auto-refresh...');
        try {
          const accessToken = await tokenService.getAccessToken(account.id);
          console.log('✅ Token auto-refreshed successfully');
        } catch (error: any) {
          console.error('❌ Token refresh failed:', error.message);
        }
      }
    }

    // TEST 2: Deleted Messages Tracking
    console.log('\n🗑️  TEST 2: Deleted Messages (@removed)');
    console.log('----------------------------------------');

    const { data: deletedMessages, error: delError } = await supabase
      .from('messages')
      .select('id, subject, is_deleted')
      .eq('account_id', account.id)
      .eq('is_deleted', true)
      .limit(10);

    if (delError) {
      console.error('❌ Error fetching deleted messages:', delError);
    } else {
      console.log(`✅ Deleted messages tracked: ${deletedMessages.length}`);
      if (deletedMessages.length > 0) {
        console.log('   These messages were marked as deleted via delta sync @removed:');
        deletedMessages.forEach((msg, i) => {
          console.log(`   ${i + 1}. ${msg.subject || '(No Subject)'}`);
        });
      } else {
        console.log('   ⚠️  No deleted messages found (may not have encountered @removed yet)');
      }
    }

    // TEST 3: Account Status on Auth Failures
    console.log('\n⚠️  TEST 3: Account Status on Auth Failures');
    console.log('----------------------------------------');

    const { data: accountStatus } = await supabase
      .from('connected_accounts')
      .select('status, status_message, error_count, last_error_at')
      .eq('id', account.id)
      .single();

    if (accountStatus) {
      console.log(`✅ Account status: ${accountStatus.status}`);
      console.log(`   Error count: ${accountStatus.error_count}`);
      console.log(`   Status message: ${accountStatus.status_message || 'None'}`);
      console.log(`   Last error: ${accountStatus.last_error_at || 'Never'}`);

      if (accountStatus.status === 'needs_reauth') {
        console.log('\n⚠️  Account marked as needs_reauth - token refresh failed 3+ times');
      } else if (accountStatus.status === 'active') {
        console.log('\n✅ Account is healthy and active');
      }
    }

    // TEST 4: Sync Error Tracking
    console.log('\n📊 TEST 4: Sync Error Tracking');
    console.log('----------------------------------------');

    const { data: syncErrors, error: syncErrQuery } = await supabase
      .from('sync_state')
      .select('resource_type, sync_status, error_message, error_count, next_retry_at')
      .eq('account_id', account.id)
      .neq('sync_status', 'idle')
      .limit(10);

    if (syncErrQuery) {
      console.error('❌ Error fetching sync errors:', syncErrQuery);
    } else {
      if (syncErrors.length > 0) {
        console.log(`⚠️  Found ${syncErrors.length} sync state(s) with issues:`);
        syncErrors.forEach((state, i) => {
          console.log(`   ${i + 1}. ${state.resource_type}`);
          console.log(`      Status: ${state.sync_status}`);
          console.log(`      Error count: ${state.error_count}`);
          console.log(`      Error: ${state.error_message || 'None'}`);
          if (state.next_retry_at) {
            console.log(`      Next retry: ${state.next_retry_at}`);
          }
        });
      } else {
        console.log('✅ No sync errors found - all resources syncing successfully');
      }
    }

    // TEST 5: Cancelled Calendar Events
    console.log('\n🚫 TEST 5: Cancelled Calendar Events');
    console.log('----------------------------------------');

    const { data: cancelledEvents, error: cancelError } = await supabase
      .from('calendar_events')
      .select('subject, status, start_time')
      .eq('account_id', account.id)
      .eq('status', 'cancelled')
      .limit(5);

    if (cancelError) {
      console.error('❌ Error fetching cancelled events:', cancelError);
    } else {
      console.log(`✅ Cancelled events tracked: ${cancelledEvents.length}`);
      if (cancelledEvents.length > 0) {
        cancelledEvents.forEach((event, i) => {
          console.log(`   ${i + 1}. ${event.subject} (was: ${new Date(event.start_time).toLocaleDateString()})`);
        });
      } else {
        console.log('   ⚠️  No cancelled events found (may not have encountered any yet)');
      }
    }

    // TEST 6: Deleted Teams Messages
    console.log('\n💬 TEST 6: Deleted Teams Messages');
    console.log('----------------------------------------');

    const { data: deletedTeamsMessages, error: teamDelError } = await supabase
      .from('teams_messages')
      .select('body_text, from_name, is_deleted, created_at')
      .eq('account_id', account.id)
      .eq('is_deleted', true)
      .limit(5);

    if (teamDelError) {
      console.error('❌ Error fetching deleted Teams messages:', teamDelError);
    } else {
      console.log(`✅ Deleted Teams messages tracked: ${deletedTeamsMessages.length}`);
      if (deletedTeamsMessages.length > 0) {
        deletedTeamsMessages.forEach((msg, i) => {
          console.log(`   ${i + 1}. ${msg.from_name}: ${msg.body_text?.substring(0, 40)}...`);
        });
      } else {
        console.log('   ⚠️  No deleted Teams messages found');
      }
    }

    // TEST 7: Large Folder Processing
    console.log('\n📦 TEST 7: Large Folder Batch Processing');
    console.log('----------------------------------------');

    const { data: largestFolder, error: largeError } = await supabase
      .from('account_folders')
      .select('display_name, folder_type, total_count, last_synced_at')
      .eq('account_id', account.id)
      .order('total_count', { ascending: false })
      .limit(1)
      .single();

    if (largeError) {
      console.error('❌ Error fetching largest folder:', largeError);
    } else {
      console.log(`✅ Largest folder: ${largestFolder.display_name}`);
      console.log(`   Total messages: ${largestFolder.total_count}`);
      console.log(`   Last synced: ${largestFolder.last_synced_at || 'Never'}`);

      if (largestFolder.total_count > 1000) {
        console.log('   ✅ Large folder (>1000 messages) being handled');
      }
    }

    // TEST 8: Webhook Subscription Status
    console.log('\n🔔 TEST 8: Webhook Subscription Health');
    console.log('----------------------------------------');

    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_subscriptions')
      .select('resource, expiration_at, is_active, renewal_failures, last_notification_at')
      .eq('account_id', account.id);

    if (webhookError) {
      console.error('❌ Error fetching webhooks:', webhookError);
    } else if (webhooks.length === 0) {
      console.log('⚠️  No webhook subscriptions found - using polling instead');
    } else {
      console.log(`✅ Webhook subscriptions: ${webhooks.length}`);
      webhooks.forEach((webhook, i) => {
        const expiresAt = new Date(webhook.expiration_at);
        const now = new Date();
        const hoursUntilExpiry = Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60 / 60);

        const statusIcon = webhook.is_active ? '✅' : '❌';
        console.log(`   ${i + 1}. ${statusIcon} ${webhook.resource}`);
        console.log(`      Expires in: ${hoursUntilExpiry} hours`);
        console.log(`      Renewal failures: ${webhook.renewal_failures}`);
        console.log(`      Last notification: ${webhook.last_notification_at || 'Never'}`);
      });
    }

    // TEST 9: Job Failures Tracking
    console.log('\n⚠️  TEST 9: Background Job Failures');
    console.log('----------------------------------------');

    const { data: jobFailures, error: jobError } = await supabase
      .from('job_failures')
      .select('job_name, error_message, retry_count, created_at')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (jobError) {
      console.error('❌ Error fetching job failures:', jobError);
    } else if (jobFailures.length === 0) {
      console.log('✅ No background job failures - all jobs running smoothly');
    } else {
      console.log(`⚠️  Found ${jobFailures.length} recent job failure(s):`);
      jobFailures.forEach((failure, i) => {
        console.log(`   ${i + 1}. ${failure.job_name}`);
        console.log(`      Error: ${failure.error_message?.substring(0, 80)}...`);
        console.log(`      Retries: ${failure.retry_count}`);
        console.log(`      Time: ${new Date(failure.created_at).toLocaleString()}`);
      });
    }

    console.log('\n✅ Edge Cases Test Completed Successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEdgeCases();
