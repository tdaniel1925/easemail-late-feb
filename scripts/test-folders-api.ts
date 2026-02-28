#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';

async function testFoldersAPI() {
  const supabase = createAdminClient();

  // Get tdaniel@bundlefly.com account
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('id, email, user_id, tenant_id')
    .eq('email', 'tdaniel@bundlefly.com')
    .single();

  if (!account) {
    console.error('❌ Account not found');
    return;
  }

  console.log(`\n📧 Testing folders API for: ${account.email}`);
  console.log('='.repeat(60));

  // Simulate what the API does - get folders filtering by is_primary
  const { data: folders, error } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('tenant_id', account.tenant_id)
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
  console.log(`📥 Inbox folders (should be 1):`);
  inboxFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}"`);
    console.log(`   Total: ${f.total_count} messages`);
    console.log(`   Unread: ${f.unread_count} messages`);
    console.log(`   Is Primary: ${f.is_primary}`);
    console.log(`   Graph ID: ${f.graph_id.substring(0, 30)}...`);
  });

  // Show sent folders
  const sentFolders = folders?.filter(f => f.folder_type === 'sentitems') || [];
  console.log(`\n📤 Sent folders (should be 1):`);
  sentFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}"`);
    console.log(`   Total: ${f.total_count} messages`);
    console.log(`   Is Primary: ${f.is_primary}`);
  });

  // Show drafts folders
  const draftsFolders = folders?.filter(f => f.folder_type === 'drafts') || [];
  console.log(`\n📝 Drafts folders (should be 1):`);
  draftsFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}"`);
    console.log(`   Total: ${f.total_count} messages`);
    console.log(`   Is Primary: ${f.is_primary}`);
  });

  // Show deleted items folders
  const deletedFolders = folders?.filter(f => f.folder_type === 'deleteditems') || [];
  console.log(`\n🗑️ Deleted Items folders (should be 1):`);
  deletedFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}"`);
    console.log(`   Total: ${f.total_count} messages`);
    console.log(`   Is Primary: ${f.is_primary}`);
  });

  // Summary
  console.log('\n\n📊 Summary:');
  console.log('='.repeat(60));

  const duplicateTypes = ['inbox', 'sentitems', 'drafts', 'deleteditems', 'archive', 'junkemail'];
  let allGood = true;

  for (const type of duplicateTypes) {
    const typeFolders = folders?.filter(f => f.folder_type === type) || [];
    const status = typeFolders.length === 1 ? '✅' : '❌';
    if (typeFolders.length !== 1 && typeFolders.length > 0) {
      allGood = false;
    }
    if (typeFolders.length > 0) {
      console.log(`${status} ${type}: ${typeFolders.length} folder(s) returned`);
      if (typeFolders.length > 1) {
        console.log(`   WARNING: Expected 1 primary folder, got ${typeFolders.length}!`);
      }
    }
  }

  console.log('');
  if (allGood) {
    console.log('✅ All duplicate folder types have exactly 1 primary folder!');
    console.log('✅ Duplicate folder fix is working correctly!');
  } else {
    console.log('❌ Some folder types have multiple primary folders!');
  }

  console.log('');
}

testFoldersAPI();
