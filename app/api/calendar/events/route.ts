import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClientWithToken } from '@/lib/graph/client';
import { tokenService } from '@/lib/graph/token-service';

/**
 * GET /api/calendar/events
 * List calendar events with filtering and date range support
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - startDate (optional): Start date for filter (ISO 8601)
 * - endDate (optional): End date for filter (ISO 8601)
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 * - responseStatus (optional): Filter by response status (accepted, tentativelyAccepted, declined, etc.)
 * - isOnlineMeeting (optional): Filter to online meetings only
 * - sortBy (optional): Sort field (start_time, subject, importance)
 * - sortOrder (optional): Sort direction (asc, desc - default: asc)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );
    const offset = (page - 1) * limit;

    // Filter parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const responseStatus = searchParams.get('responseStatus');
    const isOnlineMeeting = searchParams.get('isOnlineMeeting');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'start_time';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    // Validate account exists and is active
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status === 'error' || account.status === 'disconnected') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('calendar_events')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .neq('status', 'cancelled'); // Don't show cancelled events by default

    // Apply date range filters
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    // Apply response status filter
    if (responseStatus && ['none', 'organizer', 'tentativelyAccepted', 'accepted', 'declined', 'notResponded'].includes(responseStatus)) {
      query = query.eq('response_status', responseStatus);
    }

    // Apply online meeting filter
    if (isOnlineMeeting === 'true') {
      query = query.eq('is_online_meeting', true);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: events, error, count } = await query;

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events', details: error.message },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      events: events || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/calendar/events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event via Microsoft Graph
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - subject (required): Event subject
 * - startTime (required): Start time (ISO 8601)
 * - endTime (required): End time (ISO 8601)
 * - isAllDay (optional): All-day event flag
 * - location (optional): Event location
 * - body (optional): Event description (HTML or text)
 * - isOnlineMeeting (optional): Create Teams meeting
 * - attendees (optional): Array of { email, name }
 * - reminderMinutes (optional): Reminder time before event
 * - categories (optional): Array of category strings
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountId,
      subject,
      startTime,
      endTime,
      isAllDay = false,
      location,
      body: eventBody,
      isOnlineMeeting = false,
      attendees = [],
      reminderMinutes = 15,
      categories = [],
    } = body;

    // Validate required fields
    if (!accountId || !subject || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'accountId, subject, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get access token
    let accessToken: string;
    try {
      accessToken = await tokenService.getAccessToken(accountId);
    } catch (err: any) {
      console.error('[Calendar Events API] Failed to get access token:', err);
      return NextResponse.json(
        { error: 'Failed to get access token. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = createGraphClientWithToken(accessToken);

    // Build Graph API event object
    const graphEvent: any = {
      subject,
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'UTC',
      },
      isAllDay,
      isOnlineMeeting,
      reminderMinutesBeforeStart: reminderMinutes,
    };

    if (location) {
      graphEvent.location = { displayName: location };
    }

    if (eventBody) {
      graphEvent.body = {
        contentType: 'HTML',
        content: eventBody,
      };
    }

    if (attendees.length > 0) {
      graphEvent.attendees = attendees.map((att: any) => ({
        emailAddress: {
          address: att.email,
          name: att.name || att.email,
        },
        type: 'required',
      }));
    }

    if (categories.length > 0) {
      graphEvent.categories = categories;
    }

    // Create event via Graph API
    const createdEvent = await graphClient
      .api('/me/calendar/events')
      .post(graphEvent);

    console.log('[Calendar Events API] Created event:', createdEvent.id);

    // Map to our database format
    const dbEvent = {
      account_id: accountId,
      graph_id: createdEvent.id,
      subject: createdEvent.subject,
      body_html: createdEvent.body?.contentType === 'html' ? createdEvent.body.content : null,
      body_text: createdEvent.body?.contentType === 'text' ? createdEvent.body.content : createdEvent.bodyPreview || null,
      location: createdEvent.location?.displayName || null,
      start_time: new Date(createdEvent.start.dateTime).toISOString(),
      end_time: new Date(createdEvent.end.dateTime).toISOString(),
      is_all_day: createdEvent.isAllDay,
      is_recurring: false,
      recurrence_pattern: null,
      is_online_meeting: createdEvent.isOnlineMeeting,
      meeting_url: createdEvent.onlineMeetingUrl || null,
      meeting_provider: createdEvent.onlineMeetingProvider || null,
      organizer_name: createdEvent.organizer?.emailAddress?.name || null,
      organizer_email: createdEvent.organizer?.emailAddress?.address || null,
      attendees: createdEvent.attendees?.map((a: any) => ({
        name: a.emailAddress.name || null,
        email: a.emailAddress.address,
        status: a.status?.response || 'none',
      })) || [],
      status: 'confirmed',
      response_status: 'organizer',
      reminder_minutes: createdEvent.reminderMinutesBeforeStart || 15,
      categories: createdEvent.categories || [],
      importance: 'normal',
      sensitivity: 'normal',
    };

    // Save to database
    const { data: savedEvent, error: saveError } = await supabase
      .from('calendar_events')
      .insert(dbEvent)
      .select()
      .single();

    if (saveError) {
      console.error('[Calendar Events API] Failed to save event to database:', saveError);
      return NextResponse.json(
        { error: 'Failed to save event', details: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: savedEvent,
    });
  } catch (error: any) {
    console.error('[Calendar Events API] Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}
