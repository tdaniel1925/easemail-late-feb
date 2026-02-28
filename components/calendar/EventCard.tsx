"use client";

import { Video, MapPin, Users, Clock } from "lucide-react";
import { type CalendarEvent, useCalendarStore } from "@/stores/calendar-store";
import { format } from "date-fns";

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const { setViewedEvent } = useCalendarStore();
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(); // Call prop callback if provided
    setViewedEvent(event.id); // Open details modal
  };

  const getResponseStatusColor = () => {
    switch (event.response_status) {
      case 'accepted':
        return 'border-l-green-500';
      case 'tentativelyAccepted':
        return 'border-l-yellow-500';
      case 'declined':
        return 'border-l-red-500';
      case 'organizer':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-400';
    }
  };

  const getImportanceIndicator = () => {
    if (event.importance === 'high') {
      return <span className="text-red-500">!</span>;
    }
    return null;
  };

  if (compact) {
    // Compact view for calendar grid
    return (
      <div
        data-testid="calendar-event"
        onClick={handleClick}
        className={`cursor-pointer rounded border-l-2 bg-surface-secondary px-2 py-1 text-xs transition-colors hover:bg-surface-tertiary ${getResponseStatusColor()}`}
      >
        <div className="flex items-center gap-1">
          {getImportanceIndicator()}
          {event.is_online_meeting && <Video size={10} strokeWidth={1.5} />}
          <span className="flex-1 truncate font-medium text-text-primary">
            {event.subject || '(No Subject)'}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-text-tertiary">
          {format(startTime, "h:mm a")}
        </div>
      </div>
    );
  }

  // Full view for event details
  return (
    <div
      data-testid="calendar-event"
      onClick={handleClick}
      className={`cursor-pointer rounded-md border border-border-default bg-surface-secondary p-3 transition-colors hover:bg-surface-tertiary ${
        event.is_online_meeting ? 'border-l-4 border-l-blue-500' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-text-primary">
            {getImportanceIndicator()} {event.subject || '(No Subject)'}
          </h3>
          {event.organizer_name && (
            <p className="mt-1 text-xs text-text-secondary">
              Organized by {event.organizer_name}
            </p>
          )}
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            event.response_status === 'accepted'
              ? 'bg-green-500/10 text-green-600'
              : event.response_status === 'tentativelyAccepted'
              ? 'bg-yellow-500/10 text-yellow-600'
              : event.response_status === 'declined'
              ? 'bg-red-500/10 text-red-600'
              : 'bg-gray-500/10 text-gray-600'
          }`}
        >
          {event.response_status.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      </div>

      {/* Time */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
        <Clock size={12} strokeWidth={1.5} />
        <span>
          {event.is_all_day
            ? 'All day'
            : `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`}
        </span>
      </div>

      {/* Location */}
      {event.location && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <MapPin size={12} strokeWidth={1.5} />
          <span className="truncate">{event.location}</span>
        </div>
      )}

      {/* Online meeting */}
      {event.is_online_meeting && event.meeting_url && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <Video size={12} strokeWidth={1.5} className="text-blue-500" />
          <a
            href={event.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Join {event.meeting_provider || 'online meeting'}
          </a>
        </div>
      )}

      {/* Attendees count */}
      {event.attendees && event.attendees.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <Users size={12} strokeWidth={1.5} />
          <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
