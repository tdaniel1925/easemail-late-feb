import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClientWithToken } from '@/lib/graph/client';
import { tokenService } from '@/lib/graph/token-service';

/**
 * PATCH /api/calendar/events/[id]
 * Update an existing calendar event via Microsoft Graph
 *
 * Body:
 * - subject (optional): Event subject
 * - startTime (optional): Start time (ISO 8601)
 * - endTime (optional): End time (ISO 8601)
 * - isAllDay (optional): All-day event flag
 * - location (optional): Event location
 * - body (optional): Event description (HTML or text)
 * - isOnlineMeeting (optional): Create Teams meeting
 * - attendees (optional): Array of { email, name }
 * - reminderMinutes (optional): Reminder time before event
 * - categories (optional): Array of category strings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const body = await request.json();
    const {
      subject,
      startTime,
      endTime,
      isAllDay,
      location,
      body: eventBody,
      isOnlineMeeting,
      attendees,
      reminderMinutes,
      categories,
    } = body;

    const supabase = await createClient();

    // Get event from database to get account_id and graph_id
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('id, account_id, graph_id, connected_accounts!inner(tenant_id)')
      .eq('id', eventId)
      .eq('connected_accounts.tenant_id', user.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get access token
    let accessToken: string;
    try {
      accessToken = await tokenService.getAccessToken(event.account_id);
    } catch (err: any) {
      console.error('[Calendar Events API] Failed to get access token:', err);
      return NextResponse.json(
        { error: 'Failed to get access token. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = createGraphClientWithToken(accessToken);

    // Build update object (only include provided fields)
    const graphUpdate: any = {};

    if (subject !== undefined) graphUpdate.subject = subject;
    if (isAllDay !== undefined) graphUpdate.isAllDay = isAllDay;
    if (isOnlineMeeting !== undefined) graphUpdate.isOnlineMeeting = isOnlineMeeting;
    if (reminderMinutes !== undefined) graphUpdate.reminderMinutesBeforeStart = reminderMinutes;

    if (startTime !== undefined) {
      graphUpdate.start = {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'UTC',
      };
    }

    if (endTime !== undefined) {
      graphUpdate.end = {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'UTC',
      };
    }

    if (location !== undefined) {
      graphUpdate.location = location ? { displayName: location } : null;
    }

    if (eventBody !== undefined) {
      graphUpdate.body = {
        contentType: 'HTML',
        content: eventBody,
      };
    }

    if (attendees !== undefined) {
      graphUpdate.attendees = attendees.map((att: any) => ({
        emailAddress: {
          address: att.email,
          name: att.name || att.email,
        },
        type: 'required',
      }));
    }

    if (categories !== undefined) {
      graphUpdate.categories = categories;
    }

    // Update event via Graph API
    const updatedEvent = await graphClient
      .api(`/me/calendar/events/${event.graph_id}`)
      .patch(graphUpdate);

    console.log('[Calendar Events API] Updated event:', updatedEvent.id);

    // Map to our database format
    const dbUpdate: any = {
      updated_at: new Date().toISOString(),
    };

    if (subject !== undefined) dbUpdate.subject = updatedEvent.subject;
    if (startTime !== undefined) dbUpdate.start_time = new Date(updatedEvent.start.dateTime).toISOString();
    if (endTime !== undefined) dbUpdate.end_time = new Date(updatedEvent.end.dateTime).toISOString();
    if (isAllDay !== undefined) dbUpdate.is_all_day = updatedEvent.isAllDay;
    if (location !== undefined) dbUpdate.location = updatedEvent.location?.displayName || null;
    if (eventBody !== undefined) {
      dbUpdate.body_html = updatedEvent.body?.contentType === 'html' ? updatedEvent.body.content : null;
      dbUpdate.body_text = updatedEvent.body?.contentType === 'text' ? updatedEvent.body.content : updatedEvent.bodyPreview || null;
    }
    if (isOnlineMeeting !== undefined) {
      dbUpdate.is_online_meeting = updatedEvent.isOnlineMeeting;
      dbUpdate.meeting_url = updatedEvent.onlineMeetingUrl || null;
      dbUpdate.meeting_provider = updatedEvent.onlineMeetingProvider || null;
    }
    if (attendees !== undefined) {
      dbUpdate.attendees = updatedEvent.attendees?.map((a: any) => ({
        name: a.emailAddress.name || null,
        email: a.emailAddress.address,
        status: a.status?.response || 'none',
      })) || [];
    }
    if (reminderMinutes !== undefined) dbUpdate.reminder_minutes = updatedEvent.reminderMinutesBeforeStart;
    if (categories !== undefined) dbUpdate.categories = updatedEvent.categories || [];

    // Update database
    const { data: savedEvent, error: saveError } = await supabase
      .from('calendar_events')
      .update(dbUpdate)
      .eq('id', eventId)
      .select()
      .single();

    if (saveError) {
      console.error('[Calendar Events API] Failed to update event in database:', saveError);
      return NextResponse.json(
        { error: 'Failed to update event', details: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: savedEvent,
    });
  } catch (error: any) {
    console.error('[Calendar Events API] Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events/[id]
 * Delete a calendar event via Microsoft Graph
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const supabase = await createClient();

    // Get event from database to get account_id and graph_id
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('id, account_id, graph_id, subject, connected_accounts!inner(tenant_id)')
      .eq('id', eventId)
      .eq('connected_accounts.tenant_id', user.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get access token
    let accessToken: string;
    try {
      accessToken = await tokenService.getAccessToken(event.account_id);
    } catch (err: any) {
      console.error('[Calendar Events API] Failed to get access token:', err);
      return NextResponse.json(
        { error: 'Failed to get access token. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = createGraphClientWithToken(accessToken);

    // Delete event via Graph API
    await graphClient
      .api(`/me/calendar/events/${event.graph_id}`)
      .delete();

    console.log('[Calendar Events API] Deleted event:', event.graph_id);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('[Calendar Events API] Failed to delete event from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete event', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    console.error('[Calendar Events API] Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
}
