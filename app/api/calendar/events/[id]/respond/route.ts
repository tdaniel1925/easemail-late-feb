import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClientWithToken } from '@/lib/graph/client';
import { tokenService } from '@/lib/graph/token-service';

/**
 * POST /api/calendar/events/[id]/respond
 * Respond to a calendar event invitation (Accept/Tentative/Decline)
 *
 * Body:
 * - response (required): 'accepted', 'tentativelyAccepted', or 'declined'
 * - comment (optional): Comment to include with response
 */
export async function POST(
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
    const { response, comment } = body;

    // Validate response type
    if (!response || !['accepted', 'tentativelyAccepted', 'declined'].includes(response)) {
      return NextResponse.json(
        { error: 'response must be one of: accepted, tentativelyAccepted, declined' },
        { status: 400 }
      );
    }

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

    // Build response payload
    const responsePayload: any = {
      sendResponse: true,
    };

    if (comment) {
      responsePayload.comment = comment;
    }

    // Send response via Graph API
    let apiEndpoint: string;
    switch (response) {
      case 'accepted':
        apiEndpoint = `/me/calendar/events/${event.graph_id}/accept`;
        break;
      case 'tentativelyAccepted':
        apiEndpoint = `/me/calendar/events/${event.graph_id}/tentativelyAccept`;
        break;
      case 'declined':
        apiEndpoint = `/me/calendar/events/${event.graph_id}/decline`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid response type' },
          { status: 400 }
        );
    }

    await graphClient.api(apiEndpoint).post(responsePayload);

    console.log(`[Calendar Events API] Responded to event ${event.graph_id}: ${response}`);

    // Update database
    const { data: updatedEvent, error: updateError } = await supabase
      .from('calendar_events')
      .update({
        response_status: response,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('[Calendar Events API] Failed to update event in database:', updateError);
      return NextResponse.json(
        { error: 'Failed to update event', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('[Calendar Events API] Error responding to event:', error);
    return NextResponse.json(
      { error: 'Failed to respond to event', details: error.message },
      { status: 500 }
    );
  }
}
