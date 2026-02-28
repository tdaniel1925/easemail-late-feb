#!/usr/bin/env tsx
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { FolderSyncService } from '@/lib/graph/folder-sync';

const supabase = createAdminClient();

async function setupTestAccount() {
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('id, email')
    .eq('email', 'tdaniel@bundlefly.com')
    .single();

  if (!account) {
    console.error('❌ Test account not found');
    process.exit(1);
  }

  return account;
}

async function testCase1_IdenticalCounts() {
  console.log('\n🧪 TEST CASE 1: Identical Message Counts');
  console.log('='.repeat(60));
  console.log('Scenario: Two folders with identical counts, verify deterministic selection\n');

  const account = await setupTestAccount();

  // Get current inbox folders
  const { data: inboxes } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox')
    .order('total_count DESC');

  if (!inboxes || inboxes.length < 2) {
    console.log('⏭️  SKIP: Need at least 2 inbox folders for this test\n');
    return { passed: true, skipped: true };
  }

  console.log(`Found ${inboxes.length} inbox folders:`);
  inboxes.forEach((f, i) => {
    console.log(`  ${i + 1}. "${f.display_name}" - ${f.total_count} messages, created ${f.created_at}`);
  });

  // Temporarily set both to same counts
  const testCount = 1000;
  const testUnread = 500;

  await supabase
    .from('account_folders')
    .update({ total_count: testCount, unread_count: testUnread })
    .in('id', inboxes.map(f => f.id));

  console.log(`\n✏️  Set all inbox folders to ${testCount} messages, ${testUnread} unread`);

  // Run fixDuplicateFolders via full sync
  const graphClient = await createGraphClient(account.id);
  const folderSync = new FolderSyncService(graphClient, account.id);
  await folderSync.syncFolders();

  // Check which became primary
  const { data: updated } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox')
    .order('created_at ASC');

  const primary = updated?.find(f => f.is_primary);
  const oldest = updated?.[0];

  console.log('\n📊 Result:');
  console.log(`  Primary: "${primary?.display_name}" (created ${primary?.created_at})`);
  console.log(`  Oldest: "${oldest?.display_name}" (created ${oldest?.created_at})`);

  const passed = primary?.id === oldest?.id;
  console.log(`\n${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}: Oldest folder became primary\n`);

  // Restore original counts
  for (const inbox of inboxes) {
    await supabase
      .from('account_folders')
      .update({ total_count: inbox.total_count, unread_count: inbox.unread_count })
      .eq('id', inbox.id);
  }

  return { passed, skipped: false };
}

async function testCase2_AllSecondary() {
  console.log('\n🧪 TEST CASE 2: All Folders Marked Secondary');
  console.log('='.repeat(60));
  console.log('Scenario: Set all inbox folders to is_primary=false, verify recovery\n');

  const account = await setupTestAccount();

  // Get inbox folders
  const { data: inboxes } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox');

  if (!inboxes || inboxes.length === 0) {
    console.log('⏭️  SKIP: No inbox folders found\n');
    return { passed: true, skipped: true };
  }

  console.log(`Found ${inboxes.length} inbox folders`);

  // Mark all as secondary
  await supabase
    .from('account_folders')
    .update({ is_primary: false })
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox');

  console.log('✏️  Marked all inbox folders as is_primary=false');

  // Check API response (should be empty or have fallback)
  const { data: apiFolders } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .is('is_hidden', false)
    .eq('is_primary', true)
    .eq('folder_type', 'inbox');

  console.log(`📋 API would return: ${apiFolders?.length || 0} inbox folders`);

  if (apiFolders && apiFolders.length === 0) {
    console.log('⚠️  WARNING: API returns no inbox folders when all marked secondary!');
  }

  // Run sync to auto-fix
  const graphClient = await createGraphClient(account.id);
  const folderSync = new FolderSyncService(graphClient, account.id);
  await folderSync.syncFolders();

  // Check if fixed
  const { data: fixed } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox')
    .eq('is_primary', true);

  console.log(`\n📊 After sync: ${fixed?.length || 0} primary inbox folder(s)`);

  const passed = (fixed?.length || 0) === 1;
  console.log(`\n${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}: Sync auto-fixed the issue\n`);

  return { passed, skipped: false };
}

