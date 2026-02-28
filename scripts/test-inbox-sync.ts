import { createAdminClient } from '../lib/supabase/admin';
import { createGraphClient } from '../lib/graph/client';
import { MessageDeltaSyncService } from '../lib/graph/message-delta-sync';

async function testInboxSync() {
  const supabase = createAdminClient();
  const accountId = 'b4a1f744-1e80-4287-bb4d-01ac34dd7a8a';

  // Create Graph client (it will automatically get tokens using tokenService)
  console.log('Creating Graph client...');
  const graphClient = await createGraphClient(accountId);

  // Get the Inbox folder graph_id
  const { data: inboxFolder } = await supabase
    .from('account_folders')
    .select('id, graph_id, display_name, total_count')
    .eq('account_id', accountId)
    .eq('display_name', 'Inbox')
    .single();

  if (!inboxFolder) {
    console.error('Inbox folder not found!');
    return;
  }

  console.log(`\n=== Syncing Inbox ===`);
  console.log(`Folder: ${inboxFolder.display_name}`);
  console.log(`Graph ID: ${inboxFolder.graph_id}`);
  console.log(`Expected count from Graph: ${inboxFolder.total_count}`);
  console.log('');

  // Create sync service
  const messageSync = new MessageDeltaSyncService(
    graphClient,
    accountId,
    inboxFolder.graph_id
  );

  console.log('Starting message delta sync...\n');
  const startTime = Date.now();

  try {
    const result = await messageSync.syncMessages();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n=== Sync Results (${duration}s) ===`);
    console.log(`Synced: ${result.synced}`);
    console.log(`Created: ${result.created}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Deleted: ${result.deleted}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    if (result.deltaToken) {
      console.log(`\nDelta token saved: YES`);
    } else {
      console.log(`\nDelta token saved: NO`);
    }

    // Check how many messages are now in the database
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('folder_id', inboxFolder.id)
      .eq('is_deleted', false);

    console.log(`\nMessages in database: ${count}`);

  } catch (error: any) {
    console.error('\n=== SYNC FAILED ===');
    console.error(error);
    console.error('\nStack trace:');
    console.error(error.stack);
  }
}

testInboxSync().catch(console.error);
