#!/usr/bin/env tsx
/**
 * Test Script: Calendar Sync Verification
 *
 * Tests:
 * 1. Calendar events sync with all fields
 * 2. Online meeting URLs are extracted
 * 3. Recurring events store recurrence patterns
 * 4. Attendees and response status tracked
 * 5. Delta tokens work for incremental sync
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { CalendarDeltaSyncService } from '@/lib/graph/calendar-sync';
import { createGraphClient } from '@/lib/graph/client';

const supabase = createAdminClient();

async function testCalendarSync() {
  console.log('🔍 Calendar Sync Test Started\n');

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
    // TEST 1: Calendar Delta Sync
    console.log('📅 TEST 1: Calendar Event Sync');
    console.log('----------------------------------------');

    const graphClient = await createGraphClient(account.id);
    const calendarSync = new CalendarDeltaSyncService(graphClient, account.id);

    const syncResult = await calendarSync.syncCalendar();

    console.log(`✅ Events created: ${syncResult.eventsCreated}`);
    console.log(`✅ Events updated: ${syncResult.eventsUpdated}`);
    console.log(`✅ Events deleted: ${syncResult.eventsDeleted}`);

    // Verify events in database
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('account_id', account.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
    } else {
      console.log(`\n📊 Upcoming events: ${events.length}`);
      events.forEach((event, i) => {
        const meetingIcon = event.is_online_meeting ? '🎥' : '📅';
        const recurIcon = event.is_recurring ? '🔄' : '  ';
        console.log(`   ${i + 1}. ${meetingIcon} ${recurIcon} ${event.subject || '(No Subject)'}`);
        console.log(`      ${new Date(event.start_time).toLocaleString()} - ${new Date(event.end_time).toLocaleString()}`);
        if (event.location) {
          console.log(`      📍 ${event.location}`);
        }
      });
    }

    // TEST 2: Online Meeting Verification
    console.log('\n🎥 TEST 2: Online Meeting Extraction');
    console.log('----------------------------------------');

    const { data: onlineMeetings, error: meetingsError } = await supabase
      .from('calendar_events')
      .select('subject, meeting_url, meeting_provider, is_online_meeting')
      .eq('account_id', account.id)
      .eq('is_online_meeting', true)
      .limit(5);

    if (meetingsError) {
      console.error('❌ Error fetching online meetings:', meetingsError);
    } else {
      console.log(`✅ Online meetings found: ${onlineMeetings.length}`);
      onlineMeetings.forEach((meeting, i) => {
        console.log(`   ${i + 1}. ${meeting.subject}`);
        console.log(`      Provider: ${meeting.meeting_provider || 'Unknown'}`);
        console.log(`      URL: ${meeting.meeting_url ? '✅ Present' : '❌ Missing'}`);
      });
    }

    // TEST 3: Recurring Events
    console.log('\n🔄 TEST 3: Recurring Event Patterns');
    console.log('----------------------------------------');

    const { data: recurringEvents, error: recurError } = await supabase
      .from('calendar_events')
      .select('subject, is_recurring, recurrence_pattern')
      .eq('account_id', account.id)
      .eq('is_recurring', true)
      .limit(5);

    if (recurError) {
      console.error('❌ Error fetching recurring events:', recurError);
    } else {
      console.log(`✅ Recurring events found: ${recurringEvents.length}`);
      recurringEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.subject}`);
        if (event.recurrence_pattern) {
          const pattern = typeof event.recurrence_pattern === 'string'
            ? JSON.parse(event.recurrence_pattern)
            : event.recurrence_pattern;
          console.log(`      Pattern: ${JSON.stringify(pattern.pattern || 'Unknown')}`);
        }
      });
    }

    // TEST 4: Attendees and Response Status
    console.log('\n👥 TEST 4: Attendees & Response Tracking');
    console.log('----------------------------------------');

    const { data: eventsWithAttendees, error: attendError } = await supabase
      .from('calendar_events')
      .select('subject, organizer_email, attendees, response_status')
      .eq('account_id', account.id)
      .not('attendees', 'eq', '[]')
      .limit(3);

    if (attendError) {
      console.error('❌ Error fetching events with attendees:', attendError);
    } else {
      console.log(`✅ Events with attendees: ${eventsWithAttendees.length}`);
      eventsWithAttendees.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.subject}`);
        console.log(`      Organizer: ${event.organizer_email}`);
        console.log(`      Your response: ${event.response_status}`);

        const attendees = typeof event.attendees === 'string'
          ? JSON.parse(event.attendees)
          : event.attendees;

        console.log(`      Attendees (${attendees.length}):`);
        attendees.slice(0, 3).forEach((att: any) => {
          const statusIcon = att.status === 'accepted' ? '✅' : att.status === 'declined' ? '❌' : '❓';
          console.log(`         ${statusIcon} ${att.name || att.email}`);
        });
      });
    }

    // TEST 5: Delta Token for Calendar
    console.log('\n🔐 TEST 5: Calendar Delta Token');
    console.log('----------------------------------------');

    const { data: syncState, error: syncError } = await supabase
      .from('sync_state')
      .select('resource_type, delta_token, last_sync_at')
      .eq('account_id', account.id)
      .eq('resource_type', 'calendar')
      .single();

    if (syncError) {
      console.error('❌ Error fetching calendar sync state:', syncError);
    } else {
      console.log(`✅ Delta token stored: ${syncState.delta_token ? 'Yes' : 'No'}`);
      console.log(`   Last sync: ${syncState.last_sync_at}`);
      console.log(`   Token preview: ${syncState.delta_token?.substring(0, 50)}...`);
    }

    // TEST 6: Field Completeness
    console.log('\n🔍 TEST 6: Field Completeness Check');
    console.log('----------------------------------------');

    const { data: sampleEvent } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('account_id', account.id)
      .limit(1)
      .single();

    if (sampleEvent) {
      console.log('✅ Checking a sample event:');
      console.log(`   Graph ID: ${sampleEvent.graph_id ? '✅' : '❌'}`);
      console.log(`   Subject: ${sampleEvent.subject ? '✅' : '❌'}`);
      console.log(`   Start Time: ${sampleEvent.start_time ? '✅' : '❌'}`);
      console.log(`   End Time: ${sampleEvent.end_time ? '✅' : '❌'}`);
      console.log(`   Body (HTML/Text): ${sampleEvent.body_html || sampleEvent.body_text ? '✅' : '❌'}`);
      console.log(`   Location: ${sampleEvent.location ? '✅' : '⚠️  Optional'}`);
      console.log(`   Organizer: ${sampleEvent.organizer_email ? '✅' : '❌'}`);
      console.log(`   Response Status: ${sampleEvent.response_status ? '✅' : '❌'}`);
      console.log(`   Importance: ${sampleEvent.importance ? '✅' : '❌'}`);
      console.log(`   Reminder: ${sampleEvent.reminder_minutes !== null ? '✅' : '❌'}`);
    }

    console.log('\n✅ Calendar Sync Test Completed Successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCalendarSync();
