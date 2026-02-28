#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAccounts() {
  const supabase = createAdminClient();

  const { data: accounts, error } = await supabase
    .from('connected_accounts')
    .select('id, email, status, error_count, last_error_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching accounts:', error);
    process.exit(1);
  }

  console.log('\n📧 Connected Accounts:');
  console.log('=====================');

  if (!accounts || accounts.length === 0) {
    console.log('No accounts found.');
  } else {
    accounts.forEach((acc, i) => {
      const statusIcon = acc.status === 'active' ? '✅' :
                        acc.status === 'needs_reauth' ? '⚠️' :
                        '❌';
      console.log(`\n${i + 1}. ${statusIcon} ${acc.email}`);
      console.log(`   Status: ${acc.status}`);
      console.log(`   Errors: ${acc.error_count || 0}`);
      console.log(`   Last error: ${acc.last_error_at || 'Never'}`);
    });
  }

  console.log('\n');
}

checkAccounts();
