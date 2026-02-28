import { createAdminClient } from '../lib/supabase/admin';

async function checkRecentMessages() {
  const supabase = createAdminClient();
  const accountId = 'b4a1f744-1e80-4287-bb4d-01ac34dd7a8a';

  // Find all inbox folders
  const { data: inboxFolders } = await supabase
    .from('account_folders')
    .select('id, display_name, folder_type, graph_id, total_count')
    .eq('account_id', accountId)
    .eq('folder_type', 'inbox')
    .order('total_count', { ascending: false });

  console.log('=== All Inbox Folders ===');
  inboxFolders?.forEach((folder, i) => {
    console.log(`${i + 1}. ${folder.display_name} (folder_type: ${folder.folder_type})`);
    console.log(`   ID: ${folder.id}`);
    console.log(`   Graph ID: ${folder.graph_id.substring(0, 30)}...`);
    console.log(`   Expected count: ${folder.total_count}`);
    console.log('');
  });

  // Check recent messages in each inbox folder
  for (const folder of inboxFolders || []) {
    const { data: recentMessages, count } = await supabase
      .from('messages')
      .select('subject, received_at, from_address', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('folder_id', folder.id)
      .eq('is_deleted', false)
      .order('received_at', { ascending: false })
      .limit(5);

    console.log(`=== ${folder.display_name} - Recent Messages (${count} total) ===`);
    if (recentMessages && recentMessages.length > 0) {
      recentMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.received_at}] ${msg.subject || '(No Subject)'}`);
      });
    } else {
      console.log('No messages found!');
    }
    console.log('');
  }

  // Check what folder the UI would query (using the new logic)
  const { data: uiFolder } = await supabase
    .from('account_folders')
    .select('id, display_name, total_count')
    .eq('account_id', accountId)
    .eq('folder_type', 'inbox')
    .order('total_count', { ascending: false })
    .limit(1)
    .single();

  console.log('=== Folder UI Will Query (Highest total_count) ===');
  console.log(`Display Name: ${uiFolder?.display_name}`);
  console.log(`Folder ID: ${uiFolder?.id}`);
  console.log(`Expected Count: ${uiFolder?.total_count}`);

  // Check messages in that folder
  const { data: uiMessages, count: uiCount } = await supabase
    .from('messages')
    .select('subject, received_at', { count: 'exact' })
    .eq('account_id', accountId)
    .eq('folder_id', uiFolder!.id)
    .eq('is_deleted', false)
    .order('received_at', { ascending: false })
    .limit(10);

  console.log(`\nMessages in UI folder: ${uiCount}`);
  console.log('Most recent 10:');
  uiMessages?.forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.received_at}] ${msg.subject || '(No Subject)'}`);
  });
}

checkRecentMessages().catch(console.error);
