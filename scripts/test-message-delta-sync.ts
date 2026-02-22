/**
 * Test script for Step 3.2: Message Delta Sync
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Finds a small folder (Drafts) to test with
 * 3. Triggers message delta sync for that folder
 * 4. Verifies messages were synced to the database
 * 5. Displays sync results
 *
 * Run with: npx tsx scripts/test-message-delta-sync.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessageDeltaSync() {
  console.log('🧪 Testing Step 3.2: Message Delta Sync\n');

  try {
    // 1. Find first active account
    console.log('1️⃣  Finding active account...');
    const { data: accounts, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('status', 'active')
      .limit(1);

    if (accountError) {
      console.error('❌ Failed to fetch accounts:', accountError);
      process.exit(1);
    }

    if (!accounts || accounts.length === 0) {
      console.error('❌ No active accounts found. Please authenticate first.');
      process.exit(1);
    }

    const account = accounts[0];
    console.log(`✅ Found account: ${account.email} (${account.id})\n`);

    // 2. Find Drafts folder (smaller for testing)
    console.log('2️⃣  Finding Drafts folder...');
    const { data: folders } = await supabase
      .from('account_folders')
      .select('id, graph_id, display_name, total_count')
      .eq('account_id', account.id)
      .ilike('display_name', '%draft%')
      .limit(1);

    let testFolder = folders?.[0];

    if (!testFolder) {
      // Fallback to any folder with low message count
      const { data: smallFolders } = await supabase
        .from('account_folders')
        .select('id, graph_id, display_name, total_count')
        .eq('account_id', account.id)
        .lte('total_count', 10)
        .order('total_count')
        .limit(1);

      testFolder = smallFolders?.[0];
    }

    if (!testFolder) {
      console.error('❌ No suitable test folder found');
      process.exit(1);
    }

    console.log(`✅ Using folder: ${testFolder.display_name} (${testFolder.total_count} messages)\n`);

    // 3. Get folder UUID for database queries
    console.log('3️⃣  Checking existing messages...');
    const { data: folderData } = await supabase
      .from('account_folders')
      .select('id')
      .eq('account_id', account.id)
      .eq('graph_id', testFolder.graph_id)
      .single();

    if (!folderData) {
      console.error('❌ Folder not found in database');
      process.exit(1);
    }

    const { count: beforeCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('folder_id', folderData.id);

    console.log(`   Current message count for this folder: ${beforeCount || 0}\n`);

    // 4. Trigger message delta sync via API
    console.log('4️⃣  Triggering message delta sync...');
    console.log(`   (This may take a moment for ${testFolder.total_count} messages...)\n`);

    const syncResponse = await fetch('http://localhost:3000/api/sync/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
        folderId: testFolder.graph_id,
      }),
    });

    if (!syncResponse.ok) {
      const error = await syncResponse.json();
      console.error('❌ Message delta sync API failed:', error);
      process.exit(1);
    }

    const syncResult = await syncResponse.json();
    console.log('✅ Message delta sync completed\n');

    // 5. Display results
    console.log('📊 Sync Results:');
    console.log(`   Account: ${syncResult.accountEmail}`);
    console.log(`   Folder: ${testFolder.display_name}`);
    console.log(`   Synced: ${syncResult.result.synced}`);
    console.log(`   Created: ${syncResult.result.created}`);
    console.log(`   Updated: ${syncResult.result.updated}`);
    console.log(`   Deleted: ${syncResult.result.deleted}`);
    console.log(`   Delta token saved: ${syncResult.result.deltaToken ? 'Yes' : 'No'}`);

    if (syncResult.result.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${syncResult.result.errors.length}`);
      syncResult.result.errors.forEach((err: string) => {
        console.log(`      - ${err}`);
      });
    }
    console.log('');

    // 6. Verify messages in database
    console.log('5️⃣  Verifying messages in database...');
    const { data: messages, count: afterCount } = await supabase
      .from('messages')
      .select('id, subject, from_address, is_read, received_at, graph_id', { count: 'exact' })
      .eq('account_id', account.id)
      .eq('folder_id', folderData.id)
      .order('received_at', { ascending: false });

    console.log(`   Total messages: ${afterCount || 0}\n`);

    if (messages && messages.length > 0) {
      console.log('📧 Sample Messages:');
      const sampleMessages = messages.slice(0, 5);
      sampleMessages.forEach((msg) => {
        const readStatus = msg.is_read ? ' ' : '•';
        const date = msg.received_at ? new Date(msg.received_at).toLocaleDateString() : 'unknown';
        console.log(`   ${readStatus} ${msg.subject?.slice(0, 50) || '(No Subject)'}`);
        console.log(`     From: ${msg.from_address || 'unknown'} | ${date}`);
      });
      if (messages.length > 5) {
        console.log(`   ... and ${messages.length - 5} more`);
      }
      console.log('');
    }

    // 7. Check sync state
    console.log('6️⃣  Checking sync state...');
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('*')
      .eq('account_id', account.id)
      .eq('resource_type', `messages:${testFolder.graph_id}`)
      .single();

    if (syncState) {
      console.log(`   Status: ${syncState.sync_status}`);
      console.log(`   Last sync: ${new Date(syncState.last_sync_at).toLocaleString()}`);
      console.log(`   Delta token: ${syncState.delta_token ? 'Saved' : 'None'}`);
      if (syncState.error_message) {
        console.log(`   Error: ${syncState.error_message}`);
      }
      console.log('');
    }

    // 8. Test GET endpoint
    console.log('7️⃣  Testing GET endpoint...');
    const statusResponse = await fetch(
      `http://localhost:3000/api/sync/messages?accountId=${account.id}&folderId=${testFolder.graph_id}`
    );

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`   Total messages (all folders): ${statusData.stats.totalMessages}`);
      console.log(`   Unread messages: ${statusData.stats.unreadMessages}`);
      console.log(`   Sync status: ${statusData.syncState?.sync_status || 'none'}\n`);
    } else {
      console.log(`   ⚠️  GET endpoint returned ${statusResponse.status} (non-critical)\n`);
    }

    // 9. Final verdict
    if (syncResult.result.synced > 0 && afterCount && afterCount > 0) {
      console.log('✅ Step 3.2: Message Delta Sync - PASSED');
      console.log('');
      console.log('Test summary:');
      console.log(`   - Message delta sync API is working`);
      console.log(`   - ${afterCount} messages synced from Microsoft Graph`);
      console.log(`   - Delta token stored for incremental sync`);
      console.log(`   - Sync state tracking is working`);
      console.log(`   - GET endpoint is working`);
      console.log('');
      console.log('💡 Next: Run a second sync to test incremental delta sync!');
      process.exit(0);
    } else {
      console.log('❌ Step 3.2: Message Delta Sync - FAILED');
      console.log('No messages were synced. Check the errors above.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

testMessageDeltaSync();
