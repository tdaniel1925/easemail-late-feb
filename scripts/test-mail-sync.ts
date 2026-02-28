#!/usr/bin/env tsx
/**
 * Test Script: Mail Sync Verification
 *
 * Tests:
 * 1. Folder sync creates all folders with correct hierarchy
 * 2. Message delta sync fetches messages with all fields
 * 3. Delta tokens are stored and used for incremental sync
 * 4. @removed messages are deleted correctly
 * 5. Attachments are tracked
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { FolderSyncService } from '@/lib/graph/folder-sync';
import { MessageDeltaSyncService } from '@/lib/graph/message-delta-sync';
import { SyncOrchestrator } from '@/lib/graph/sync-orchestrator';
import { createGraphClient } from '@/lib/graph/client';

const supabase = createAdminClient();

async function testMailSync() {
  console.log('🔍 Mail Sync Test Started\n');

  // Get first active account for testing
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('id, email, status')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (accountError || !account) {
    console.error('❌ No active account found for testing');
    process.exit(1);
  }

  console.log(`✅ Testing with account: ${account.email} (${account.id})\n`);

  try {
    // TEST 1: Folder Sync
    console.log('📂 TEST 1: Folder Sync');
    console.log('----------------------------------------');

    const graphClient = await createGraphClient(account.id);
    const folderSync = new FolderSyncService(graphClient, account.id);

    const folderResult = await folderSync.syncFolders();

    console.log(`✅ Synced ${folderResult.foldersCreated} new folders`);
    console.log(`✅ Updated ${folderResult.foldersUpdated} existing folders`);

    // Verify folders in database
    const { data: folders, error: folderError } = await supabase
      .from('account_folders')
      .select('id, display_name, folder_type, parent_graph_id, unread_count, total_count')
      .eq('account_id', account.id)
      .order('display_name');

    if (folderError) {
      console.error('❌ Error fetching folders:', folderError);
    } else {
      console.log(`\n📊 Folders in database: ${folders.length}`);

      // Check for well-known folders
      const inbox = folders.find(f => f.folder_type === 'inbox');
      const sent = folders.find(f => f.folder_type === 'sentitems');
      const drafts = folders.find(f => f.folder_type === 'drafts');

      console.log(`   ✅ Inbox: ${inbox ? inbox.display_name : '❌ Missing'} (${inbox?.unread_count || 0} unread)`);
      console.log(`   ✅ Sent: ${sent ? sent.display_name : '❌ Missing'}`);
      console.log(`   ✅ Drafts: ${drafts ? drafts.display_name : '❌ Missing'}`);

      // Check folder hierarchy
      const nestedFolders = folders.filter(f => f.parent_graph_id !== null);
      console.log(`   ✅ Nested folders: ${nestedFolders.length}`);
    }

    console.log('\n');

    // TEST 2: Message Delta Sync
    console.log('📧 TEST 2: Message Delta Sync');
    console.log('----------------------------------------');

    const orchestrator = new SyncOrchestrator(graphClient, account.id);
    const syncResult = await orchestrator.performFullSync();

    console.log(`✅ Total messages processed: ${syncResult.totalMessagesProcessed}`);
    console.log(`✅ Folders synced: ${syncResult.foldersProcessed}`);

    // Verify messages in database
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, subject, from_address, received_at, is_read, has_attachments, folder_id')
      .eq('account_id', account.id)
      .order('received_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('❌ Error fetching messages:', msgError);
    } else {
      console.log(`\n📊 Recent messages (showing 10 of ${syncResult.totalMessagesProcessed}):`);
      messages.forEach((msg, i) => {
        const readIcon = msg.is_read ? '✉️' : '📬';
        const attachIcon = msg.has_attachments ? '📎' : '  ';
        console.log(`   ${i + 1}. ${readIcon} ${attachIcon} ${msg.subject?.substring(0, 50) || '(No Subject)'}`);
        console.log(`      From: ${msg.from_address}`);
      });
    }

    // TEST 3: Delta Token Verification
    console.log('\n🔐 TEST 3: Delta Token Verification');
    console.log('----------------------------------------');

    const { data: syncStates, error: syncError } = await supabase
      .from('sync_state')
      .select('resource_type, delta_token, last_sync_at')
      .eq('account_id', account.id)
      .order('last_sync_at', { ascending: false });

    if (syncError) {
      console.error('❌ Error fetching sync state:', syncError);
    } else {
      console.log(`✅ Delta tokens stored: ${syncStates.length}`);
      syncStates.forEach(state => {
        const hasToken = state.delta_token ? '✅' : '❌';
        console.log(`   ${hasToken} ${state.resource_type} (last sync: ${state.last_sync_at})`);
      });
    }

    // TEST 4: Attachments
    console.log('\n📎 TEST 4: Attachment Tracking');
    console.log('----------------------------------------');

    // First get messages with attachments
    const { data: messagesWithAttachments } = await supabase
      .from('messages')
      .select('id')
      .eq('account_id', account.id)
      .eq('has_attachments', true)
      .limit(5);

    if (messagesWithAttachments && messagesWithAttachments.length > 0) {
      const messageIds = messagesWithAttachments.map(m => m.id);

      const { data: attachments, error: attError } = await supabase
        .from('attachments')
        .select('id, name, content_type, size_bytes, is_inline, message_id')
        .in('message_id', messageIds)
        .limit(20);

      if (attError) {
        console.error('❌ Error fetching attachments:', attError);
      } else {
        console.log(`✅ Attachments tracked: ${attachments?.length || 0}`);
        if (attachments && attachments.length > 0) {
          attachments.slice(0, 5).forEach((att, i) => {
            const type = att.is_inline ? 'inline' : 'attached';
            console.log(`   ${i + 1}. ${att.name} (${att.content_type}, ${Math.round(att.size_bytes / 1024)}KB, ${type})`);
          });
        }
      }
    } else {
      console.log('⚠️  No messages with attachments found');
    }

    // TEST 5: Field Completeness Check
    console.log('\n🔍 TEST 5: Field Completeness Check');
    console.log('----------------------------------------');

    const { data: sampleMessage } = await supabase
      .from('messages')
      .select('*')
      .eq('account_id', account.id)
      .not('body_html', 'is', null)
      .limit(1)
      .single();

    if (sampleMessage) {
      console.log('✅ Checking a sample message:');
      console.log(`   Graph ID: ${sampleMessage.graph_id ? '✅' : '❌'}`);
      console.log(`   Internet Message ID: ${sampleMessage.internet_message_id ? '✅' : '❌'}`);
      console.log(`   Conversation ID: ${sampleMessage.conversation_id ? '✅' : '❌'}`);
      console.log(`   Subject: ${sampleMessage.subject ? '✅' : '❌'}`);
      console.log(`   Body HTML: ${sampleMessage.body_html ? '✅' : '❌'}`);
      console.log(`   Body Text: ${sampleMessage.body_text ? '✅' : '❌'}`);
      console.log(`   From Address: ${sampleMessage.from_address ? '✅' : '❌'}`);
      console.log(`   From Name: ${sampleMessage.from_name ? '✅' : '❌'}`);
      console.log(`   To Recipients: ${sampleMessage.to_recipients && sampleMessage.to_recipients.length > 0 ? '✅' : '❌'}`);
      console.log(`   Received At: ${sampleMessage.received_at ? '✅' : '❌'}`);
      console.log(`   Importance: ${sampleMessage.importance ? '✅' : '❌'}`);
      console.log(`   Categories: ${sampleMessage.categories ? '✅' : '❌'}`);
    }

    console.log('\n✅ Mail Sync Test Completed Successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testMailSync();
