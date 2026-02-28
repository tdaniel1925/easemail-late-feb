import { useEffect } from 'react';
import { useCalendarStore } from '@/stores/calendar-store';
import { useRouter } from 'next/navigation';

/**
 * Keyboard shortcuts for Calendar module
 *
 * Shortcuts:
 * - Cmd/Ctrl + N: New event (future: open event form)
 * - T: Go to today
 * - Left/Right arrows: Navigate previous/next (day/week/month)
 * - 1/2/3/4: Switch views (Day/Week/Month/Agenda)
 * - J: Join online meeting (if event is selected and has meeting URL)
 * - Escape: Clear selection
 * - j/k: Navigate up/down in events list
 * - Enter: View event details
 */
export function useCalendarKeyboardShortcuts(enabled: boolean = true) {
  const {
    events,
    viewedEventId,
    currentView,
    setViewedEvent,
    goToToday,
    navigateNext,
    navigatePrevious,
    setCurrentView,
    getViewedEvent,
  } = useCalendarStore();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

      // Shortcuts that only work when NOT in input fields
      if (isInputField) return;

      // New event
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // Future: Open event form modal
        console.log('[Keyboard Shortcut] New event - not yet implemented');
        return;
      }

      // Go to today
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        goToToday();
        return;
      }

      // Navigate previous/next
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrevious();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
        return;
      }

      // Switch views with number keys
      if (e.key === '1') {
        e.preventDefault();
        setCurrentView('day');
        return;
      }

      if (e.key === '2') {
        e.preventDefault();
        setCurrentView('week');
        return;
      }

      if (e.key === '3') {
        e.preventDefault();
        setCurrentView('month');
        return;
      }

      if (e.key === '4') {
        e.preventDefault();
        setCurrentView('agenda');
        return;
      }

      // Join online meeting
      if (e.key === 'j' || e.key === 'J') {
        const viewedEvent = getViewedEvent();
        if (viewedEvent?.is_online_meeting && viewedEvent?.meeting_url) {
          e.preventDefault();
          window.open(viewedEvent.meeting_url, '_blank');
          return;
        }
      }

      // Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        setViewedEvent(null);
        return;
      }

      // Navigate events with j/k (in agenda view or when events are listed)
      if (events.length > 0 && (currentView === 'agenda' || viewedEventId)) {
        const currentIndex = events.findIndex((e) => e.id === viewedEventId);

        if (e.key === 'j' && currentView === 'agenda') {
          e.preventDefault();
          // Go to next event
          if (currentIndex < events.length - 1) {
            setViewedEvent(events[currentIndex + 1].id);
          } else if (currentIndex === -1 && events.length > 0) {
            // No event selected, select first
            setViewedEvent(events[0].id);
          }
          return;
        }

        if (e.key === 'k' && currentView === 'agenda') {
          e.preventDefault();
          // Go to previous event
          if (currentIndex > 0) {
            setViewedEvent(events[currentIndex - 1].id);
          } else if (currentIndex === -1 && events.length > 0) {
            // No event selected, select last
            setViewedEvent(events[events.length - 1].id);
          }
          return;
        }

        // View event details with Enter
        if (e.key === 'Enter' && currentIndex !== -1) {
          e.preventDefault();
          // Event details already shown when viewedEventId is set
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    events,
    viewedEventId,
    currentView,
    setViewedEvent,
    goToToday,
    navigateNext,
    navigatePrevious,
    setCurrentView,
    getViewedEvent,
    router,
  ]);
}

// Export shortcut definitions for help modal
export const CALENDAR_KEYBOARD_SHORTCUTS = {
  General: [
    { key: 'Cmd/Ctrl + N', description: 'New event' },
    { key: 'T', description: 'Go to today' },
    { key: 'Escape', description: 'Clear selection' },
  ],
  Navigation: [
    { key: 'Left Arrow', description: 'Previous day/week/month' },
    { key: 'Right Arrow', description: 'Next day/week/month' },
    { key: 'j', description: 'Next event (in agenda view)' },
    { key: 'k', description: 'Previous event (in agenda view)' },
    { key: 'Enter', description: 'View event details' },
  ],
  Views: [
    { key: '1', description: 'Switch to Day view' },
    { key: '2', description: 'Switch to Week view' },
    { key: '3', description: 'Switch to Month view' },
    { key: '4', description: 'Switch to Agenda view' },
  ],
  Actions: [
    { key: 'J', description: 'Join online meeting (if available)' },
  ],
};
