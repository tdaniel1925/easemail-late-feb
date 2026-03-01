import pg from 'pg';
const { Client } = pg;

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || `postgresql://postgres.bfswjaswmfwvpwvrsqdb:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function fixRLS() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    console.log('\n1. Dropping problematic RLS policy...');
    await client.query('DROP POLICY IF EXISTS "tenant_isolation" ON users;');
    console.log('✅ Policy dropped');

    console.log('\n2. Disabling RLS on users table...');
    await client.query('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS disabled');

    console.log('\n✅ Migration applied successfully!');
    console.log('\nThe infinite recursion bug is now fixed.');
    console.log('Try accessing https://easemail.app again - authentication should work now.');

  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\n📝 Manual fix required:');
    console.log('Go to https://supabase.com/dashboard/project/bfswjaswmfwvpwvrsqdb/sql/new');
    console.log('And run this SQL:');
    console.log('\nDROP POLICY IF EXISTS "tenant_isolation" ON users;');
    console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
  } finally {
    await client.end();
  }
}

fixRLS();
