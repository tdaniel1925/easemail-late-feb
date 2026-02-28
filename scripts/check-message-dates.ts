import { createAdminClient } from '../lib/supabase/admin';

async function checkMessageDates() {
  const supabase = createAdminClient();
  const accountId = 'b4a1f744-1e80-4287-bb4d-01ac34dd7a8a';

  // Get total count
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId);

  console.log(`Total messages: ${count}`);

  // Get most recent 10 messages
  const { data: recentMessages, error: recentError } = await supabase
    .from('messages')
    .select('subject, received_at, sent_at, from_address')
    .eq('account_id', accountId)
    .order('received_at', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('Error fetching recent messages:', recentError);
  } else {
    console.log('\n=== 10 Most Recent Messages ===');
    recentMessages?.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.received_at}] ${msg.subject || '(No Subject)'}`);
    });
  }

  // Get oldest 10 messages
  const { data: oldestMessages, error: oldestError } = await supabase
    .from('messages')
    .select('subject, received_at, sent_at, from_address')
    .eq('account_id', accountId)
    .order('received_at', { ascending: true })
    .limit(10);

  if (oldestError) {
    console.error('Error fetching oldest messages:', oldestError);
  } else {
    console.log('\n=== 10 Oldest Messages ===');
    oldestMessages?.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.received_at}] ${msg.subject || '(No Subject)'}`);
    });
  }

  // Get date range
  const { data: dateRange } = await supabase
    .from('messages')
    .select('received_at')
    .eq('account_id', accountId)
    .order('received_at', { ascending: true })
    .limit(1);

  const { data: dateRangeMax } = await supabase
    .from('messages')
    .select('received_at')
    .eq('account_id', accountId)
    .order('received_at', { ascending: false })
    .limit(1);

  if (dateRange && dateRange[0] && dateRangeMax && dateRangeMax[0]) {
    console.log(`\n=== Date Range ===`);
    console.log(`Oldest: ${dateRange[0].received_at}`);
    console.log(`Newest: ${dateRangeMax[0].received_at}`);
  }

  // Check sync state
  const { data: syncState } = await supabase
    .from('sync_state')
    .select('*')
    .eq('account_id', accountId)
    .eq('resource_type', 'messages');

  console.log('\n=== Sync State ===');
  console.log(JSON.stringify(syncState, null, 2));
}

checkMessageDates().catch(console.error);