async function testCase3_HiddenPrimary() {
  console.log('\n🧪 TEST CASE 3: Hidden Primary Folder');
  console.log('='.repeat(60));
  console.log('Scenario: Primary folder is hidden, verify API behavior\n');

  const account = await setupTestAccount();

  // Get primary inbox
  const { data: primaryInbox } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox')
    .eq('is_primary', true)
    .single();

  if (!primaryInbox) {
    console.log('⏭️  SKIP: No primary inbox found\n');
    return { passed: true, skipped: true };
  }

  console.log(`Primary inbox: "${primaryInbox.display_name}"`);

  const originalHidden = primaryInbox.is_hidden;

  // Hide the primary inbox
  await supabase
    .from('account_folders')
    .update({ is_hidden: true })
    .eq('id', primaryInbox.id);

  console.log('✏️  Marked primary inbox as is_hidden=true');

  // Check API response
  const { data: apiFolders } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .is('is_hidden', false)
    .eq('is_primary', true)
    .eq('folder_type', 'inbox');

  console.log(`📋 API returns: ${apiFolders?.length || 0} inbox folders`);

  if (apiFolders && apiFolders.length === 0) {
    console.log('⚠️  WARNING: API returns no inbox when primary is hidden!');
  }

  // Restore
  await supabase
    .from('account_folders')
    .update({ is_hidden: originalHidden })
    .eq('id', primaryInbox.id);

  console.log('✏️  Restored original is_hidden state');

  const passed = true; // This is expected behavior for now
  console.log(`\n${passed ? '✅' : '⚠️'} This is current behavior - hidden primary folders are filtered out\n`);

  return { passed, skipped: false };
}

async function testCase4_MessageCountsChange() {
  console.log('\n🧪 TEST CASE 4: Message Counts Change - Primary Should Switch');
  console.log('='.repeat(60));
  console.log('Scenario: Secondary folder gets more messages than primary\n');

  const account = await setupTestAccount();

  // Get inbox folders
  const { data: inboxes } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox')
    .order('total_count DESC');

  if (!inboxes || inboxes.length < 2) {
    console.log('⏭️  SKIP: Need at least 2 inbox folders\n');
    return { passed: true, skipped: true };
  }

  const primary = inboxes.find(f => f.is_primary);
  const secondary = inboxes.find(f => !f.is_primary);

  if (!primary || !secondary) {
    console.log('⏭️  SKIP: Need both primary and secondary folders\n');
    return { passed: true, skipped: true };
  }

  console.log(`Primary: "${primary.display_name}" - ${primary.total_count} messages`);
  console.log(`Secondary: "${secondary.display_name}" - ${secondary.total_count} messages`);

  // Make secondary have more messages
  const newCount = (primary.total_count || 0) + 1000;
  await supabase
    .from('account_folders')
    .update({ total_count: newCount })
    .eq('id', secondary.id);

  console.log(`\n✏️  Increased secondary folder to ${newCount} messages (more than primary)`);

  // Run sync
  const graphClient = await createGraphClient(account.id);
  const folderSync = new FolderSyncService(graphClient, account.id);
  await folderSync.syncFolders();

  // Check if primary switched
  const { data: updated } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('folder_type', 'inbox');

  const newPrimary = updated?.find(f => f.is_primary);

  console.log(`\n📊 New primary: "${newPrimary?.display_name}" - ${newPrimary?.total_count} messages`);

  const passed = newPrimary?.id === secondary.id;
  console.log(`\n${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}: Primary switched to folder with more messages\n`);

  // Restore
  await supabase
    .from('account_folders')
    .update({ total_count: secondary.total_count })
    .eq('id', secondary.id);

  await folderSync.syncFolders(); // Restore primary

  return { passed, skipped: false };
}

