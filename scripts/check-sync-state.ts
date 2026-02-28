import { createAdminClient } from '../lib/supabase/admin';

async function checkSyncState() {
  const supabase = createAdminClient();
  const accountId = 'b4a1f744-1e80-4287-bb4d-01ac34dd7a8a';
  const inboxFolderId = '145a4a6d-b028-4ac9-9289-07a1ce89eb31'; // The empty Inbox

  // Get the folder details
  const { data: inboxFolder } = await supabase
    .from('account_folders')
    .select('*')
    .eq('id', inboxFolderId)
    .single();

  console.log('=== Inbox Folder Details ===');
  console.log(JSON.stringify(inboxFolder, null, 2));

  // Check sync_state for this specific folder
  const { data: folderSyncState } = await supabase
    .from('sync_state')
    .select('*')
    .eq('account_id', accountId)
    .eq('resource_type', `messages:${inboxFolder?.graph_id}`);

  console.log('\n=== Sync State for Inbox Folder ===');
  console.log(JSON.stringify(folderSyncState, null, 2));

  // Check ALL sync states for this account
  const { data: allSyncStates } = await supabase
    .from('sync_state')
    .select('*')
    .eq('account_id', accountId);

  console.log('\n=== All Sync States for Account ===');
  console.log(`Total sync states: ${allSyncStates?.length || 0}`);
  allSyncStates?.forEach(state => {
    console.log(`- ${state.resource_type}: last sync ${state.last_sync_at}, status: ${state.sync_status}`);
  });

  // Check account status
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('email, status, status_message, initial_sync_complete, last_full_sync_at, messages_synced')
    .eq('id', accountId)
    .single();

  console.log('\n=== Account Status ===');
  console.log(JSON.stringify(account, null, 2));
}

checkSyncState().catch(console.error);
