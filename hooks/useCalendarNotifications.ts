import { useEffect, useRef } from 'react';
import { useCalendarStore } from '@/stores/calendar-store';
import { useAccountStore } from '@/stores/account-store';

interface CalendarEvent {
  id: string;
  subject: string | null;
  start_time: string;
  reminder_minutes: number | null;
}

export function useCalendarNotifications() {
  const { activeAccountId } = useAccountStore();
  const notifiedEventIdsRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkUpcomingEvents = async () => {
      if (!activeAccountId) return;
      if (Notification.permission !== 'granted') return;

      try {
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

        const params = new URLSearchParams({
          accountId: activeAccountId,
          startDate: now.toISOString(),
          endDate: inOneHour.toISOString(),
          limit: '10',
        });

        const response = await fetch(`/api/calendar/events?${params}`);
        if (!response.ok) return;

        const data = await response.json();
        const events: CalendarEvent[] = data.events || [];

        for (const event of events) {
          // Skip if already notified
          if (notifiedEventIdsRef.current.has(event.id)) continue;

          const startTime = new Date(event.start_time);
          const reminderMinutes = event.reminder_minutes || 15;
          const reminderTime = new Date(startTime.getTime() - reminderMinutes * 60 * 1000);

          // Check if it's time to send reminder
          if (now >= reminderTime && now < startTime) {
            const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / (60 * 1000));

            new Notification('Upcoming Event', {
              body: `${event.subject || '(No title)'} starts in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`,
              icon: '/favicon.ico',
              tag: event.id,
            });

            notifiedEventIdsRef.current.add(event.id);
          }
        }

        // Clean up old notification IDs (events that have passed)
        const oldIds = Array.from(notifiedEventIdsRef.current).filter(id => {
          const event = events.find(e => e.id === id);
          if (!event) return true;
          return new Date(event.start_time) < now;
        });
        oldIds.forEach(id => notifiedEventIdsRef.current.delete(id));
      } catch (error) {
        console.error('Error checking calendar notifications:', error);
      }
    };

    // Check immediately and then every minute
    checkUpcomingEvents();
    checkIntervalRef.current = setInterval(checkUpcomingEvents, 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [activeAccountId]);
}
