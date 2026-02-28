#!/usr/bin/env tsx
/**
 * Test Script: Teams Sync Verification
 *
 * Tests:
 * 1. Teams and channels sync correctly
 * 2. Messages sync with all fields
 * 3. Reply threading works (reply_to_id)
 * 4. Reactions, attachments, mentions stored as JSON
 * 5. Delta tokens per channel
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { TeamsDeltaSyncService } from '@/lib/graph/teams-sync';
import { createGraphClient } from '@/lib/graph/client';

const supabase = createAdminClient();

async function testTeamsSync() {
  console.log('🔍 Teams Sync Test Started\n');

  // Get first active account
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
    // TEST 1: Teams & Channels Sync
    console.log('👥 TEST 1: Teams & Channels Sync');
    console.log('----------------------------------------');

    const graphClient = await createGraphClient(account.id);
    const teamsSync = new TeamsDeltaSyncService(graphClient, account.id);

    const syncResult = await teamsSync.syncTeams();

    console.log(`✅ Teams synced: ${syncResult.teamsCount}`);
    console.log(`✅ Channels synced: ${syncResult.channelsCount}`);
    console.log(`✅ Messages processed: ${syncResult.messagesProcessed}`);

    // Verify channels in database
    const { data: channels, error: channelsError } = await supabase
      .from('teams_channels')
      .select('*')
      .eq('account_id', account.id)
      .order('last_activity_at', { ascending: false });

    if (channelsError) {
      console.error('❌ Error fetching channels:', channelsError);
    } else {
      console.log(`\n📊 Channels in database: ${channels.length}`);
      channels.slice(0, 5).forEach((channel, i) => {
        const favIcon = channel.is_favorite ? '⭐' : '  ';
        console.log(`   ${i + 1}. ${favIcon} ${channel.team_name} / ${channel.channel_name}`);
        console.log(`      Members: ${channel.member_count}, Unread: ${channel.unread_count}`);
        console.log(`      Last activity: ${channel.last_activity_at ? new Date(channel.last_activity_at).toLocaleString() : 'Never'}`);
      });
    }

    // TEST 2: Messages with Threading
    console.log('\n💬 TEST 2: Message Threading');
    console.log('----------------------------------------');

    const { data: messages, error: msgsError } = await supabase
      .from('teams_messages')
      .select('id, body_text, from_name, reply_to_id, reply_count, created_at, channel_id')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgsError) {
      console.error('❌ Error fetching messages:', msgsError);
    } else {
      console.log(`✅ Recent messages: ${messages.length}`);

      const threaded = messages.filter(m => m.reply_to_id !== null);
      const parents = messages.filter(m => m.reply_count > 0);

      console.log(`   Threaded replies: ${threaded.length}`);
      console.log(`   Parent messages with replies: ${parents.length}`);

      messages.slice(0, 5).forEach((msg, i) => {
        const threadIcon = msg.reply_to_id ? '↪️' : msg.reply_count > 0 ? '💬' : '  ';
        console.log(`   ${i + 1}. ${threadIcon} ${msg.from_name}: ${msg.body_text?.substring(0, 50)}...`);
        if (msg.reply_count > 0) {
          console.log(`      ${msg.reply_count} ${msg.reply_count === 1 ? 'reply' : 'replies'}`);
        }
      });
    }

    // TEST 3: Reactions
    console.log('\n😊 TEST 3: Message Reactions');
    console.log('----------------------------------------');

    const { data: messagesWithReactions, error: reactError } = await supabase
      .from('teams_messages')
      .select('body_text, from_name, reactions')
      .eq('account_id', account.id)
      .not('reactions', 'eq', '[]')
      .limit(5);

    if (reactError) {
      console.error('❌ Error fetching messages with reactions:', reactError);
    } else {
      console.log(`✅ Messages with reactions: ${messagesWithReactions.length}`);
      messagesWithReactions.forEach((msg, i) => {
        const reactions = typeof msg.reactions === 'string'
          ? JSON.parse(msg.reactions)
          : msg.reactions;

        console.log(`   ${i + 1}. ${msg.from_name}: ${msg.body_text?.substring(0, 40)}...`);
        console.log(`      Reactions: ${reactions.length} types`);
      });
    }

    // TEST 4: Attachments & Mentions
    console.log('\n📎 TEST 4: Attachments & Mentions');
    console.log('----------------------------------------');

    const { data: richMessages, error: richError } = await supabase
      .from('teams_messages')
      .select('body_text, from_name, attachments, mentions')
      .eq('account_id', account.id)
      .or('attachments.neq.[],mentions.neq.[]')
      .limit(5);

    if (richError) {
      console.error('❌ Error fetching rich messages:', richError);
    } else {
      console.log(`✅ Messages with attachments/mentions: ${richMessages.length}`);
      richMessages.forEach((msg, i) => {
        const attachments = typeof msg.attachments === 'string'
          ? JSON.parse(msg.attachments)
          : msg.attachments;
        const mentions = typeof msg.mentions === 'string'
          ? JSON.parse(msg.mentions)
          : msg.mentions;

        console.log(`   ${i + 1}. ${msg.from_name}`);
        if (attachments && attachments.length > 0) {
          console.log(`      📎 ${attachments.length} attachment(s)`);
        }
        if (mentions && mentions.length > 0) {
          console.log(`      @ ${mentions.length} mention(s)`);
        }
      });
    }

    // TEST 5: Delta Tokens Per Channel
    console.log('\n🔐 TEST 5: Per-Channel Delta Tokens');
    console.log('----------------------------------------');

    const { data: teamsSyncStates, error: syncError } = await supabase
      .from('sync_state')
      .select('resource_type, delta_token, last_sync_at')
      .eq('account_id', account.id)
      .like('resource_type', 'teams:%')
      .limit(10);

    if (syncError) {
      console.error('❌ Error fetching Teams sync states:', syncError);
    } else {
      console.log(`✅ Delta tokens for Teams channels: ${teamsSyncStates.length}`);
      teamsSyncStates.forEach((state, i) => {
        const hasToken = state.delta_token ? '✅' : '❌';
        // Extract team:channel from resource_type
        const parts = state.resource_type.split(':');
        console.log(`   ${i + 1}. ${hasToken} Channel ${parts[2]?.substring(0, 8)}...`);
        console.log(`      Last sync: ${state.last_sync_at}`);
      });
    }

    // TEST 6: Field Completeness
    console.log('\n🔍 TEST 6: Field Completeness Check');
    console.log('----------------------------------------');

    const { data: sampleMessage } = await supabase
      .from('teams_messages')
      .select('*')
      .eq('account_id', account.id)
      .limit(1)
      .single();

    if (sampleMessage) {
      console.log('✅ Checking a sample message:');
      console.log(`   Graph ID: ${sampleMessage.graph_id ? '✅' : '❌'}`);
      console.log(`   Channel ID: ${sampleMessage.channel_id ? '✅' : '❌'}`);
      console.log(`   Body (HTML/Text): ${sampleMessage.body_html || sampleMessage.body_text ? '✅' : '❌'}`);
      console.log(`   From Name: ${sampleMessage.from_name ? '✅' : '❌'}`);
      console.log(`   From Email: ${sampleMessage.from_email ? '✅' : '⚠️  Optional'}`);
      console.log(`   Created At: ${sampleMessage.created_at ? '✅' : '❌'}`);
      console.log(`   Importance: ${sampleMessage.importance ? '✅' : '❌'}`);
      console.log(`   Reactions: ${sampleMessage.reactions ? '✅' : '❌'}`);
      console.log(`   Attachments: ${sampleMessage.attachments ? '✅' : '❌'}`);
      console.log(`   Mentions: ${sampleMessage.mentions ? '✅' : '❌'}`);
    }

    console.log('\n✅ Teams Sync Test Completed Successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testTeamsSync();
