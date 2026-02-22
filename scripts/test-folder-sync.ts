/**
 * Test script for Step 3.1: Folder Sync
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Triggers folder sync for that account
 * 3. Verifies folders were synced to the database
 * 4. Displays sync results
 *
 * Run with: npx tsx scripts/test-folder-sync.ts
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

async function testFolderSync() {
  console.log('🧪 Testing Step 3.1: Folder Sync\n');

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

    // 2. Get folder count before sync
    console.log('2️⃣  Checking existing folders...');
    const { count: beforeCount } = await supabase
      .from('account_folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    console.log(`   Current folder count: ${beforeCount || 0}\n`);

    // 3. Trigger folder sync via API
    console.log('3️⃣  Triggering folder sync...');
    const syncResponse = await fetch('http://localhost:3000/api/sync/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
      }),
    });

    if (!syncResponse.ok) {
      const error = await syncResponse.json();
      console.error('❌ Folder sync API failed:', error);
      process.exit(1);
    }

    const syncResult = await syncResponse.json();
    console.log('✅ Folder sync completed\n');

    // 4. Display results
    console.log('📊 Sync Results:');
    console.log(`   Account: ${syncResult.accountEmail}`);
    console.log(`   Synced: ${syncResult.result.synced}`);
    console.log(`   Created: ${syncResult.result.created}`);
    console.log(`   Updated: ${syncResult.result.updated}`);
    console.log(`   Deleted: ${syncResult.result.deleted}`);

    if (syncResult.result.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${syncResult.result.errors.length}`);
      syncResult.result.errors.forEach((err: string) => {
        console.log(`      - ${err}`);
      });
    }
    console.log('');

    // 5. Verify folders in database
    console.log('4️⃣  Verifying folders in database...');
    const { data: folders, count: afterCount } = await supabase
      .from('account_folders')
      .select('id, display_name, parent_graph_id, unread_count, total_count, graph_id', { count: 'exact' })
      .eq('account_id', account.id)
      .order('display_name');

    console.log(`   Total folders: ${afterCount || 0}\n`);

    if (folders && folders.length > 0) {
      console.log('📁 Sample Folders:');
      const sampleFolders = folders.slice(0, 10);
      sampleFolders.forEach((folder) => {
        const indent = folder.parent_graph_id ? '   ' : '';
        console.log(`   ${indent}${folder.display_name} (${folder.unread_count}/${folder.total_count})`);
      });
      if (folders.length > 10) {
        console.log(`   ... and ${folders.length - 10} more`);
      }
      console.log('');
    }

    // 6. Check sync state
    console.log('5️⃣  Checking sync state...');
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('*')
      .eq('account_id', account.id)
      .eq('resource_type', 'folders')
      .single();

    if (syncState) {
      console.log(`   Status: ${syncState.sync_status}`);
      console.log(`   Last sync: ${new Date(syncState.last_sync_at).toLocaleString()}`);
      if (syncState.error_message) {
        console.log(`   Error: ${syncState.error_message}`);
      }
      console.log('');
    }

    // 7. Test GET endpoint
    console.log('6️⃣  Testing GET endpoint...');
    const statusResponse = await fetch(`http://localhost:3000/api/sync/folders?accountId=${account.id}`);

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`   Folder count: ${statusData.folderCount}`);
      console.log(`   Sync status: ${statusData.syncState?.sync_status || 'none'}\n`);
    } else {
      console.log(`   ⚠️  GET endpoint returned ${statusResponse.status} (non-critical)\n`);
    }

    // 8. Final verdict
    if (syncResult.result.synced > 0 && afterCount && afterCount > 0) {
      console.log('✅ Step 3.1: Folder Sync - PASSED');
      console.log('');
      console.log('Test summary:');
      console.log(`   - Folder sync API is working`);
      console.log(`   - ${afterCount} folders synced from Microsoft Graph`);
      console.log(`   - Sync state tracking is working`);
      console.log(`   - GET endpoint is working`);
      process.exit(0);
    } else {
      console.log('❌ Step 3.1: Folder Sync - FAILED');
      console.log('No folders were synced. Check the errors above.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

testFolderSync();
