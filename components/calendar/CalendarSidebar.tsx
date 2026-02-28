"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, Video, MapPin, Plus, Loader2 } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAccountStore } from "@/stores/account-store";
import { useMailStore } from "@/stores/mail-store";

interface UpcomingEvent {
  id: string;
  subject: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  is_online_meeting: boolean | null;
  meeting_url: string | null;
}

export function CalendarSidebar() {
  const { activeAccountId } = useAccountStore();
  const { openEditor, setViewedEvent } = useCalendarStore();
  const { viewedMessageId, getMessageById } = useMailStore();

  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewedMessage = viewedMessageId ? getMessageById(viewedMessageId) : null;

  // Fetch today's upcoming events
  const fetchUpcomingEvents = useCallback(async () => {
    if (!activeAccountId) {
      setUpcomingEvents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        accountId: activeAccountId,
        startDate: now.toISOString(),
        endDate: endOfDay.toISOString(),
        limit: '3',
        sortBy: 'start_time',
        sortOrder: 'asc',
      });

      const response = await fetch(`/api/calendar/events?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setUpcomingEvents(data.events || []);
    } catch (err: any) {
      console.error('Error fetching upcoming events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeAccountId]);

  useEffect(() => {
    fetchUpcomingEvents();

    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUpcomingEvents]);

  const handleScheduleMeeting = () => {
    if (!viewedMessage) {
      openEditor('create');
      return;
    }

    // Pre-fill attendees from email
    const attendees: string[] = [];

    if (viewedMessage.sender_email) {
      attendees.push(viewedMessage.sender_email);
    }

    if (viewedMessage.to_recipients) {
      viewedMessage.to_recipients.forEach((recipient: any) => {
        const email = recipient.emailAddress?.address || recipient;
        if (email && !attendees.includes(email)) {
          attendees.push(email);
        }
      });
    }

    // Store attendees in session storage for the event editor to pick up
    sessionStorage.setItem('calendar_prefill_attendees', JSON.stringify(attendees));
    sessionStorage.setItem('calendar_prefill_subject', viewedMessage.subject || '');

    openEditor('create');
  };

  const getEventTimeDisplay = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);

    let prefix = '';
    if (isToday(start)) {
      prefix = 'Today';
    } else if (isTomorrow(start)) {
      prefix = 'Tomorrow';
    } else {
      prefix = format(start, 'MMM d');
    }

    return `${prefix} ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <div className="flex h-full flex-col border-l border-border-default bg-surface-secondary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default bg-surface-primary px-3 py-2">
        <div className="flex items-center gap-2">
          <Calendar size={14} strokeWidth={1.5} className="text-text-tertiary" />
          <h3 className="text-xs font-semibold text-text-primary">Upcoming</h3>
        </div>
        <button
          onClick={handleScheduleMeeting}
          className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Schedule meeting"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-text-tertiary" />
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-xs text-red-500">Failed to load events</p>
            <button
              onClick={fetchUpcomingEvents}
              className="mt-2 text-xs text-text-tertiary hover:text-text-primary"
            >
              Try again
            </button>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={32} strokeWidth={1} className="mx-auto mb-2 text-text-tertiary opacity-40" />
            <p className="text-xs text-text-tertiary">No events today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setViewedEvent(event.id)}
                className="w-full rounded-md border border-border-subtle bg-surface-primary p-2 text-left transition-colors hover:border-border-default hover:bg-surface-tertiary"
              >
                {/* Event title */}
                <div className="mb-1 text-xs font-medium text-text-primary line-clamp-2">
                  {event.subject || '(No title)'}
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                  <Clock size={10} strokeWidth={1.5} />
                  <span>{getEventTimeDisplay(event.start_time, event.end_time)}</span>
                </div>

                {/* Location or online meeting */}
                {event.is_online_meeting && event.meeting_url ? (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-500">
                    <Video size={10} strokeWidth={1.5} />
                    <span>Teams meeting</span>
                  </div>
                ) : event.location ? (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-text-tertiary">
                    <MapPin size={10} strokeWidth={1.5} />
                    <span className="truncate">{event.location}</span>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {/* Schedule meeting CTA */}
        {viewedMessage && (
          <div className="mt-4 rounded-md border border-dashed border-border-default bg-surface-primary p-3">
            <p className="mb-2 text-xs text-text-secondary">
              Schedule a meeting with the people in this email?
            </p>
            <button
              onClick={handleScheduleMeeting}
              className="w-full rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Schedule Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
