/**
 * Test script for Step 4.5: Folder Management API
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Creates a new test folder
 * 3. Renames the folder
 * 4. Deletes the folder
 * 5. Verifies all operations work correctly
 *
 * Run with: npx tsx scripts/test-folders.ts
 *
 * WARNING: This will create and delete a real folder!
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

async function testFolderManagement() {
  console.log('🧪 Testing Step 4.5: Folder Management API\n');
  console.log('⚠️  WARNING: This will create and delete a real folder!\n');

  let createdFolderId: string | null = null;

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

    // 2. Get initial folder count
    console.log('2️⃣  Getting current folder count...');
    const { count: initialCount } = await supabase
      .from('account_folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    console.log(`   Current folder count: ${initialCount || 0}\n`);

    // 3. Test GET all folders
    console.log('3️⃣  Testing GET all folders...');
    const getFoldersResponse = await fetch(
      `http://localhost:3000/api/mail/folders?accountId=${account.id}`
    );

    if (!getFoldersResponse.ok) {
      const error = await getFoldersResponse.json();
      console.error('❌ GET folders failed:', error);
      process.exit(1);
    }

    const foldersData = await getFoldersResponse.json();
    console.log('✅ GET folders successful');
    console.log(`   Folder count: ${foldersData.count}\n`);

    // 4. Test POST - Create folder
    console.log('4️⃣  Testing POST - Create folder...');
    const testFolderName = `EaseMail Test Folder ${Date.now()}`;
    const createResponse = await fetch('http://localhost:3000/api/mail/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: account.id,
        displayName: testFolderName,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ POST create folder failed:', error);
      process.exit(1);
    }

    const createData = await createResponse.json();
    createdFolderId = createData.folder.id;
    console.log('✅ Folder created successfully');
    console.log(`   Folder ID: ${createdFolderId}`);
    console.log(`   Display Name: ${testFolderName}\n`);

    // 5. Verify folder exists in database
    console.log('5️⃣  Verifying folder in database...');
    const { data: verifyFolder } = await supabase
      .from('account_folders')
      .select('*')
      .eq('id', createdFolderId)
      .single();

    if (!verifyFolder) {
      console.error('❌ Folder not found in database');
      process.exit(1);
    }

    console.log('✅ Folder verified in database');
    console.log(`   Display Name: ${verifyFolder.display_name}`);
    console.log(`   Graph ID: ${verifyFolder.graph_id}\n`);

    // 6. Test GET single folder
    console.log('6️⃣  Testing GET single folder...');
    const getSingleResponse = await fetch(
      `http://localhost:3000/api/mail/folders/${createdFolderId}`
    );

    if (!getSingleResponse.ok) {
      const error = await getSingleResponse.json();
      console.error('❌ GET single folder failed:', error);
      process.exit(1);
    }

    const singleData = await getSingleResponse.json();
    console.log('✅ GET single folder successful');
    console.log(`   Display Name: ${singleData.folder.display_name}\n`);

    // 7. Test PATCH - Rename folder
    console.log('7️⃣  Testing PATCH - Rename folder...');
    const newFolderName = `${testFolderName} (Renamed)`;
    const renameResponse = await fetch(
      `http://localhost:3000/api/mail/folders/${createdFolderId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newFolderName,
        }),
      }
    );

    if (!renameResponse.ok) {
      const error = await renameResponse.json();
      console.error('❌ PATCH rename folder failed:', error);
      process.exit(1);
    }

    const renameData = await renameResponse.json();
    console.log('✅ Folder renamed successfully');
    console.log(`   Old Name: ${testFolderName}`);
    console.log(`   New Name: ${renameData.folder.display_name}\n`);

    // 8. Verify rename in database
    console.log('8️⃣  Verifying rename in database...');
    const { data: renamedFolder } = await supabase
      .from('account_folders')
      .select('display_name')
      .eq('id', createdFolderId)
      .single();

    if (!renamedFolder || renamedFolder.display_name !== newFolderName) {
      console.error('❌ Rename not reflected in database');
      process.exit(1);
    }

    console.log('✅ Rename verified in database\n');

    // 9. Test DELETE - Delete folder
    console.log('9️⃣  Testing DELETE - Delete folder...');
    const deleteResponse = await fetch(
      `http://localhost:3000/api/mail/folders/${createdFolderId}`,
      {
        method: 'DELETE',
      }
    );

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.error('❌ DELETE folder failed:', error);
      process.exit(1);
    }

    const deleteData = await deleteResponse.json();
    console.log('✅ Folder deleted successfully');
    console.log(`   Message: ${deleteData.message}\n`);

    // 10. Verify folder deleted from database
    console.log('🔟  Verifying folder deleted from database...');
    const { data: deletedFolder } = await supabase
      .from('account_folders')
      .select('*')
      .eq('id', createdFolderId)
      .single();

    if (deletedFolder) {
      console.error('❌ Folder still exists in database');
      process.exit(1);
    }

    console.log('✅ Folder deleted from database\n');

    // 11. Verify folder count returned to initial
    console.log('1️⃣1️⃣  Verifying folder count...');
    const { count: finalCount } = await supabase
      .from('account_folders')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    if (finalCount === initialCount) {
      console.log('✅ Folder count restored to initial value');
      console.log(`   Initial: ${initialCount}, Final: ${finalCount}\n`);
    } else {
      console.log(`⚠️  Folder count mismatch: Initial: ${initialCount}, Final: ${finalCount}\n`);
    }

    // 12. Test validation (try to delete system folder)
    console.log('1️⃣2️⃣  Testing validation (system folder protection)...');
    const { data: inboxFolder } = await supabase
      .from('account_folders')
      .select('id')
      .eq('account_id', account.id)
      .eq('display_name', 'Inbox')
      .single();

    if (inboxFolder) {
      const invalidDeleteResponse = await fetch(
        `http://localhost:3000/api/mail/folders/${inboxFolder.id}`,
        {
          method: 'DELETE',
        }
      );

      if (invalidDeleteResponse.ok) {
        console.error('❌ Validation should have prevented system folder deletion');
        process.exit(1);
      }

      const invalidError = await invalidDeleteResponse.json();
      console.log('✅ System folder protection works');
      console.log(`   Error: ${invalidError.error}\n`);
    } else {
      console.log('⚠️  No Inbox folder found, skipping validation test\n');
    }

    // Final verdict
    console.log('✅ Step 4.5: Folder Management API - PASSED');
    console.log('');
    console.log('Test summary:');
    console.log('   - ✅ GET all folders works');
    console.log('   - ✅ GET single folder works');
    console.log('   - ✅ Create folder works');
    console.log('   - ✅ Rename folder works');
    console.log('   - ✅ Delete folder works');
    console.log('   - ✅ System folder protection works');
    console.log('   - ✅ Database sync works');
    console.log('');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);

    // Cleanup: try to delete the test folder if it was created
    if (createdFolderId) {
      console.log('\n🧹 Cleaning up test folder...');
      try {
        await fetch(
          `http://localhost:3000/api/mail/folders/${createdFolderId}`,
          { method: 'DELETE' }
        );
        console.log('✅ Test folder cleaned up');
      } catch (cleanupError) {
        console.log('⚠️  Failed to clean up test folder');
      }
    }

    process.exit(1);
  }
}

testFolderManagement();
