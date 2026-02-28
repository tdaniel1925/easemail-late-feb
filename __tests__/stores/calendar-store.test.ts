import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from '@/stores/calendar-store';

describe('CalendarStore', () => {
  beforeEach(() => {
    const { setEvents, clearEventSelection, clearFilters } = useCalendarStore.getState();
    setEvents([]);
    clearEventSelection();
    clearFilters();
  });

  it('should set events', () => {
    const { setEvents } = useCalendarStore.getState();

    const mockEvents = [
      {
        id: '1',
        account_id: 'acc1',
        graph_id: 'graph1',
        subject: 'Team Meeting',
        body_html: '<p>Discussion points</p>',
        body_text: 'Discussion points',
        location: 'Conference Room A',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
        is_all_day: false,
        is_recurring: false,
        recurrence_pattern: null,
        is_online_meeting: true,
        meeting_url: 'https://teams.microsoft.com/meeting',
        meeting_provider: 'Teams',
        organizer_name: 'John Doe',
        organizer_email: 'john@example.com',
        attendees: [],
        status: 'confirmed' as const,
        response_status: 'accepted' as const,
        reminder_minutes: 15,
        categories: [],
        importance: 'normal' as const,
        sensitivity: 'normal' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    setEvents(mockEvents);
    expect(useCalendarStore.getState().events).toEqual(mockEvents);
  });

  it('should navigate calendar dates', () => {
    const { goToToday, navigateNext, navigatePrevious, setCurrentView } = useCalendarStore.getState();

    setCurrentView('month');
    goToToday();

    const todayDate = new Date();
    const currentDate = useCalendarStore.getState().currentDate;

    expect(currentDate.getDate()).toBe(todayDate.getDate());
    expect(currentDate.getMonth()).toBe(todayDate.getMonth());
  });

  it('should change calendar view', () => {
    const { setCurrentView } = useCalendarStore.getState();

    setCurrentView('week');
    expect(useCalendarStore.getState().currentView).toBe('week');

    setCurrentView('day');
    expect(useCalendarStore.getState().currentView).toBe('day');

    setCurrentView('agenda');
    expect(useCalendarStore.getState().currentView).toBe('agenda');
  });

  it('should filter by response status', () => {
    const { setResponseStatusFilter } = useCalendarStore.getState();

    setResponseStatusFilter('accepted');
    expect(useCalendarStore.getState().responseStatusFilter).toBe('accepted');

    setResponseStatusFilter(null);
    expect(useCalendarStore.getState().responseStatusFilter).toBe(null);
  });

  it('should filter by online meeting', () => {
    const { setIsOnlineMeetingFilter } = useCalendarStore.getState();

    setIsOnlineMeetingFilter(true);
    expect(useCalendarStore.getState().isOnlineMeetingFilter).toBe(true);

    setIsOnlineMeetingFilter(null);
    expect(useCalendarStore.getState().isOnlineMeetingFilter).toBe(null);
  });
});
