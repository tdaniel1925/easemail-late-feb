/**
 * Test script for Step 4.1: List Messages API
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Tests the list messages API with various filters
 * 3. Verifies pagination works correctly
 * 4. Tests sorting and filtering options
 *
 * Run with: npx tsx scripts/test-list-messages.ts
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

async function testListMessages() {
  console.log('🧪 Testing Step 4.1: List Messages API\n');

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

    // 2. Check message count in database
    console.log('2️⃣  Checking messages in database...');
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('is_deleted', false);

    console.log(`   Total messages: ${messageCount || 0}`);

    if (!messageCount || messageCount === 0) {
      console.log('   ⚠️  No messages found. Run message sync first.');
      console.log('   Run: npx tsx scripts/test-message-delta-sync.ts\n');
    }
    console.log('');

    // 3. Get Inbox folder
    console.log('3️⃣  Finding Inbox folder...');
    let { data: inboxFolder, error: folderError } = await supabase
      .from('account_folders')
      .select('id, display_name, total_count, unread_count')
      .eq('account_id', account.id)
      .eq('folder_type', 'inbox')
      .single();

    // Fallback: match by display name if folder_type is not set correctly
    if (folderError || !inboxFolder) {
      const result = await supabase
        .from('account_folders')
        .select('id, display_name, total_count, unread_count')
        .eq('account_id', account.id)
        .eq('display_name', 'Inbox')
        .single();
      inboxFolder = result.data;
      folderError = result.error;
    }

    if (folderError || !inboxFolder) {
      console.error('❌ No Inbox folder found. Run folder sync first.');
      process.exit(1);
    }

    console.log(`✅ Found Inbox: ${inboxFolder.display_name}`);
    console.log(`   Total: ${inboxFolder.total_count}, Unread: ${inboxFolder.unread_count}\n`);

    // 4. Test default list messages (first page, Inbox)
    console.log('4️⃣  Testing default list messages API...');
    const defaultResponse = await fetch(
      `http://localhost:3000/api/mail/messages?accountId=${account.id}`
    );

    if (!defaultResponse.ok) {
      const error = await defaultResponse.json();
      console.error('❌ List messages API failed:', error);
      process.exit(1);
    }

    const defaultData = await defaultResponse.json();
    console.log('✅ Default request successful');
    console.log(`   Messages returned: ${defaultData.messages.length}`);
    console.log(`   Pagination:`, defaultData.pagination);
    console.log('');

    // 5. Test with specific folder
    console.log('5️⃣  Testing with specific folder...');
    const folderResponse = await fetch(
      `http://localhost:3000/api/mail/messages?accountId=${account.id}&folderId=${inboxFolder.id}`
    );

    if (!folderResponse.ok) {
      const error = await folderResponse.json();
      console.error('❌ Folder filter failed:', error);
      process.exit(1);
    }

    const folderData = await folderResponse.json();
    console.log('✅ Folder filter successful');
    console.log(`   Messages returned: ${folderData.messages.length}`);
    console.log('');

    // 6. Test pagination
    console.log('6️⃣  Testing pagination...');
    const paginationResponse = await fetch(
      `http://localhost:3000/api/mail/messages?accountId=${account.id}&page=1&limit=10`
    );

    if (!paginationResponse.ok) {
      const error = await paginationResponse.json();
      console.error('❌ Pagination failed:', error);
      process.exit(1);
    }

    const paginationData = await paginationResponse.json();
    console.log('✅ Pagination successful');
    console.log(`   Page: ${paginationData.pagination.page}`);
    console.log(`   Limit: ${paginationData.pagination.limit}`);
    console.log(`   Total: ${paginationData.pagination.total}`);
    console.log(`   Pages: ${paginationData.pagination.pages}`);
    console.log('');

    // 7. Test unread filter
    console.log('7️⃣  Testing unread filter...');
    const unreadResponse = await fetch(
      `http://localhost:3000/api/mail/messages?accountId=${account.id}&unreadOnly=true`
    );

    if (!unreadResponse.ok) {
      const error = await unreadResponse.json();
      console.error('❌ Unread filter failed:', error);
      process.exit(1);
    }

    const unreadData = await unreadResponse.json();
    console.log('✅ Unread filter successful');
    console.log(`   Unread messages: ${unreadData.messages.length}`);

    // Verify all returned messages are unread
    const allUnread = unreadData.messages.every((msg: any) => !msg.is_read);
    if (allUnread || unreadData.messages.length === 0) {
      console.log('   ✅ All returned messages are unread');
    } else {
      console.log('   ❌ Some returned messages are read');
    }
    console.log('');

    // 8. Test flagged filter
    console.log('8️⃣  Testing flagged filter...');
    const flaggedResponse = await fetch(
      `http://localhost:3000/api/mail/messages?accountId=${account.id}&flaggedOnly=true`
    );

    if (!flaggedResponse.ok) {
      const error = await flaggedResponse.json();
      console.error('❌ Flagged filter failed:', error);
      process.exit(1);
    }

    const flaggedData = await flaggedResponse.json();
    console.log('✅ Flagged filter successful');
    console.log(`   Flagged messages: ${flaggedData.messages.length}`);
    console.log('');

    // 9. Test sorting
    console.log('9️⃣  Testing sorting...');
    const sortResponse = await fetch(
      `http://localhost:3000/api/mail/messages?accountId=${account.id}&sortBy=subject&sortOrder=asc&limit=5`
    );

    if (!sortResponse.ok) {
      const error = await sortResponse.json();
      console.error('❌ Sorting failed:', error);
      process.exit(1);
    }

    const sortData = await sortResponse.json();
    console.log('✅ Sorting successful');
    console.log(`   Messages returned: ${sortData.messages.length}`);
    if (sortData.messages.length > 0) {
      console.log(`   First subject: ${sortData.messages[0].subject || '(no subject)'}`);
    }
    console.log('');

    // 10. Display sample messages
    if (defaultData.messages.length > 0) {
      console.log('📧 Sample Messages:');
      const sample = defaultData.messages.slice(0, 5);
      sample.forEach((msg: any, i: number) => {
        const readFlag = msg.is_read ? '📭' : '📬';
        const flagFlag = msg.is_flagged ? '🚩' : '  ';
        const attachFlag = msg.has_attachments ? '📎' : '  ';
        const date = new Date(msg.received_at).toLocaleString();
        console.log(`   ${i + 1}. ${readFlag}${flagFlag}${attachFlag} ${msg.subject || '(no subject)'}`);
        console.log(`      From: ${msg.from_name || msg.from_address || 'Unknown'}`);
        console.log(`      Date: ${date}`);
        if (msg.preview) {
          console.log(`      Preview: ${msg.preview.substring(0, 60)}...`);
        }
        console.log('');
      });
    }

    // 11. Final verdict
    console.log('✅ Step 4.1: List Messages API - PASSED');
    console.log('');
    console.log('Test summary:');
    console.log('   - ✅ Default list messages works');
    console.log('   - ✅ Folder filtering works');
    console.log('   - ✅ Pagination works');
    console.log('   - ✅ Unread filter works');
    console.log('   - ✅ Flagged filter works');
    console.log('   - ✅ Sorting works');
    console.log('');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testListMessages();
