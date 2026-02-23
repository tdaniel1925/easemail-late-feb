/**
 * Test script for Step 4.3: Compose & Send API
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Sends a test email to the account's own email
 * 3. Verifies the email was sent successfully
 *
 * Run with: npx tsx scripts/test-send-message.ts
 *
 * WARNING: This will send a real email!
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

async function testSendMessage() {
  console.log('🧪 Testing Step 4.3: Compose & Send API\n');
  console.log('⚠️  WARNING: This will send a real test email!\n');

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

    // 2. Prepare test email
    console.log('2️⃣  Preparing test email...');
    const testSubject = `EaseMail Test Email - ${new Date().toISOString()}`;
    const testBody = `
      <html>
        <body>
          <h1>EaseMail v3.0 Test</h1>
          <p>This is a test email sent from the EaseMail v3.0 API test suite.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Step: 4.3 - Compose & Send API</li>
            <li>Time: ${new Date().toLocaleString()}</li>
            <li>Account: ${account.email}</li>
          </ul>
          <p>This email can be safely deleted.</p>
        </body>
      </html>
    `;

    console.log(`   Subject: ${testSubject}`);
    console.log(`   To: ${account.email} (sending to self)`);
    console.log(`   Body: HTML format\n`);

    // 3. Send the email
    console.log('3️⃣  Sending test email via API...');
    const sendResponse = await fetch('http://localhost:3000/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
        to: [account.email],
        subject: testSubject,
        body: testBody,
        bodyType: 'html',
        importance: 'normal',
      }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.json();
      console.error('❌ Send email API failed:', error);
      process.exit(1);
    }

    const sendResult = await sendResponse.json();
    console.log('✅ Email sent successfully!');
    console.log(`   Response:`, sendResult);
    console.log('');

    // 4. Verify response structure
    console.log('4️⃣  Verifying response structure...');
    if (!sendResult.success) {
      console.error('❌ Response does not indicate success');
      process.exit(1);
    }
    console.log('✅ Success flag present');

    if (!sendResult.sentMessage) {
      console.error('❌ No sentMessage in response');
      process.exit(1);
    }
    console.log('✅ Sent message details present\n');

    // 5. Test sending with CC
    console.log('5️⃣  Testing send with CC recipients...');
    const ccSubject = `EaseMail Test Email with CC - ${new Date().toISOString()}`;
    const ccResponse = await fetch('http://localhost:3000/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
        to: [account.email],
        cc: [account.email],
        subject: ccSubject,
        body: '<p>Test email with CC recipient</p>',
        bodyType: 'html',
      }),
    });

    if (!ccResponse.ok) {
      const error = await ccResponse.json();
      console.error('❌ Send with CC failed:', error);
      process.exit(1);
    }

    const ccResult = await ccResponse.json();
    console.log('✅ Email with CC sent successfully');
    console.log(`   CC recipients: ${ccResult.sentMessage.cc.join(', ')}\n`);

    // 6. Test sending plain text
    console.log('6️⃣  Testing send with plain text body...');
    const textSubject = `EaseMail Test Email (Plain Text) - ${new Date().toISOString()}`;
    const textResponse = await fetch('http://localhost:3000/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
        to: [account.email],
        subject: textSubject,
        body: 'This is a plain text test email.',
        bodyType: 'text',
      }),
    });

    if (!textResponse.ok) {
      const error = await textResponse.json();
      console.error('❌ Send plain text failed:', error);
      process.exit(1);
    }

    console.log('✅ Plain text email sent successfully\n');

    // 7. Test validation (missing required fields)
    console.log('7️⃣  Testing validation (missing recipient)...');
    const invalidResponse = await fetch('http://localhost:3000/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
        to: [],
        subject: 'Test',
        body: 'Test',
      }),
    });

    if (invalidResponse.ok) {
      console.error('❌ Validation should have failed for empty recipients');
      process.exit(1);
    }

    const invalidError = await invalidResponse.json();
    console.log('✅ Validation correctly rejected empty recipients');
    console.log(`   Error: ${invalidError.error}\n`);

    // 8. Wait for emails to arrive
    console.log('8️⃣  Waiting for emails to arrive...');
    console.log('   (Check your inbox for 3 test emails)\n');

    // 9. Final verdict
    console.log('✅ Step 4.3: Compose & Send API - PASSED');
    console.log('');
    console.log('Test summary:');
    console.log('   - ✅ Basic send works');
    console.log('   - ✅ Send with CC works');
    console.log('   - ✅ Plain text send works');
    console.log('   - ✅ Validation works');
    console.log('   - ✅ Response structure correct');
    console.log('');
    console.log('📧 Check your inbox:');
    console.log(`   Email: ${account.email}`);
    console.log('   Expected: 3 test emails');
    console.log('');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSendMessage();
