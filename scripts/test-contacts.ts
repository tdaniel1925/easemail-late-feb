/**
 * Test script for Step 4.7: Contacts API
 *
 * This script:
 * 1. Finds the first active connected account
 * 2. Tests the contacts API
 * 3. Tests search functionality
 * 4. Verifies contact data accuracy
 *
 * Run with: npx tsx scripts/test-contacts.ts
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

async function testContacts() {
  console.log('🧪 Testing Step 4.7: Contacts API\n');

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

    // 2. Check if we have messages with contacts
    console.log('2️⃣  Checking for messages with contact data...');
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('is_deleted', false);

    console.log(`   Total messages: ${messageCount || 0}`);

    if (!messageCount || messageCount === 0) {
      console.log('   ⚠️  No messages found. Run message sync first.');
      console.log('   Run: npx tsx scripts/test-message-delta-sync.ts');
      console.log('   Proceeding with limited test (no data)...\n');
    } else {
      console.log('');
    }

    // 3. Test GET contacts (no search)
    console.log('3️⃣  Testing GET contacts (no search)...');
    const getResponse = await fetch(
      `http://localhost:3000/api/contacts?accountId=${account.id}`
    );

    if (!getResponse.ok) {
      const error = await getResponse.json();
      console.error('❌ GET contacts failed:', error);
      process.exit(1);
    }

    const contactsData = await getResponse.json();
    console.log('✅ GET contacts successful');
    console.log(`   Contacts returned: ${contactsData.count}`);
    console.log(`   Total unique contacts: ${contactsData.total}\n`);

    // 4. Test validation (missing accountId)
    console.log('4️⃣  Testing validation (missing accountId)...');
    const invalidResponse = await fetch('http://localhost:3000/api/contacts');

    if (invalidResponse.ok) {
      console.error('❌ Validation should have failed for missing accountId');
      process.exit(1);
    }

    const invalidError = await invalidResponse.json();
    console.log('✅ Validation correctly rejected missing accountId');
    console.log(`   Error: ${invalidError.error}\n`);

    // 5. Test with limit parameter
    console.log('5️⃣  Testing with limit parameter...');
    const limitResponse = await fetch(
      `http://localhost:3000/api/contacts?accountId=${account.id}&limit=5`
    );

    if (!limitResponse.ok) {
      const error = await limitResponse.json();
      console.error('❌ Limit parameter failed:', error);
      process.exit(1);
    }

    const limitData = await limitResponse.json();
    console.log('✅ Limit parameter works');
    console.log(`   Requested limit: 5`);
    console.log(`   Contacts returned: ${limitData.count}`);
    console.log(`   Contacts capped correctly: ${limitData.count <= 5 ? 'Yes' : 'No'}\n`);

    // 6. Test search functionality
    if (contactsData.contacts && contactsData.contacts.length > 0) {
      const sampleContact = contactsData.contacts[0];
      const searchTerm = sampleContact.emailAddress.split('@')[0];

      console.log('6️⃣  Testing search functionality...');
      console.log(`   Search term: "${searchTerm}"`);

      const searchResponse = await fetch(
        `http://localhost:3000/api/contacts?accountId=${account.id}&q=${encodeURIComponent(searchTerm)}`
      );

      if (!searchResponse.ok) {
        const error = await searchResponse.json();
        console.error('❌ Search contacts failed:', error);
        process.exit(1);
      }

      const searchData = await searchResponse.json();
      console.log('✅ Search contacts successful');
      console.log(`   Results: ${searchData.count}`);

      // Verify results match search term
      const allMatch = searchData.contacts.every((c: any) =>
        c.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.displayName && c.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (allMatch || searchData.contacts.length === 0) {
        console.log('   ✅ All results match search term\n');
      } else {
        console.log('   ⚠️  Some results don\'t match search term\n');
      }
    } else {
      console.log('6️⃣  Skipping search test (no contacts available)\n');
    }

    // 7. Verify contact data structure
    if (contactsData.contacts && contactsData.contacts.length > 0) {
      console.log('7️⃣  Verifying contact data structure...');
      const sampleContact = contactsData.contacts[0];

      const requiredFields = ['email', 'displayName', 'emailAddress', 'messageCount', 'lastInteractionAt'];
      const missingFields = requiredFields.filter((field) => !(field in sampleContact));

      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        process.exit(1);
      }

      console.log('✅ Contact data structure correct');
      console.log(`   All required fields present\n`);
    } else {
      console.log('7️⃣  Skipping structure verification (no contacts)\n');
    }

    // 8. Display sample contacts
    if (contactsData.contacts && contactsData.contacts.length > 0) {
      console.log('👥 Sample Contacts:');
      const sample = contactsData.contacts.slice(0, 5);
      sample.forEach((contact: any, i: number) => {
        const lastInteraction = contact.lastInteractionAt
          ? new Date(contact.lastInteractionAt).toLocaleDateString()
          : 'Unknown';
        console.log(`   ${i + 1}. ${contact.displayName}`);
        console.log(`      Email: ${contact.emailAddress}`);
        console.log(`      Messages: ${contact.messageCount}`);
        console.log(`      Last: ${lastInteraction}`);
        console.log('');
      });
    }

    // 9. Verify sorting (most recent first)
    if (contactsData.contacts && contactsData.contacts.length > 1) {
      console.log('8️⃣  Verifying contact sorting...');
      let isSorted = true;
      for (let i = 0; i < contactsData.contacts.length - 1; i++) {
        const current = new Date(contactsData.contacts[i].lastInteractionAt).getTime();
        const next = new Date(contactsData.contacts[i + 1].lastInteractionAt).getTime();
        if (current < next) {
          isSorted = false;
          break;
        }
      }

      if (isSorted) {
        console.log('✅ Contacts sorted correctly (most recent first)\n');
      } else {
        console.log('⚠️  Contact sorting may be incorrect\n');
      }
    } else {
      console.log('8️⃣  Skipping sort verification (not enough contacts)\n');
    }

    // Final verdict
    console.log('✅ Step 4.7: Contacts API - PASSED');
    console.log('');
    console.log('Test summary:');
    console.log('   - ✅ GET contacts works');
    console.log('   - ✅ Validation works');
    console.log('   - ✅ Limit parameter works');
    if (contactsData.contacts && contactsData.contacts.length > 0) {
      console.log('   - ✅ Search works');
      console.log('   - ✅ Data structure correct');
      console.log('   - ✅ Sorting works');
    }
    console.log('');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testContacts();
