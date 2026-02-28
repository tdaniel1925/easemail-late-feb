import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';

interface DeltaSyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  deltaToken?: string;
  errors: string[];
}

interface GraphEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  body?: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName?: string;
  };
  isAllDay: boolean;
  recurrence?: any;
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
  onlineMeetingProvider?: string;
  organizer?: {
    emailAddress: {
      name?: string;
      address: string;
    };
  };
  attendees?: Array<{
    emailAddress: {
      name?: string;
      address: string;
    };
    status?: {
      response: string;
      time?: string;
    };
  }>;
  showAs?: string;
  responseStatus?: {
    response: string;
    time?: string;
  };
  reminderMinutesBeforeStart?: number;
  categories?: string[];
  importance?: string;
  sensitivity?: string;
  isCancelled: boolean;
  '@removed'?: {
    reason: string;
  };
}

export class CalendarDeltaSyncService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Perform delta sync for calendar events
   * Uses delta tokens to only fetch changes since last sync
   */
  async syncCalendar(): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Get current delta token for this account
      const resourceType = 'calendar';
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('delta_token')
        .eq('account_id', this.accountId)
        .eq('resource_type', resourceType)
        .single();

      const deltaToken = syncState?.delta_token;

      // Build delta query URL
      // NOTE: Delta queries do NOT support $select, $filter, $orderby, $expand, or $search
      // These parameters will cause a 400 error from Microsoft Graph
      let deltaUrl = '/me/calendar/events/delta';

      // If we have a delta token, use it for incremental sync
      if (deltaToken) {
        deltaUrl = deltaToken; // Delta token contains full URL with skipToken
        console.log(`[Calendar Sync] Using delta token for incremental sync`);
      } else {
        console.log(`[Calendar Sync] Starting initial sync (full fetch)`);
      }

      // Fetch events using delta query
      let hasMore = true;
      let nextLink = deltaUrl;
      let newDeltaToken: string | undefined;

      while (hasMore) {
        try {
          const response = await this.graphClient.api(nextLink).get();

          const events: GraphEvent[] = response.value || [];
          console.log(`[Calendar Sync] Fetched ${events.length} events from Graph API`);

          // Process each event
          for (const event of events) {
            try {
              if (event['@removed'] || event.isCancelled) {
                // Event was deleted or cancelled
                console.log(`[Calendar Sync] Deleting event: ${event.id}`);
                await this.deleteEvent(event.id);
                result.deleted++;
              } else {
                // Event was created or updated
                const isNew = await this.upsertEvent(event);
                if (isNew) {
                  result.created++;
                  console.log(`[Calendar Sync] ✓ Created: "${event.subject || '(No Subject)'}" on ${event.start.dateTime}`);
                } else {
                  result.updated++;
                  console.log(`[Calendar Sync] ↻ Updated: "${event.subject || '(No Subject)'}"`);
                }
              }
              result.synced++;
            } catch (error: any) {
              console.error(`[Calendar Sync] ✗ Failed to process event "${event.subject || event.id}": ${error.message}`);
              result.errors.push(`Failed to process event ${event.id}: ${error.message}`);
            }
          }

          // Check for next page or delta link
          if (response['@odata.nextLink']) {
            nextLink = response['@odata.nextLink'];
          } else if (response['@odata.deltaLink']) {
            newDeltaToken = response['@odata.deltaLink'];
            hasMore = false;
          } else {
            hasMore = false;
          }
        } catch (error: any) {
          result.errors.push(`Delta query failed: ${error.message}`);
          hasMore = false;
        }
      }

      // Store new delta token for next sync
      if (newDeltaToken) {
        await supabase
          .from('sync_state')
          .upsert({
            account_id: this.accountId,
            resource_type: resourceType,
            delta_token: newDeltaToken,
            last_sync_at: new Date().toISOString(),
            sync_status: 'completed',
          });

        result.deltaToken = newDeltaToken;
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Calendar delta sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Upsert an event into the database
   * Returns true if created, false if updated
   */
  private async upsertEvent(event: GraphEvent): Promise<boolean> {
    const supabase = createAdminClient();

    // Check if event exists
    const { data: existing } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('account_id', this.accountId)
      .eq('graph_id', event.id)
      .single();

    // Map response status
    const responseStatusMap: { [key: string]: string } = {
      'none': 'none',
      'organizer': 'organizer',
      'tentativelyAccepted': 'tentativelyAccepted',
      'accepted': 'accepted',
      'declined': 'declined',
      'notResponded': 'notResponded',
    };

    const responseStatus = event.responseStatus?.response
      ? responseStatusMap[event.responseStatus.response] || 'none'
      : 'none';

    // Map event status from showAs field
    const statusMap: { [key: string]: string } = {
      'free': 'tentative',
      'tentative': 'tentative',
      'busy': 'confirmed',
      'oof': 'confirmed',
      'workingElsewhere': 'confirmed',
    };

    const status = event.showAs ? statusMap[event.showAs] || 'confirmed' : 'confirmed';

    const eventData = {
      account_id: this.accountId,
      graph_id: event.id,
      subject: event.subject || '(No Subject)',
      body_html: event.body?.contentType === 'html' ? event.body.content : null,
      body_text: event.body?.contentType === 'text' ? event.body.content : event.bodyPreview || null,
      location: event.location?.displayName || null,
      start_time: new Date(event.start.dateTime).toISOString(),
      end_time: new Date(event.end.dateTime).toISOString(),
      is_all_day: event.isAllDay,
      is_recurring: !!event.recurrence,
      recurrence_pattern: event.recurrence || null,
      is_online_meeting: event.isOnlineMeeting,
      meeting_url: event.onlineMeetingUrl || null,
      meeting_provider: event.onlineMeetingProvider || null,
      organizer_name: event.organizer?.emailAddress?.name || null,
      organizer_email: event.organizer?.emailAddress?.address || null,
      attendees: event.attendees?.map(a => ({
        name: a.emailAddress.name || null,
        email: a.emailAddress.address,
        status: a.status?.response || 'none',
      })) || [],
      status,
      response_status: responseStatus,
      reminder_minutes: event.reminderMinutesBeforeStart || 15,
      categories: event.categories || [],
      importance: (event.importance?.toLowerCase() || 'normal') as 'low' | 'normal' | 'high',
      sensitivity: (event.sensitivity?.toLowerCase() || 'normal') as 'normal' | 'personal' | 'private' | 'confidential',
    };

    if (existing) {
      // Update existing event
      const { error } = await supabase
        .from('calendar_events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update event: ${error.message}`);
      }

      return false; // Updated
    } else {
      // Create new event
      const { error } = await supabase
        .from('calendar_events')
        .insert(eventData);

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      return true; // Created
    }
  }

  /**
   * Delete an event from the database
   */
  private async deleteEvent(graphId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('account_id', this.accountId)
      .eq('graph_id', graphId);

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  /**
   * Get sync statistics for an account
   */
  static async getSyncStats(accountId: string): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    lastSyncAt: string | null;
  }> {
    const supabase = createAdminClient();

    const { count: totalCount } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const now = new Date().toISOString();
    const { count: upcomingCount } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .gte('start_time', now);

    const { data: syncState } = await supabase
      .from('sync_state')
      .select('last_sync_at')
      .eq('account_id', accountId)
      .eq('resource_type', 'calendar')
      .single();

    return {
      totalEvents: totalCount || 0,
      upcomingEvents: upcomingCount || 0,
      lastSyncAt: syncState?.last_sync_at || null,
    };
  }
}
