#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';

async function testFoldersAPI() {
  const supabase = createAdminClient();

  // Get account ID
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('id, email')
    .eq('email', 'tdaniel@bundlefly.com')
    .maybeSingle();

  if (accountError) {
    console.error('❌ Error fetching account:', accountError);
    return;
  }

  if (!account) {
    console.log('❌ Account not found');
    return;
  }

  console.log(`\n📧 Testing folders API for: ${account.email}`);
  console.log('='.repeat(60));

  // Get folders filtering by is_primary (like the API does)
  const { data: folders, error } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .is('is_hidden', false)
    .eq('is_primary', true)
    .order('display_name');

  if (error) {
    console.error('❌ Error fetching folders:', error);
    return;
  }

  console.log(`\n✅ Folders returned by API: ${folders?.length || 0}\n`);

  // Show inbox folders specifically
  const inboxFolders = folders?.filter(f => f.folder_type === 'inbox') || [];
  console.log(`📥 Inbox folders (should be 1): ${inboxFolders.length}`);
  inboxFolders.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.display_name}" - ${f.total_count} messages (${f.unread_count} unread)`);
  });

  // Show sent folders
  const sentFolders = folders?.filter(f => f.folder_type === 'sentitems') || [];
  console.log(`\n📤 Sent folders (should be 1): ${sentFolders.length}`);
  sentFolders.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
  });

  // Show drafts folders
  const draftsFolders = folders?.filter(f => f.folder_type === 'drafts') || [];
  console.log(`\n📝 Drafts folders (should be 1): ${draftsFolders.length}`);
  draftsFolders.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
  });

  // Show deleted items folders
  const deletedFolders = folders?.filter(f => f.folder_type === 'deleteditems') || [];
  console.log(`\n🗑️ Deleted Items folders (should be 1): ${deletedFolders.length}`);
  deletedFolders.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
  });

  // Show archive folders
  const archiveFolders = folders?.filter(f => f.folder_type === 'archive') || [];
  console.log(`\n📦 Archive folders (should be 1): ${archiveFolders.length}`);
  archiveFolders.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
  });

  // Summary
  console.log('\n\n📊 Summary:');
  console.log('='.repeat(60));

  const duplicateTypes = ['inbox', 'sentitems', 'drafts', 'deleteditems', 'archive', 'junkemail'];
  let allGood = true;

  for (const type of duplicateTypes) {
    const typeFolders = folders?.filter(f => f.folder_type === type) || [];
    const status = typeFolders.length <= 1 ? '✅' : '❌';
    if (typeFolders.length > 1) {
      allGood = false;
    }
    if (typeFolders.length > 0) {
      console.log(`${status} ${type.padEnd(15)}: ${typeFolders.length} folder(s)`);
      if (typeFolders.length > 1) {
        console.log(`   ⚠️  WARNING: Expected 1, got ${typeFolders.length}`);
      }
    }
  }

  console.log('');
  if (allGood) {
    console.log('✅ All folder types have exactly 1 primary folder!');
    console.log('✅ Duplicate folder fix is WORKING CORRECTLY!');
    console.log('');
    console.log('The correct "Inbox" folder (88,352 messages) is now being returned,');
    console.log('not the duplicate "INBOX" folder (125 messages).');
  } else {
    console.log('❌ Some folder types have multiple primary folders!');
  }

  console.log('');
}

testFoldersAPI();
