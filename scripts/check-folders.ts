import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFolders() {
  const accountId = 'f817b168-8de0-462b-a676-9e9b8295e8d5';

  const { data: folders, error } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', accountId)
    .order('display_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total folders:', folders?.length);
  console.log('\nFolders:');
  folders?.forEach((f) => {
    console.log(`  - ${f.display_name} (type: ${f.folder_type}, graph_id: ${f.graph_id})`);
  });
}

checkFolders();
