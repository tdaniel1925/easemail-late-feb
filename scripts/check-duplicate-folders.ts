#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';

async function checkFolders() {
  const supabase = createAdminClient();

  const { data: account } = await supabase
    .from('connected_accounts')
    .select('id, email')
    .eq('email', 'tdaniel@bundlefly.com')
    .single();

  if (!account) {
    console.log('Account not found');
    return;
  }

  console.log(`\n📧 Account: ${account.email}`);
  console.log('='.repeat(50));

  const { data: folders } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .order('display_name');

  console.log(`\n📂 Total folders: ${folders?.length || 0}\n`);

  const inboxFolders = folders?.filter(f =>
    f.display_name.toLowerCase() === 'inbox' ||
    f.folder_type === 'inbox'
  );

  console.log(`🔍 Inbox folders found: ${inboxFolders?.length || 0}\n`);

  if (inboxFolders && inboxFolders.length > 0) {
    inboxFolders.forEach((folder, i) => {
      const primaryIcon = folder.is_primary ? '⭐ PRIMARY' : '   Secondary';
      console.log(`${i + 1}. ${primaryIcon} Inbox Folder:`);
      console.log(`   ID: ${folder.id}`);
      console.log(`   Graph ID: ${folder.graph_id}`);
      console.log(`   Display Name: ${folder.display_name}`);
      console.log(`   Folder Type: ${folder.folder_type}`);
      console.log(`   Parent: ${folder.parent_folder_id || 'Root'}`);
      console.log(`   Total Count: ${folder.total_count}`);
      console.log(`   Unread Count: ${folder.unread_count}`);
      console.log(`   Is Primary: ${folder.is_primary}`);
      console.log(`   Well-Known Name: ${folder.well_known_name || 'None'}`);
      console.log('');
    });
  }

  // Check for messages in each inbox
  for (const inbox of inboxFolders || []) {
    const { data: messages, count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', inbox.id);

    console.log(`📨 Messages stored in database for "${inbox.display_name}" (${inbox.graph_id.substring(0, 20)}...): ${count || 0}`);
  }

  console.log('\n📁 All folders:');
  folders?.forEach((f, i) => {
    const icon = f.folder_type === 'inbox' ? '📥' :
                 f.folder_type === 'sentitems' ? '📤' :
                 f.folder_type === 'drafts' ? '📝' :
                 f.folder_type === 'deleteditems' ? '🗑️' : '📁';
    console.log(`${i + 1}. ${icon} ${f.display_name} (${f.folder_type}) - ${f.total_count} total, ${f.unread_count} unread`);
  });
}

checkFolders();
