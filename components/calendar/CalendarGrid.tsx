"use client";

import { useEffect, useCallback, useRef } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAccountStore } from "@/stores/account-store";
import { EventCard } from "./EventCard";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek
} from "date-fns";

export function CalendarGrid() {
  const {
    events,
    currentView,
    currentDate,
    isLoadingEvents,
    eventsError,
    responseStatusFilter,
    isOnlineMeetingFilter,
    setEvents,
    setViewedEvent,
    setLoadingEvents,
    setEventsError,
    setDateRange,
  } = useCalendarStore();

  const { activeAccountId } = useAccountStore();
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Apply filters to events
  const filteredEvents = events.filter(event => {
    // Filter by response status
    if (responseStatusFilter && event.response_status !== responseStatusFilter) {
      return false;
    }

    // Filter by online meeting
    if (isOnlineMeetingFilter === true && !event.is_online_meeting) {
      return false;
    }

    return true;
  });

  // Fetch events when account or date changes
  const fetchEvents = useCallback(async () => {
    if (!activeAccountId) {
      console.log('[CalendarGrid] Skipping fetch - missing accountId');
      setEvents([]);
      setEventsError(null);
      return;
    }

    console.log('[CalendarGrid] Fetching events');

    // Cancel any pending fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setLoadingEvents(true);
    setEventsError(null);

    try {
      // Get date range based on current view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const params = new URLSearchParams({
        accountId: activeAccountId,
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
        limit: '100',
      });

      const response = await fetch(`/api/calendar/events?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch events");
      }

      const data = await response.json();
      console.log('[CalendarGrid] Fetched', data.events?.length || 0, 'events');
      setEvents(data.events || []);
      setDateRange(monthStart.toISOString(), monthEnd.toISOString());
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching events:", err);
        setEventsError(err.message);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingEvents(false);
      }
    }
  }, [activeAccountId, currentDate, setEvents, setLoadingEvents, setEventsError, setDateRange]);

  useEffect(() => {
    fetchEvents();
  }, [activeAccountId, currentDate, fetchEvents]);

  if (isLoadingEvents) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-secondary">
        <div className="text-sm text-text-secondary">Loading events...</div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-secondary">
        <p className="text-sm font-medium text-red-500">Error loading events</p>
        <p className="mt-1 text-xs text-text-tertiary">{eventsError}</p>
        <button
          onClick={fetchEvents}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!activeAccountId) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-secondary">
        <p className="text-sm text-text-secondary">Select an account to view calendar</p>
      </div>
    );
  }

  // Render month view
  if (currentView === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getEventsForDay = (day: Date) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return filteredEvents.filter(event => {
        const eventDayStr = format(new Date(event.start_time), 'yyyy-MM-dd');
        return eventDayStr === dayStr;
      });
    };

    return (
      <div data-testid="calendar-grid" className="flex h-full flex-col overflow-hidden bg-surface-secondary">
        <div data-testid="month-view" className="flex h-full flex-col overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border-default bg-surface-primary">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="border-r border-border-subtle px-2 py-2 text-center text-xs font-medium text-text-tertiary last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, minmax(100px, 1fr))` }}>
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  data-testid={isCurrentDay ? "today-cell" : undefined}
                  className={`min-h-[100px] border-b border-r border-border-subtle p-2 last:border-r-0 ${
                    !isCurrentMonth ? 'bg-surface-tertiary/30' : 'bg-surface-secondary'
                  }`}
                >
                  {/* Day number */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isCurrentDay
                          ? 'flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-white'
                          : isCurrentMonth
                          ? 'font-medium text-text-primary'
                          : 'text-text-tertiary'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setViewedEvent(event.id)}
                        compact
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-text-tertiary">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Render agenda view (simple list)
  if (currentView === 'agenda') {
    const sortedEvents = [...filteredEvents].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    return (
      <div data-testid="calendar-grid" className="flex h-full flex-col overflow-hidden bg-surface-secondary">
        <div data-testid="agenda-view" className="flex-1 overflow-y-auto p-4">
          {sortedEvents.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-secondary">No events found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setViewedEvent(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render week view
  if (currentView === 'week') {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDayAndHour = (day: Date, hour: number) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return filteredEvents.filter(event => {
        const eventDayStr = format(new Date(event.start_time), 'yyyy-MM-dd');
        const eventHour = new Date(event.start_time).getHours();
        return eventDayStr === dayStr && eventHour === hour;
      });
    };

    return (
      <div data-testid="calendar-grid" className="flex h-full flex-col overflow-hidden bg-surface-secondary">
        <div data-testid="week-view" className="flex h-full flex-col overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-border-default bg-surface-primary">
          <div className="w-16 border-r border-border-subtle px-2 py-2"></div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="border-r border-border-subtle px-2 py-2 text-center last:border-r-0"
            >
              <div className="text-[10px] font-medium text-text-tertiary">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-sm ${
                  isToday(day)
                    ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent font-semibold text-white'
                    : 'font-medium text-text-primary'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border-subtle">
              <div className="w-16 border-r border-border-subtle px-2 py-1 text-right text-[10px] text-text-tertiary">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
              {days.map((day) => {
                const hourEvents = getEventsForDayAndHour(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="min-h-[60px] border-r border-border-subtle p-1 last:border-r-0"
                  >
                    {hourEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setViewedEvent(event.id)}
                        compact
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  // Render day view
  if (currentView === 'day') {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForHour = (hour: number) => {
      return filteredEvents.filter(event => {
        const eventDate = new Date(event.start_time);
        const eventDayStr = format(eventDate, 'yyyy-MM-dd');
        const currentDayStr = format(currentDate, 'yyyy-MM-dd');
        const eventHour = eventDate.getHours();
        return eventDayStr === currentDayStr && eventHour === hour;
      });
    };

    return (
      <div data-testid="calendar-grid" className="flex h-full flex-col overflow-hidden bg-surface-secondary">
        <div data-testid="day-view" className="flex h-full flex-col overflow-hidden">
        {/* Day header */}
        <div className="border-b border-border-default bg-surface-primary px-4 py-3">
          <div className="text-sm font-medium text-text-primary">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            return (
              <div key={hour} className="flex border-b border-border-subtle">
                <div className="w-20 flex-shrink-0 border-r border-border-subtle px-3 py-2 text-right text-xs text-text-tertiary">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                <div className="min-h-[80px] flex-1 p-2">
                  {hourEvents.length === 0 ? (
                    <div className="h-full"></div>
                  ) : (
                    <div className="space-y-2">
                      {hourEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onClick={() => setViewedEvent(event.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex h-full items-center justify-center bg-surface-secondary">
      <p className="text-sm text-text-secondary">Unknown view: {currentView}</p>
    </div>
  );
}
