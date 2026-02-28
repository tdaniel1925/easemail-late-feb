import { createAdminClient } from '../lib/supabase/admin';

async function fixAccountStatus() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('connected_accounts')
    .update({
      status: 'active',
      status_message: null,
    })
    .eq('id', 'f817b168-8de0-462b-a676-9e9b8295e8d5')
    .select();

  if (error) {
    console.error('Error updating account status:', error);
    process.exit(1);
  }

  console.log('Account status updated successfully:', data);
  process.exit(0);
}

fixAccountStatus();
