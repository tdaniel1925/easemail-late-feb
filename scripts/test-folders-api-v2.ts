#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';

async function testFoldersAPI() {
  const supabase = createAdminClient();

  // Get tdaniel@bundlefly.com account
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('id, email, user_id, tenant_id')
    .eq('email', 'tdaniel@bundlefly.com')
    .maybeSingle();

  if (accountError) {
    console.error('❌ Error fetching account:', accountError);
    return;
  }

  if (!account) {
    console.log('❌ Account not found. Let me check what accounts exist...');
    const { data: allAccounts } = await supabase
      .from('connected_accounts')
      .select('email')
      .limit(10);
    console.log('Available accounts:', allAccounts?.map(a => a.email).join(', '));
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
  console.log(`📥 Inbox folders (should be 1): ${inboxFolders.length}`);
  inboxFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}"`);
    console.log(`   Total: ${f.total_count} messages`);
    console.log(`   Unread: ${f.unread_count} messages`);
    console.log(`   Is Primary: ${f.is_primary}`);
  });

  // Show sent folders
  const sentFolders = folders?.filter(f => f.folder_type === 'sentitems') || [];
  console.log(`\n📤 Sent folders (should be 1): ${sentFolders.length}`);
  sentFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
  });

  // Show drafts folders
  const draftsFolders = folders?.filter(f => f.folder_type === 'drafts') || [];
  console.log(`\n📝 Drafts folders (should be 1): ${draftsFolders.length}`);
  draftsFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
  });

  // Show deleted items folders
  const deletedFolders = folders?.filter(f => f.folder_type === 'deleteditems') || [];
  console.log(`\n🗑️ Deleted Items folders (should be 1): ${deletedFolders.length}`);
  deletedFolders.forEach((f, i) => {
    console.log(`${i + 1}. "${f.display_name}" - ${f.total_count} messages`);
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
      console.log(`${status} ${type}: ${typeFolders.length} folder(s)`);
      if (typeFolders.length > 1) {
        console.log(`   WARNING: Expected 1 primary folder, got ${typeFolders.length}!`);
      }
    }
  }

  console.log('');
  if (allGood) {
    console.log('✅ All duplicate folder types have at most 1 primary folder!');
    console.log('✅ Duplicate folder fix is working correctly!');
  } else {
    console.log('❌ Some folder types have multiple primary folders!');
  }

  console.log('');
}

testFoldersAPI();
