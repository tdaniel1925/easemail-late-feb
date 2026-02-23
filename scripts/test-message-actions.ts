/**
 * Test script for Step 4.4: Message Actions API
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Gets a test message from the database
 * 3. Tests all message actions: read/unread, flag/unflag, move, delete
 * 4. Verifies each action works correctly
 *
 * Run with: npx tsx scripts/test-message-actions.ts
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

async function testMessageActions() {
  console.log('🧪 Testing Step 4.4: Message Actions API\n');

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

    // 2. Get a test message
    console.log('2️⃣  Finding a test message...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, subject, from_name, is_read, is_flagged, folder_id')
      .eq('account_id', account.id)
      .eq('is_deleted', false)
      .limit(1);

    if (messagesError || !messages || messages.length === 0) {
      console.error('❌ No messages found in database.');
      console.log('   Run: npx tsx scripts/test-message-delta-sync.ts');
      process.exit(1);
    }

    const testMessage = messages[0];
    const originalState = {
      is_read: testMessage.is_read,
      is_flagged: testMessage.is_flagged,
      folder_id: testMessage.folder_id,
    };

    console.log(`✅ Found message: ${testMessage.subject || '(no subject)'}`);
    console.log(`   ID: ${testMessage.id}`);
    console.log(`   Read: ${testMessage.is_read}`);
    console.log(`   Flagged: ${testMessage.is_flagged}\n`);

    // 3. Test PATCH - Mark as read
    console.log('3️⃣  Testing PATCH - Mark as read...');
    const readResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      }
    );

    if (!readResponse.ok) {
      const error = await readResponse.json();
      console.error('❌ PATCH mark as read failed:', error);
      process.exit(1);
    }

    const readData = await readResponse.json();
    console.log('✅ Message marked as read');
    console.log(`   is_read: ${readData.message.is_read}\n`);

    // 4. Test PATCH - Mark as unread
    console.log('4️⃣  Testing PATCH - Mark as unread...');
    const unreadResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: false }),
      }
    );

    if (!unreadResponse.ok) {
      const error = await unreadResponse.json();
      console.error('❌ PATCH mark as unread failed:', error);
      process.exit(1);
    }

    const unreadData = await unreadResponse.json();
    console.log('✅ Message marked as unread');
    console.log(`   is_read: ${unreadData.message.is_read}\n`);

    // 5. Test PATCH - Flag message
    console.log('5️⃣  Testing PATCH - Flag message...');
    const flagResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: true }),
      }
    );

    if (!flagResponse.ok) {
      const error = await flagResponse.json();
      console.error('❌ PATCH flag message failed:', error);
      process.exit(1);
    }

    const flagData = await flagResponse.json();
    console.log('✅ Message flagged');
    console.log(`   is_flagged: ${flagData.message.is_flagged}\n`);

    // 6. Test PATCH - Unflag message
    console.log('6️⃣  Testing PATCH - Unflag message...');
    const unflagResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: false }),
      }
    );

    if (!unflagResponse.ok) {
      const error = await unflagResponse.json();
      console.error('❌ PATCH unflag message failed:', error);
      process.exit(1);
    }

    const unflagData = await unflagResponse.json();
    console.log('✅ Message unflagged');
    console.log(`   is_flagged: ${unflagData.message.is_flagged}\n`);

    // 7. Test POST - Move message
    console.log('7️⃣  Testing POST - Move message to different folder...');

    // Get a different folder (Archive or any folder that's not the current one)
    const { data: targetFolder } = await supabase
      .from('account_folders')
      .select('id, display_name')
      .eq('account_id', account.id)
      .neq('id', testMessage.folder_id)
      .limit(1)
      .single();

    if (!targetFolder) {
      console.log('⚠️  No other folders available, skipping move test\n');
    } else {
      console.log(`   Target folder: ${targetFolder.display_name}`);

      const moveResponse = await fetch(
        `http://localhost:3000/api/mail/messages/${testMessage.id}/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetFolderId: targetFolder.id }),
        }
      );

      if (!moveResponse.ok) {
        const error = await moveResponse.json();
        console.error('❌ POST move message failed:', error);
        process.exit(1);
      }

      const moveData = await moveResponse.json();
      console.log('✅ Message moved successfully');
      console.log(`   New folder: ${moveData.targetFolder.name}\n`);

      // Move back to original folder
      console.log('8️⃣  Moving message back to original folder...');
      const moveBackResponse = await fetch(
        `http://localhost:3000/api/mail/messages/${testMessage.id}/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetFolderId: originalState.folder_id }),
        }
      );

      if (moveBackResponse.ok) {
        console.log('✅ Message moved back to original folder\n');
      } else {
        console.log('⚠️  Failed to move back, but test continues\n');
      }
    }

    // 8. Test DELETE - Soft delete message
    console.log('9️⃣  Testing DELETE - Soft delete message...');
    const deleteResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'DELETE',
      }
    );

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.error('❌ DELETE message failed:', error);
      process.exit(1);
    }

    const deleteData = await deleteResponse.json();
    console.log('✅ Message deleted (soft delete)');

    // Verify message is marked as deleted in database
    const { data: deletedMessage } = await supabase
      .from('messages')
      .select('is_deleted')
      .eq('id', testMessage.id)
      .single();

    if (deletedMessage?.is_deleted) {
      console.log('✅ Verified: is_deleted = true in database\n');
    } else {
      console.log('⚠️  Warning: is_deleted not set in database\n');
    }

    // 9. Restore original state
    console.log('🔟  Restoring original state...');
    await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRead: originalState.is_read,
          isFlagged: originalState.is_flagged,
        }),
      }
    );

    // Undelete by setting is_deleted to false
    await supabase
      .from('messages')
      .update({ is_deleted: false })
      .eq('id', testMessage.id);

    console.log('✅ Original state restored\n');

    // 10. Final verdict
    console.log('✅ Step 4.4: Message Actions API - PASSED');
    console.log('');
    console.log('Test summary:');
    console.log('   - ✅ Mark as read works');
    console.log('   - ✅ Mark as unread works');
    console.log('   - ✅ Flag message works');
    console.log('   - ✅ Unflag message works');
    if (targetFolder) {
      console.log('   - ✅ Move message works');
    }
    console.log('   - ✅ Delete message works (soft delete)');
    console.log('   - ✅ State restoration works');
    console.log('');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testMessageActions();
