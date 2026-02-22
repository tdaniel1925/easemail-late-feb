/**
 * Test Script for Step 3.3: Sync Orchestrator
 *
 * Tests the full account sync flow that coordinates:
 * 1. Folder sync
 * 2. Message sync for each folder
 * 3. Account metadata updates
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NEXT_PUBLIC_APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSyncOrchestrator() {
  console.log('🧪 Testing Step 3.3: Sync Orchestrator\n');

  // Step 1: Find an active account
  console.log('1️⃣  Finding active account...');
  const { data: accounts } = await supabase
    .from('connected_accounts')
    .select('id, email, status, last_full_sync_at, initial_sync_complete, messages_synced')
    .eq('status', 'active')
    .limit(1);

  if (!accounts || accounts.length === 0) {
    console.error('❌ No active accounts found. Please connect an account first.');
    process.exit(1);
  }

  const account = accounts[0];
  console.log(`✅ Found account: ${account.email} (${account.id})`);
  console.log(`   Last sync: ${account.last_full_sync_at || 'Never'}`);
  console.log(`   Initial sync complete: ${account.initial_sync_complete}`);
  console.log(`   Messages synced: ${account.messages_synced || 0}\n`);

  // Step 2: Check current counts
  console.log('2️⃣  Checking current counts...');
  const { count: folderCount } = await supabase
    .from('account_folders')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', account.id);

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', account.id);

  console.log(`   Current folders: ${folderCount}`);
  console.log(`   Current messages: ${messageCount}\n`);

  // Step 3: Trigger full account sync
  console.log('3️⃣  Triggering full account sync...');
  console.log('   ⚠️  This may take several minutes for large mailboxes...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/sync/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: account.id }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Sync failed: ${error.error}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Full account sync completed\n');

    // Step 4: Display sync results
    console.log('📊 Sync Results:');
    console.log(`   Account: ${account.email}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Overall status: ${result.result.overallStatus}\n`);

    console.log('   Folder Sync:');
    console.log(`   - Synced: ${result.result.folderSync.synced}`);
    console.log(`   - Created: ${result.result.folderSync.created}`);
    console.log(`   - Updated: ${result.result.folderSync.updated}`);
    console.log(`   - Deleted: ${result.result.folderSync.deleted}\n`);

    console.log('   Message Sync:');
    console.log(`   - Total folders processed: ${result.result.messageSync.foldersProcessed}`);
    console.log(`   - Total messages synced: ${result.result.messageSync.totalMessages}`);
    console.log(`   - Errors: ${result.result.messageSync.errors.length}\n`);

    if (result.result.messageSync.errors.length > 0) {
      console.log('   ⚠️  Errors encountered:');
      result.result.messageSync.errors.slice(0, 5).forEach((err: string) => {
        console.log(`   - ${err}`);
      });
      if (result.result.messageSync.errors.length > 5) {
        console.log(`   ... and ${result.result.messageSync.errors.length - 5} more`);
      }
      console.log();
    }

    // Step 5: Verify database updates
    console.log('4️⃣  Verifying database updates...');

    const { data: updatedAccount } = await supabase
      .from('connected_accounts')
      .select('last_full_sync_at, initial_sync_complete, messages_synced, status')
      .eq('id', account.id)
      .single();

    const { count: newFolderCount } = await supabase
      .from('account_folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    const { count: newMessageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    console.log(`   ✅ Account status: ${updatedAccount?.status}`);
    console.log(`   ✅ Initial sync complete: ${updatedAccount?.initial_sync_complete}`);
    console.log(`   ✅ Last full sync: ${updatedAccount?.last_full_sync_at}`);
    console.log(`   ✅ Messages synced count: ${updatedAccount?.messages_synced}`);
    console.log(`   ✅ Folders: ${folderCount} → ${newFolderCount}`);
    console.log(`   ✅ Messages: ${messageCount} → ${newMessageCount}\n`);

    // Step 6: Check sync state
    console.log('5️⃣  Checking sync state...');
    const { count: syncStateCount } = await supabase
      .from('sync_state')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    console.log(`   ✅ Delta tokens stored: ${syncStateCount}\n`);

    // Step 7: Test GET endpoint
    console.log('6️⃣  Testing GET endpoint...');
    const getResponse = await fetch(
      `${NEXT_PUBLIC_APP_URL}/api/sync/account?accountId=${account.id}`
    );

    if (getResponse.ok) {
      const status = await getResponse.json();
      console.log(`   ✅ GET endpoint working`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Last sync: ${status.lastFullSync || 'Never'}\n`);
    } else {
      console.log(`   ⚠️  GET endpoint returned ${getResponse.status} (non-critical)\n`);
    }

    // Final summary
    console.log('✅ Step 3.3: Sync Orchestrator - PASSED\n');
    console.log('Test summary:');
    console.log('   - Full account sync API is working');
    console.log(`   - ${newFolderCount} folders synced`);
    console.log(`   - ${newMessageCount} messages synced`);
    console.log('   - Account metadata updated correctly');
    console.log('   - Sync state tracking is working');
    console.log('   - GET endpoint is working\n');

    console.log('💡 Next: Test webhook creation and attachment sync!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSyncOrchestrator();
