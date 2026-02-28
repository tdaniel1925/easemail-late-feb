import { createAdminClient } from '../lib/supabase/admin';

async function checkAllFolders() {
  const supabase = createAdminClient();
  const accountId = 'b4a1f744-1e80-4287-bb4d-01ac34dd7a8a';

  // Get all folders
  const { data: folders, error } = await supabase
    .from('account_folders')
    .select('id, display_name, folder_type, graph_id, total_count')
    .eq('account_id', accountId)
    .order('display_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`=== All Folders (${folders?.length || 0} total) ===\n`);

  for (const folder of folders || []) {
    // Count actual messages in this folder
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('folder_id', folder.id)
      .eq('is_deleted', false);

    console.log(`${folder.display_name}`);
    console.log(`  - folder_type: ${folder.folder_type || 'null'}`);
    console.log(`  - graph_id: ${folder.graph_id.substring(0, 30)}...`);
    console.log(`  - total_count (from folder): ${folder.total_count}`);
    console.log(`  - actual message count: ${count}`);
    console.log('');
  }

  // Now try to find inbox with OR query
  const { data: inboxCandidates } = await supabase
    .from('account_folders')
    .select('id, display_name, folder_type')
    .eq('account_id', accountId)
    .or('folder_type.eq.inbox,display_name.ilike.%inbox%');

  console.log('=== Inbox Candidates ===');
  console.log(JSON.stringify(inboxCandidates, null, 2));
}

checkAllFolders().catch(console.error);
