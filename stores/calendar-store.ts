import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CalendarEvent {
  id: string;
  account_id: string;
  graph_id: string;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean | null;
  is_recurring: boolean | null;
  recurrence_pattern: any | null;
  is_online_meeting: boolean | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  attendees: any[];
  status: 'tentative' | 'confirmed' | 'cancelled';
  response_status: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
  reminder_minutes: number | null;
  categories: string[];
  importance: 'low' | 'normal' | 'high';
  sensitivity: 'normal' | 'personal' | 'private' | 'confidential';
  created_at: string | null;
  updated_at: string | null;
}

type CalendarView = 'month' | 'week' | 'day' | 'agenda';

interface CalendarState {
  // Events
  events: CalendarEvent[];
  selectedEventIds: Set<string>;
  viewedEventId: string | null;
  isLoadingEvents: boolean;
  eventsError: string | null;
  eventPage: number;
  eventTotal: number;
  hasMoreEvents: boolean;

  // Event Editor
  editorMode: 'create' | 'edit' | null;
  editingEventId: string | null;

  // Calendar view
  currentView: CalendarView;
  currentDate: Date;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;

  // Filters
  responseStatusFilter: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded' | null;
  isOnlineMeetingFilter: boolean | null;

  // Sync status
  isSyncing: boolean;
  lastSyncAt: string | null;

  // Event Actions
  setEvents: (events: CalendarEvent[]) => void;
  appendEvents: (events: CalendarEvent[]) => void;
  toggleEventSelection: (eventId: string) => void;
  selectEvent: (eventId: string) => void;
  selectAllEvents: () => void;
  clearEventSelection: () => void;
  setViewedEvent: (eventId: string | null) => void;
  setLoadingEvents: (isLoading: boolean) => void;
  setEventsError: (error: string | null) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  setEventPage: (page: number) => void;
  setEventTotal: (total: number) => void;
  setHasMoreEvents: (hasMore: boolean) => void;

  // Editor Actions
  openEditor: (mode: 'create' | 'edit', eventId?: string) => void;
  closeEditor: () => void;

  // Calendar view actions
  setCurrentView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setDateRange: (start: string, end: string) => void;
  goToToday: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;

  // Filter Actions
  setResponseStatusFilter: (status: CalendarEvent['response_status'] | null) => void;
  setIsOnlineMeetingFilter: (isOnline: boolean | null) => void;
  clearFilters: () => void;

  // Sync Actions
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (timestamp: string | null) => void;

  // Event Getters
  getSelectedEvents: () => CalendarEvent[];
  getEventById: (eventId: string) => CalendarEvent | null;
  getViewedEvent: () => CalendarEvent | null;
  getEventsForDate: (date: Date) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Events state
      events: [],
      selectedEventIds: new Set(),
      viewedEventId: null,
      isLoadingEvents: false,
      eventsError: null,
      eventPage: 1,
      eventTotal: 0,
      hasMoreEvents: false,

      // Editor state
      editorMode: null,
      editingEventId: null,

      // Calendar view state
      currentView: 'month',
      currentDate: new Date(),
      dateRangeStart: null,
      dateRangeEnd: null,

      // Filters state
      responseStatusFilter: null,
      isOnlineMeetingFilter: null,

      // Sync state
      isSyncing: false,
      lastSyncAt: null,

      // Event actions
      setEvents: (events) => set({ events }),

      appendEvents: (events) =>
        set((state) => ({
          events: [...state.events, ...events],
        })),

      toggleEventSelection: (eventId) =>
        set((state) => {
          const newSelected = new Set(state.selectedEventIds);
          if (newSelected.has(eventId)) {
            newSelected.delete(eventId);
          } else {
            newSelected.add(eventId);
          }
          return { selectedEventIds: newSelected };
        }),

      selectEvent: (eventId) =>
        set({ selectedEventIds: new Set([eventId]) }),

      selectAllEvents: () =>
        set((state) => ({
          selectedEventIds: new Set(state.events.map((e) => e.id)),
        })),

      clearEventSelection: () => set({ selectedEventIds: new Set() }),

      setViewedEvent: (eventId) => set({ viewedEventId: eventId }),

      setLoadingEvents: (isLoading) => set({ isLoadingEvents: isLoading }),

      setEventsError: (error) => set({ eventsError: error }),

      updateEvent: (eventId, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId ? { ...event, ...updates } : event
          ),
        })),

      setEventPage: (page) => set({ eventPage: page }),

      setEventTotal: (total) => set({ eventTotal: total }),

      setHasMoreEvents: (hasMore) => set({ hasMoreEvents: hasMore }),

      // Editor actions
      openEditor: (mode, eventId) =>
        set({
          editorMode: mode,
          editingEventId: eventId || null,
        }),

      closeEditor: () =>
        set({
          editorMode: null,
          editingEventId: null,
        }),

      // Calendar view actions
      setCurrentView: (view) => set({ currentView: view }),

      setCurrentDate: (date) => set({ currentDate: date }),

      setDateRange: (start, end) =>
        set({ dateRangeStart: start, dateRangeEnd: end }),

      goToToday: () => set({ currentDate: new Date() }),

      navigateNext: () =>
        set((state) => {
          const newDate = new Date(state.currentDate);
          switch (state.currentView) {
            case 'day':
              newDate.setDate(newDate.getDate() + 1);
              break;
            case 'week':
              newDate.setDate(newDate.getDate() + 7);
              break;
            case 'month':
              newDate.setMonth(newDate.getMonth() + 1);
              break;
            case 'agenda':
              newDate.setMonth(newDate.getMonth() + 1);
              break;
          }
          return { currentDate: newDate };
        }),

      navigatePrevious: () =>
        set((state) => {
          const newDate = new Date(state.currentDate);
          switch (state.currentView) {
            case 'day':
              newDate.setDate(newDate.getDate() - 1);
              break;
            case 'week':
              newDate.setDate(newDate.getDate() - 7);
              break;
            case 'month':
              newDate.setMonth(newDate.getMonth() - 1);
              break;
            case 'agenda':
              newDate.setMonth(newDate.getMonth() - 1);
              break;
          }
          return { currentDate: newDate };
        }),

      // Filter actions
      setResponseStatusFilter: (status) =>
        set({ responseStatusFilter: status }),

      setIsOnlineMeetingFilter: (isOnline) =>
        set({ isOnlineMeetingFilter: isOnline }),

      clearFilters: () =>
        set({
          responseStatusFilter: null,
          isOnlineMeetingFilter: null,
        }),

      // Sync actions
      setSyncing: (isSyncing) => set({ isSyncing }),

      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

      // Event getters
      getSelectedEvents: () => {
        const { events, selectedEventIds } = get();
        return events.filter((event) => selectedEventIds.has(event.id));
      },

      getEventById: (eventId) => {
        const { events } = get();
        return events.find((event) => event.id === eventId) || null;
      },

      getViewedEvent: () => {
        const { events, viewedEventId } = get();
        return events.find((event) => event.id === viewedEventId) || null;
      },

      getEventsForDate: (date) => {
        const { events } = get();
        const dateStr = date.toISOString().split('T')[0];
        return events.filter((event) => {
          const eventDateStr = event.start_time.split('T')[0];
          return eventDateStr === dateStr;
        });
      },
    }),
    {
      name: 'calendar-store',
      partialize: (state) => ({
        currentView: state.currentView,
        responseStatusFilter: state.responseStatusFilter,
        isOnlineMeetingFilter: state.isOnlineMeetingFilter,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
