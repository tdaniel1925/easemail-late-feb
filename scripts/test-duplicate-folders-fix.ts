#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { FolderSyncService } from '@/lib/graph/folder-sync';

async function testDuplicateFoldersFix() {
  const supabase = createAdminClient();

  // Get tdaniel@bundlefly.com account
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('id, email, status')
    .eq('email', 'tdaniel@bundlefly.com')
    .single();

  if (accountError || !account) {
    console.error('❌ Failed to find account:', accountError?.message);
    return;
  }

  console.log(`\n📧 Testing folder sync for: ${account.email}`);
  console.log(`   Account ID: ${account.id}`);
  console.log(`   Status: ${account.status}\n`);

  // Check folders BEFORE sync
  console.log('📂 Folders BEFORE sync:');
  console.log('='.repeat(60));

  const { data: foldersBefore } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .order('folder_type, total_count DESC');

  const inboxFoldersBefore = foldersBefore?.filter(f => f.folder_type === 'inbox') || [];
  console.log(`\n📥 Inbox folders found: ${inboxFoldersBefore.length}`);
  inboxFoldersBefore.forEach((f, i) => {
    const icon = f.is_primary ? '⭐' : '  ';
    console.log(`${icon} ${i + 1}. "${f.display_name}" - ${f.total_count} messages, is_primary: ${f.is_primary}`);
  });

  // Run folder sync
  console.log('\n\n🔄 Running folder sync...\n');

  try {
    const graphClient = await createGraphClient(account.id);
    const folderSync = new FolderSyncService(graphClient, account.id);

    const result = await folderSync.syncFolders();

    console.log('\n✅ Folder sync completed:');
    console.log(`   Synced: ${result.synced}`);
    console.log(`   Created: ${result.created}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Deleted: ${result.deleted}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️ Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
  } catch (error: any) {
    console.error('\n❌ Folder sync failed:', error.message);
    return;
  }

  // Check folders AFTER sync
  console.log('\n\n📂 Folders AFTER sync:');
  console.log('='.repeat(60));

  const { data: foldersAfter } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .order('folder_type, total_count DESC');

  const inboxFoldersAfter = foldersAfter?.filter(f => f.folder_type === 'inbox') || [];
  console.log(`\n📥 Inbox folders found: ${inboxFoldersAfter.length}`);
  inboxFoldersAfter.forEach((f, i) => {
    const icon = f.is_primary ? '⭐' : '  ';
    console.log(`${icon} ${i + 1}. "${f.display_name}" - ${f.total_count} messages, is_primary: ${f.is_primary}`);
  });

  // Check for messages in each inbox
  console.log('\n\n📨 Messages in database:');
  console.log('='.repeat(60));

  for (const inbox of inboxFoldersAfter) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', inbox.id);

    const icon = inbox.is_primary ? '⭐' : '  ';
    console.log(`${icon} "${inbox.display_name}": ${count || 0} messages in DB (${inbox.total_count} in Graph)`);
  }

  // Summary
  console.log('\n\n📊 Summary:');
  console.log('='.repeat(60));

  const primaryInbox = inboxFoldersAfter.find(f => f.is_primary);
  if (primaryInbox) {
    console.log(`✅ Primary inbox: "${primaryInbox.display_name}" with ${primaryInbox.total_count} messages`);
  } else {
    console.log(`❌ No primary inbox found!`);
  }

  const secondaryInboxes = inboxFoldersAfter.filter(f => !f.is_primary);
  if (secondaryInboxes.length > 0) {
    console.log(`\n   Secondary inboxes (${secondaryInboxes.length}):`);
    secondaryInboxes.forEach(f => {
      console.log(`   - "${f.display_name}" with ${f.total_count} messages`);
    });
  }

  console.log('\n');
}

testDuplicateFoldersFix();
