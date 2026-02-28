"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar, Clock, MapPin, Video, Users, Bell, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAccountStore } from "@/stores/account-store";

export function EventEditorModal() {
  const { editorMode, editingEventId, closeEditor, getEventById, setEvents, events } = useCalendarStore();
  const { activeAccountId } = useAccountStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isOnlineMeeting, setIsOnlineMeeting] = useState(false);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<Array<{ email: string; name?: string }>>([]);
  const [reminderMinutes, setReminderMinutes] = useState(15);

  const event = editingEventId ? getEventById(editingEventId) : null;
  const isOpen = !!editorMode;
  const isEditMode = editorMode === 'edit';

  // Load event data when editing
  useEffect(() => {
    if (isEditMode && event) {
      setSubject(event.subject || "");

      const startDateTime = new Date(event.start_time);
      const endDateTime = new Date(event.end_time);

      setStartDate(format(startDateTime, "yyyy-MM-dd"));
      setStartTime(format(startDateTime, "HH:mm"));
      setEndDate(format(endDateTime, "yyyy-MM-dd"));
      setEndTime(format(endDateTime, "HH:mm"));
      setIsAllDay(event.is_all_day || false);
      setLocation(event.location || "");
      setDescription(event.body_text || "");
      setIsOnlineMeeting(event.is_online_meeting || false);
      setReminderMinutes(event.reminder_minutes || 15);

      // Load attendees
      if (event.attendees && event.attendees.length > 0) {
        setAttendees(
          event.attendees.map((a: any) => ({
            email: a.email || a.emailAddress?.address,
            name: a.name || a.emailAddress?.name,
          }))
        );
      }
    } else if (editorMode === 'create') {
      // Reset form for new event
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

      // Check for pre-filled data from calendar sidebar
      const prefillSubject = sessionStorage.getItem('calendar_prefill_subject');
      const prefillAttendeesStr = sessionStorage.getItem('calendar_prefill_attendees');

      let prefillAttendees: string[] = [];
      if (prefillAttendeesStr) {
        try {
          prefillAttendees = JSON.parse(prefillAttendeesStr);
          sessionStorage.removeItem('calendar_prefill_attendees');
        } catch (e) {
          console.error('Failed to parse prefill attendees');
        }
      }

      if (prefillSubject) {
        sessionStorage.removeItem('calendar_prefill_subject');
      }

      setSubject(prefillSubject ? `Meeting: ${prefillSubject}` : "");
      setStartDate(format(now, "yyyy-MM-dd"));
      setStartTime(format(now, "HH:mm"));
      setEndDate(format(inOneHour, "yyyy-MM-dd"));
      setEndTime(format(inOneHour, "HH:mm"));
      setIsAllDay(false);
      setLocation("");
      setDescription("");
      setIsOnlineMeeting(false);
      setAttendees(prefillAttendees.map(email => ({ email })));
      setReminderMinutes(15);
    }
  }, [editorMode, event, isEditMode]);

  const handleClose = () => {
    closeEditor();
    setAttendeeInput("");
  };

  const handleAddAttendee = () => {
    const email = attendeeInput.trim();
    if (email && email.includes('@')) {
      setAttendees([...attendees, { email }]);
      setAttendeeInput("");
    }
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAccountId) {
      setError('No account selected');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Build start/end times
      const startDateTime = isAllDay
        ? `${startDate}T00:00:00Z`
        : `${startDate}T${startTime}:00Z`;
      const endDateTime = isAllDay
        ? `${endDate}T23:59:59Z`
        : `${endDate}T${endTime}:00Z`;

      const payload = {
        accountId: activeAccountId,
        subject,
        startTime: startDateTime,
        endTime: endDateTime,
        isAllDay,
        location: location || undefined,
        body: description || undefined,
        isOnlineMeeting,
        attendees: attendees.length > 0 ? attendees : undefined,
        reminderMinutes,
      };

      let response;

      if (isEditMode && event) {
        // Update existing event
        response = await fetch(`/api/calendar/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new event
        response = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save event');
      }

      const result = await response.json();

      // Update store
      if (isEditMode && event) {
        // Update event in store
        setEvents(events.map(e => e.id === event.id ? result.event : e));
      } else {
        // Add new event to store
        setEvents([...events, result.event]);
      }

      // Close modal
      handleClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      setError(`Failed to save event: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-surface-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default p-4">
            <Dialog.Title className="text-base font-semibold text-text-primary">
              {isEditMode ? 'Edit Event' : 'New Event'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
              </div>
            )}

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-text-secondary mb-1">
                Title *
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Event title"
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-2">
              <input
                id="allDay"
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
              />
              <label htmlFor="allDay" className="text-sm text-text-primary cursor-pointer">
                All day event
              </label>
            </div>

            {/* Start Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-text-secondary mb-1">
                  <Calendar size={12} className="inline mr-1" />
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              {!isAllDay && (
                <div>
                  <label htmlFor="startTime" className="block text-xs font-medium text-text-secondary mb-1">
                    <Clock size={12} className="inline mr-1" />
                    Start Time *
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
            </div>

            {/* End Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-text-secondary mb-1">
                  <Calendar size={12} className="inline mr-1" />
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              {!isAllDay && (
                <div>
                  <label htmlFor="endTime" className="block text-xs font-medium text-text-secondary mb-1">
                    <Clock size={12} className="inline mr-1" />
                    End Time *
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-xs font-medium text-text-secondary mb-1">
                <MapPin size={12} className="inline mr-1" />
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Add location"
              />
            </div>

            {/* Online Meeting Toggle */}
            <div className="flex items-center gap-2">
              <input
                id="onlineMeeting"
                type="checkbox"
                checked={isOnlineMeeting}
                onChange={(e) => setIsOnlineMeeting(e.target.checked)}
                className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
              />
              <label htmlFor="onlineMeeting" className="text-sm text-text-primary cursor-pointer">
                <Video size={14} className="inline mr-1" />
                Add Teams meeting
              </label>
            </div>

            {/* Attendees */}
            <div>
              <label htmlFor="attendees" className="block text-xs font-medium text-text-secondary mb-1">
                <Users size={12} className="inline mr-1" />
                Attendees
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="attendees"
                  type="email"
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  className="flex-1 rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Add attendee email"
                />
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="rounded-md bg-surface-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border-default"
                >
                  Add
                </button>
              </div>
              {attendees.length > 0 && (
                <div className="space-y-1">
                  {attendees.map((attendee, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md bg-surface-tertiary px-3 py-2"
                    >
                      <span className="text-sm text-text-primary">{attendee.email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index)}
                        className="text-text-tertiary transition-colors hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder */}
            <div>
              <label htmlFor="reminder" className="block text-xs font-medium text-text-secondary mb-1">
                <Bell size={12} className="inline mr-1" />
                Reminder
              </label>
              <select
                id="reminder"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="0">No reminder</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                placeholder="Add event description"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border-default p-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? 'Saving...' : (isEditMode ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
