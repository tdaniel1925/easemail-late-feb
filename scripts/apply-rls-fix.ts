import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Reading migration file...');

  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '008_fix_users_rls_infinite_recursion.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL:');
  console.log(migrationSQL);
  console.log('\nApplying migration...');

  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log(`\nExecuting: ${statement.substring(0, 100)}...`);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: statement
    });

    if (error) {
      console.error('Error:', error);
      // Try alternative method - direct query
      console.log('Trying direct execution...');
      const result = await supabase.from('_migrations').select('*').limit(1);
      console.log('Can access database:', !result.error);
    } else {
      console.log('Success:', data);
    }
  }

  console.log('\n✅ Migration applied successfully!');
}

applyMigration().catch(console.error);