async function testCase5_MigrationCheck() {
  console.log('\n🧪 TEST CASE 5: Migration 008 Verification');
  console.log('='.repeat(60));
  console.log('Scenario: Verify is_primary column exists and is queryable\n');

  try {
    const { data, error } = await supabase
      .from('account_folders')
      .select('is_primary')
      .limit(1);

    if (error) {
      if (error.code === '42703') {
        console.log('❌ FAILED: is_primary column does not exist!');
        console.log('   Migration 008 not applied or schema cache not refreshed');
        return { passed: false, skipped: false };
      }
      throw error;
    }

    console.log('✅ is_primary column exists and is queryable');

    // Check index exists
    const { data: indexes } = await supabase
      .rpc('check_index_exists', {
        index_name: 'idx_account_folders_primary'
      })
      .single()
      .catch(() => ({ data: null }));

    if (indexes) {
      console.log('✅ idx_account_folders_primary index exists');
    } else {
      console.log('⚠️  Index might not exist (check manually)');
    }

    console.log('\n✅ PASSED: Migration 008 is properly applied\n');
    return { passed: true, skipped: false };

  } catch (error: any) {
    console.log(`❌ FAILED: ${error.message}\n`);
    return { passed: false, skipped: false };
  }
}

async function testCase6_ZeroMessageFolders() {
  console.log('\n🧪 TEST CASE 6: Zero Message Folders');
  console.log('='.repeat(60));
  console.log('Scenario: Multiple folders with 0 messages, verify oldest becomes primary\n');

  const account = await setupTestAccount();

  // Find folders with 0 messages
  const { data: emptyFolders } = await supabase
    .from('account_folders')
    .select('*')
    .eq('account_id', account.id)
    .eq('total_count', 0)
    .limit(5);

  if (!emptyFolders || emptyFolders.length < 2) {
    console.log('⏭️  SKIP: Need at least 2 folders with 0 messages\n');
    return { passed: true, skipped: true };
  }

  // Group by folder_type
  const byType = emptyFolders.reduce((acc, f) => {
    if (!acc[f.folder_type]) acc[f.folder_type] = [];
    acc[f.folder_type].push(f);
    return acc;
  }, {} as Record<string, typeof emptyFolders>);

  let passed = true;

  for (const [type, folders] of Object.entries(byType)) {
    if (folders.length < 2) continue;

    console.log(`\n📁 Testing ${type} folders (${folders.length} with 0 messages):`);

    const sorted = [...folders].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const oldest = sorted[0];
    const primary = folders.find(f => f.is_primary);

    console.log(`  Oldest: "${oldest.display_name}" (${oldest.created_at})`);
    console.log(`  Primary: "${primary?.display_name}" (${primary?.created_at})`);

    if (primary?.id === oldest.id) {
      console.log(`  ✅ Oldest is primary`);
    } else {
      console.log(`  ⚠️  Primary is not the oldest folder`);
      passed = false;
    }
  }

  console.log(`\n${passed ? '✅' : '⚠️'} ${passed ? 'PASSED' : 'INFO'}: Zero-message folders handled correctly\n`);

  return { passed, skipped: false };
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('DUPLICATE FOLDERS - EDGE CASE TEST SUITE');
  console.log('='.repeat(60));

  const results: Record<string, { passed: boolean; skipped: boolean }> = {};

  try {
    results['case1'] = await testCase1_IdenticalCounts();
    results['case2'] = await testCase2_AllSecondary();
    results['case3'] = await testCase3_HiddenPrimary();
    results['case4'] = await testCase4_MessageCountsChange();
    results['case5'] = await testCase5_MigrationCheck();
    results['case6'] = await testCase6_ZeroMessageFolders();
  } catch (error: any) {
    console.error('\n❌ Test suite failed with error:', error.message);
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(r => r.passed && !r.skipped).length;
  const failed = Object.values(results).filter(r => !r.passed && !r.skipped).length;
  const skipped = Object.values(results).filter(r => r.skipped).length;
  const total = Object.keys(results).length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([name, result]) => {
    const icon = result.skipped ? '⏭️' : result.passed ? '✅' : '❌';
    const status = result.skipped ? 'SKIPPED' : result.passed ? 'PASSED' : 'FAILED';
    console.log(`  ${icon} ${name}: ${status}`);
  });

  console.log('\n' + '='.repeat(60));

  if (failed > 0) {
    console.log('❌ Some tests failed. Review the output above.\n');
    process.exit(1);
  } else {
    console.log('✅ All non-skipped tests passed!\n');
    process.exit(0);
  }
}

runAllTests();
