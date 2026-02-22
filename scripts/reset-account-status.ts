import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetAccountStatus() {
  console.log('Resetting account status...\n');

  const accountId = 'f817b168-8de0-462b-a676-9e9b8295e8d5';

  const { error } = await supabase
    .from('connected_accounts')
    .update({
      status: 'active',
      status_message: null,
    })
    .eq('id', accountId);

  if (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }

  console.log('✅ Account status reset to active');
  console.log('   Account ID:', accountId);
  console.log('   Email: info@tonnerow.com\n');
}

resetAccountStatus();
