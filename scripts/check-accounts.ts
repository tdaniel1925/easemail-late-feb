import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAccounts() {
  console.log('Checking connected accounts...\n');

  const { data, error } = await supabase
    .from('connected_accounts')
    .select('id, email, status, created_at, last_full_sync_at, status_message, initial_sync_complete')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('❌ No accounts found in database!');
    console.log('Please connect an account first using the auth flow.');
    process.exit(1);
  }

  console.log(`Found ${data.length} account(s):\n`);

  data.forEach((account, i) => {
    console.log(`${i + 1}. ${account.email}`);
    console.log(`   ID: ${account.id}`);
    console.log(`   Status: ${account.status}`);
    if (account.status_message) {
      console.log(`   Message: ${account.status_message}`);
    }
    console.log(`   Initial sync: ${account.initial_sync_complete ? 'Yes' : 'No'}`);
    console.log(`   Last sync: ${account.last_full_sync_at || 'Never'}`);
    console.log();
  });
}

checkAccounts().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
