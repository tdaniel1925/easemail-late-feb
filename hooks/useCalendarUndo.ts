import { useEffect, useCallback } from 'react';
import { useCalendarStore, CalendarEvent } from '@/stores/calendar-store';
import { UndoQueue } from '@/lib/undo-queue';
import { useToastStore } from '@/stores/toast-store';

const calendarUndoQueue = new UndoQueue(50, 5 * 60 * 1000);

/**
 * Undo hook for Calendar module
 *
 * Provides undo/redo functionality for:
 * - Event edits
 * - Event deletions
 * - Event creation
 * - Response status changes
 */
export function useCalendarUndo() {
  const { updateEvent, setEvents, events } = useCalendarStore();
  const { addToast } = useToastStore();

  /**
   * Track event edit for undo
   */
  const trackEventEdit = useCallback(
    (eventId: string, oldData: Partial<CalendarEvent>, newData: Partial<CalendarEvent>) => {
      calendarUndoQueue.push({
        type: 'event-edit',
        description: `Edit event`,
        data: { eventId, oldData, newData },
        undo: ({ eventId, oldData }: { eventId: string; oldData: Partial<CalendarEvent> }) => {
          updateEvent(eventId, oldData);
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: 'Event edit undone',
          });
        },
        redo: ({ eventId, newData }: { eventId: string; newData: Partial<CalendarEvent> }) => {
          updateEvent(eventId, newData);
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: 'Event edit redone',
          });
        },
      });
    },
    [updateEvent, addToast]
  );

  /**
   * Track event deletion for undo
   */
  const trackEventDeletion = useCallback(
    (deletedEvents: CalendarEvent[]) => {
      calendarUndoQueue.push({
        type: 'event-delete',
        description: `Delete ${deletedEvents.length} event(s)`,
        data: { deletedEvents, currentEvents: [...events] },
        undo: ({ deletedEvents }: { deletedEvents: CalendarEvent[] }) => {
          // Re-add deleted events
          setEvents([...events, ...deletedEvents]);
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: `Restored ${deletedEvents.length} event(s)`,
          });
        },
        redo: ({ deletedEvents }: { deletedEvents: CalendarEvent[] }) => {
          // Remove events again
          const deletedIds = new Set(deletedEvents.map((e) => e.id));
          setEvents(events.filter((e) => !deletedIds.has(e.id)));
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: `Deleted ${deletedEvents.length} event(s)`,
          });
        },
      });
    },
    [setEvents, events, addToast]
  );

  /**
   * Track event creation for undo
   */
  const trackEventCreation = useCallback(
    (newEvent: CalendarEvent) => {
      calendarUndoQueue.push({
        type: 'event-create',
        description: `Create event: ${newEvent.subject}`,
        data: { newEvent, currentEvents: [...events] },
        undo: ({ newEvent }: { newEvent: CalendarEvent }) => {
          // Remove the created event
          setEvents(events.filter((e) => e.id !== newEvent.id));
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: 'Event creation undone',
          });
        },
        redo: ({ newEvent }: { newEvent: CalendarEvent }) => {
          // Re-add the event
          setEvents([...events, newEvent]);
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: 'Event creation redone',
          });
        },
      });
    },
    [setEvents, events, addToast]
  );

  /**
   * Track response status change for undo
   */
  const trackResponseStatusChange = useCallback(
    (
      eventId: string,
      oldStatus: CalendarEvent['response_status'],
      newStatus: CalendarEvent['response_status']
    ) => {
      calendarUndoQueue.push({
        type: 'event-response',
        description: `Change response to ${newStatus}`,
        data: { eventId, oldStatus, newStatus },
        undo: ({
          eventId,
          oldStatus,
        }: {
          eventId: string;
          oldStatus: CalendarEvent['response_status'];
        }) => {
          updateEvent(eventId, { response_status: oldStatus });
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: 'Response status change undone',
          });
        },
        redo: ({
          eventId,
          newStatus,
        }: {
          eventId: string;
          newStatus: CalendarEvent['response_status'];
        }) => {
          updateEvent(eventId, { response_status: newStatus });
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: 'Response status change redone',
          });
        },
      });
    },
    [updateEvent, addToast]
  );

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    const success = await calendarUndoQueue.undo();
    if (!success) {
      addToast({
        id: `undo-error-${Date.now()}`,
        type: 'error',
        message: 'Nothing to undo',
      });
    }
  }, [addToast]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async () => {
    const success = await calendarUndoQueue.redo();
    if (!success) {
      addToast({
        id: `redo-error-${Date.now()}`,
        type: 'error',
        message: 'Nothing to redo',
      });
    }
  }, [addToast]);

  /**
   * Keyboard shortcuts for undo/redo
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: calendarUndoQueue.canUndo(),
    canRedo: calendarUndoQueue.canRedo(),
    undoDescription: calendarUndoQueue.getUndoDescription(),
    redoDescription: calendarUndoQueue.getRedoDescription(),
    trackEventEdit,
    trackEventDeletion,
    trackEventCreation,
    trackResponseStatusChange,
  };
}
