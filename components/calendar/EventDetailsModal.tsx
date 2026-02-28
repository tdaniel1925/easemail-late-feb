"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {  X, Calendar, Clock, MapPin, Video, Users, Repeat, Bell, Tag, Trash2, Edit3 } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { useCalendarStore } from "@/stores/calendar-store";

export function EventDetailsModal() {
  const { viewedEventId, setViewedEvent, getViewedEvent, openEditor, updateEvent, events, setEvents } = useCalendarStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const event = getViewedEvent();
  const isOpen = !!viewedEventId && !!event;

  const handleClose = () => {
    setViewedEvent(null);
  };

  const handleEdit = () => {
    setViewedEvent(null);
    openEditor('edit', event?.id);
  };

  const handleDelete = async () => {
    if (!event) return;

    if (!confirm(`Delete "${event.subject || '(No Subject)'}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Remove event from store
      setEvents(events.filter(e => e.id !== event.id));

      // Close modal
      setViewedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRespond = async (response: 'accepted' | 'tentativelyAccepted' | 'declined') => {
    if (!event) return;

    setIsResponding(true);
    try {
      const res = await fetch(`/api/calendar/events/${event.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        throw new Error('Failed to respond to event');
      }

      // Update event in store
      updateEvent(event.id, { response_status: response as any });
    } catch (error) {
      console.error('Error responding to event:', error);
      setError('Failed to respond. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  if (!event) return null;

  // Format dates
  const startDate = parseISO(event.start_time);
  const endDate = parseISO(event.end_time);
  const durationMinutes = differenceInMinutes(endDate, startDate);
  const durationText = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)} hour${Math.floor(durationMinutes / 60) > 1 ? 's' : ''}`
    : `${durationMinutes} minutes`;

  const isOrganizer = event.response_status === 'organizer';
  const canRespond = !isOrganizer && event.attendees && event.attendees.length > 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content data-testid="event-details" className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-surface-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border-default p-4">
            <div className="flex-1">
              <Dialog.Title data-testid="event-subject" className="text-base font-semibold text-text-primary">
                {event.subject || '(No Subject)'}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
              </div>
            )}

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-sm text-text-primary font-medium">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </p>
                {event.is_all_day ? (
                  <p className="text-xs text-text-secondary mt-1">All day</p>
                ) : (
                  <p className="text-xs text-text-secondary mt-1">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} ({durationText})
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <p className="text-sm text-text-secondary">{event.location}</p>
              </div>
            )}

            {/* Online Meeting */}
            {event.is_online_meeting && event.meeting_url && (
              <div className="flex items-start gap-3">
                <Video size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <a
                  data-testid="meeting-link"
                  href={event.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Join Online Meeting
                </a>
              </div>
            )}

            {/* Organizer */}
            {event.organizer_email && (
              <div className="flex items-start gap-3">
                <Users size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Organizer</p>
                  <p className="text-sm text-text-primary">
                    {event.organizer_name || event.organizer_email}
                  </p>
                </div>
              </div>
            )}

            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-start gap-3">
                <Users size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary mb-2">
                    Attendees ({event.attendees.length})
                  </p>
                  <div className="space-y-1">
                    {event.attendees.slice(0, 5).map((attendee: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-text-secondary">
                          {attendee.status?.response === 'accepted' && '✓'}
                          {attendee.status?.response === 'tentativelyAccepted' && '?'}
                          {attendee.status?.response === 'declined' && '✗'}
                          {!attendee.status?.response && '-'}
                        </span>
                        <span className="text-text-primary">
                          {attendee.emailAddress?.name || attendee.emailAddress?.address}
                        </span>
                      </div>
                    ))}
                    {event.attendees.length > 5 && (
                      <p className="text-xs text-text-tertiary">
                        +{event.attendees.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.body_text && (
              <div className="pt-4 border-t border-border-subtle">
                <p className="text-xs text-text-tertiary mb-2">Description</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {event.body_text}
                </p>
              </div>
            )}

            {/* Recurrence */}
            {event.is_recurring && (
              <div className="flex items-start gap-3">
                <Repeat size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Repeats</p>
                  <p className="text-sm text-text-secondary">
                    {/* TODO: Parse and format recurrence pattern */}
                    Recurring event
                  </p>
                </div>
              </div>
            )}

            {/* Reminder */}
            {event.reminder_minutes != null && event.reminder_minutes > 0 && (
              <div className="flex items-start gap-3">
                <Bell size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Reminder</p>
                  <p className="text-sm text-text-secondary">
                    {event.reminder_minutes} minutes before
                  </p>
                </div>
              </div>
            )}

            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag size={16} className="mt-0.5 text-text-tertiary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary mb-1">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {event.categories.map((category: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md bg-surface-tertiary px-2 py-1 text-xs text-text-secondary"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border-default p-4 gap-3">
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
              >
                <Edit3 size={14} strokeWidth={1.5} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>

            {canRespond && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond('accepted')}
                  disabled={isResponding}
                  className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => handleRespond('tentativelyAccepted')}
                  disabled={isResponding}
                  className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
                >
                  ? Tentative
                </button>
                <button
                  onClick={() => handleRespond('declined')}
                  disabled={isResponding}
                  className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  ✗ Decline
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
