import { createAdminClient } from '../lib/supabase/admin';

async function checkInboxMessages() {
  const supabase = createAdminClient();
  const accountId = 'b4a1f744-1e80-4287-bb4d-01ac34dd7a8a';

  // Find the Inbox folder
  const { data: inboxFolder } = await supabase
    .from('account_folders')
    .select('id, graph_id, display_name, folder_type, total_count')
    .eq('account_id', accountId)
    .or('folder_type.eq.inbox,display_name.eq.Inbox')
    .single();

  console.log('=== Inbox Folder ===');
  console.log(JSON.stringify(inboxFolder, null, 2));

  if (!inboxFolder) {
    console.log('No inbox folder found!');
    return;
  }

  // Get total count in inbox
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('folder_id', inboxFolder.id)
    .eq('is_deleted', false);

  console.log(`\n=== Inbox Messages ===`);
  console.log(`Total messages: ${count}`);

  // Get most recent 10 messages in inbox (sorted by received_at DESC, which is what the API does)
  const { data: inboxMessages, error } = await supabase
    .from('messages')
    .select('subject, received_at, sent_at, from_address')
    .eq('account_id', accountId)
    .eq('folder_id', inboxFolder.id)
    .eq('is_deleted', false)
    .order('received_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n=== 10 Most Recent Inbox Messages (sorted by received_at DESC) ===');
    inboxMessages?.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.received_at}] ${msg.subject || '(No Subject)'} from ${msg.from_address}`);
    });
  }

  // Also check ALL folders to see what folders have messages
  const { data: allFolders } = await supabase
    .from('account_folders')
    .select('id, display_name, folder_type, total_count')
    .eq('account_id', accountId)
    .order('total_count', { ascending: false })
    .limit(10);

  console.log('\n=== Top 10 Folders by Message Count ===');
  for (const folder of allFolders || []) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('folder_id', folder.id)
      .eq('is_deleted', false);

    console.log(`${folder.display_name} (${folder.folder_type || 'custom'}): ${count} messages (folder.total_count: ${folder.total_count})`);
  }
}

checkInboxMessages().catch(console.error);
