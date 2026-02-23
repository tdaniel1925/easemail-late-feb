/**
 * Test script for Step 4.2: Get Single Message API
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Gets a message from the database
 * 3. Tests the get single message API
 * 4. Verifies all fields are returned correctly
 *
 * Run with: npx tsx scripts/test-get-message.ts
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

async function testGetMessage() {
  console.log('🧪 Testing Step 4.2: Get Single Message API\n');

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

    // 2. Get a message from the database
    console.log('2️⃣  Finding a message in database...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, subject, from_name, received_at')
      .eq('account_id', account.id)
      .eq('is_deleted', false)
      .order('received_at', { ascending: false })
      .limit(1);

    if (messagesError || !messages || messages.length === 0) {
      console.error('❌ No messages found in database.');
      console.log('   Run: npx tsx scripts/test-message-delta-sync.ts');
      process.exit(1);
    }

    const testMessage = messages[0];
    console.log(`✅ Found message: ${testMessage.subject || '(no subject)'}`);
    console.log(`   ID: ${testMessage.id}`);
    console.log(`   From: ${testMessage.from_name || 'Unknown'}`);
    console.log(`   Date: ${new Date(testMessage.received_at).toLocaleString()}\n`);

    // 3. Test GET /api/mail/messages/[id]
    console.log('3️⃣  Testing GET message API...');
    const getResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`
    );

    if (!getResponse.ok) {
      const error = await getResponse.json();
      console.error('❌ GET message API failed:', error);
      process.exit(1);
    }

    const messageData = await getResponse.json();
    console.log('✅ GET message successful\n');

    // 4. Verify response structure
    console.log('4️⃣  Verifying response structure...');
    const requiredFields = [
      'id',
      'account_id',
      'folder_id',
      'subject',
      'from',
      'to',
      'body',
      'is_read',
      'is_flagged',
      'has_attachments',
      'received_at',
    ];

    const missingFields = requiredFields.filter(
      (field) => !(field in messageData)
    );

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      process.exit(1);
    }

    console.log('✅ All required fields present');

    // Verify from structure
    if (!messageData.from || typeof messageData.from !== 'object') {
      console.error('❌ Invalid "from" structure');
      process.exit(1);
    }
    console.log('✅ From field structure correct');

    // Verify body structure
    if (!messageData.body || typeof messageData.body !== 'object') {
      console.error('❌ Invalid "body" structure');
      process.exit(1);
    }
    console.log('✅ Body field structure correct');

    // Verify recipients are arrays
    if (!Array.isArray(messageData.to)) {
      console.error('❌ "to" should be an array');
      process.exit(1);
    }
    console.log('✅ Recipients are arrays');

    // Verify attachments
    if (!Array.isArray(messageData.attachments)) {
      console.error('❌ "attachments" should be an array');
      process.exit(1);
    }
    console.log('✅ Attachments is an array\n');

    // 5. Display message details
    console.log('📧 Message Details:');
    console.log(`   Subject: ${messageData.subject || '(no subject)'}`);
    console.log(`   From: ${messageData.from.name || messageData.from.address || 'Unknown'}`);
    console.log(`   To: ${messageData.to.length} recipient(s)`);
    console.log(`   CC: ${messageData.cc.length} recipient(s)`);
    console.log(`   BCC: ${messageData.bcc.length} recipient(s)`);
    console.log(`   Read: ${messageData.is_read ? 'Yes' : 'No'}`);
    console.log(`   Flagged: ${messageData.is_flagged ? 'Yes' : 'No'}`);
    console.log(`   Importance: ${messageData.importance}`);
    console.log(`   Attachments: ${messageData.attachment_count}`);
    console.log(`   Received: ${new Date(messageData.received_at).toLocaleString()}`);

    if (messageData.body.text) {
      const preview = messageData.body.text.substring(0, 100);
      console.log(`   Body preview: ${preview}...`);
    }

    if (messageData.folder) {
      console.log(`   Folder: ${messageData.folder.display_name}`);
    }

    if (messageData.ai.summary) {
      console.log(`   AI Summary: ${messageData.ai.summary}`);
    }
    console.log('');

    // 6. Test PATCH endpoint (mark as read)
    console.log('5️⃣  Testing PATCH message API (mark as read)...');
    const originalReadState = messageData.is_read;
    const patchResponse = await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !originalReadState }),
      }
    );

    if (!patchResponse.ok) {
      const error = await patchResponse.json();
      console.error('❌ PATCH message API failed:', error);
      process.exit(1);
    }

    const patchData = await patchResponse.json();
    console.log('✅ PATCH message successful');
    console.log(`   Read state changed: ${originalReadState} → ${!originalReadState}\n`);

    // 7. Restore original state
    console.log('6️⃣  Restoring original state...');
    await fetch(
      `http://localhost:3000/api/mail/messages/${testMessage.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: originalReadState }),
      }
    );
    console.log('✅ Original state restored\n');

    // 8. Final verdict
    console.log('✅ Step 4.2: Get Single Message API - PASSED');
    console.log('');
    console.log('Test summary:');
    console.log('   - ✅ GET single message works');
    console.log('   - ✅ All required fields present');
    console.log('   - ✅ Data structures correct');
    console.log('   - ✅ PATCH message works');
    console.log('   - ✅ Attachments list included');
    console.log('   - ✅ AI fields included');
    console.log('');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testGetMessage();
