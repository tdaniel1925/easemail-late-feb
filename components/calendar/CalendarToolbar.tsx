"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Plus, RefreshCw, Video, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAccountStore } from "@/stores/account-store";
import { useCalendarAutoSync } from "@/hooks/useCalendarAutoSync";
import { format } from "date-fns";

export function CalendarToolbar() {
  const {
    currentView,
    currentDate,
    responseStatusFilter,
    isOnlineMeetingFilter,
    isSyncing,
    setCurrentView,
    goToToday,
    navigateNext,
    navigatePrevious,
    openEditor,
    setResponseStatusFilter,
    setIsOnlineMeetingFilter,
  } = useCalendarStore();

  const { activeAccountId } = useAccountStore();
  const { triggerSync } = useCalendarAutoSync(activeAccountId, 5 * 60 * 1000, true);
  const [showResponseFilter, setShowResponseFilter] = useState(false);

  const getDateRangeText = () => {
    switch (currentView) {
      case 'day':
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case 'week':
        return format(currentDate, "MMMM yyyy");
      case 'month':
        return format(currentDate, "MMMM yyyy");
      case 'agenda':
        return format(currentDate, "MMMM yyyy");
      default:
        return '';
    }
  };

  const handleSync = () => {
    triggerSync();
  };

  const handleToggleOnlineMeetings = () => {
    setIsOnlineMeetingFilter(isOnlineMeetingFilter === true ? null : true);
  };

  const handleResponseStatusSelect = (status: typeof responseStatusFilter) => {
    setResponseStatusFilter(status);
    setShowResponseFilter(false);
  };

  const responseOptions = [
    { value: null, label: 'All Responses' },
    { value: 'accepted' as const, label: 'Accepted' },
    { value: 'tentativelyAccepted' as const, label: 'Tentative' },
    { value: 'declined' as const, label: 'Declined' },
    { value: 'notResponded' as const, label: 'Not Responded' },
    { value: 'organizer' as const, label: 'Organizer' },
  ];

  return (
    <div className="flex items-center justify-between border-b border-border-default bg-surface-primary px-4 py-2">
      {/* Left: View switcher */}
      <div className="flex items-center gap-1">
        <button
          data-testid="view-month"
          onClick={() => setCurrentView('month')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentView === 'month'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
          }`}
        >
          Month
        </button>
        <button
          data-testid="view-week"
          onClick={() => setCurrentView('week')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentView === 'week'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
          }`}
        >
          Week
        </button>
        <button
          data-testid="view-day"
          onClick={() => setCurrentView('day')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentView === 'day'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
          }`}
        >
          Day
        </button>
        <button
          data-testid="view-agenda"
          onClick={() => setCurrentView('agenda')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentView === 'agenda'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
          }`}
        >
          Agenda
        </button>
      </div>

      {/* Center: Navigation */}
      <div className="flex items-center gap-2">
        <button
          data-testid="calendar-prev"
          onClick={navigatePrevious}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Previous"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>

        <button
          data-testid="go-to-today"
          onClick={goToToday}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
        >
          Today
        </button>

        <button
          data-testid="calendar-next"
          onClick={navigateNext}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          title="Next"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>

        <span data-testid="current-month" className="ml-2 text-sm font-medium text-text-primary">
          {getDateRangeText()}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Online meetings filter */}
        <button
          data-testid="filter-online-meetings"
          onClick={handleToggleOnlineMeetings}
          className={cn(
            "h-8 px-3 text-xs rounded flex items-center gap-2",
            "border border-border-default bg-bg-secondary",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "transition-colors",
            isOnlineMeetingFilter === true && "border-accent text-accent bg-accent/10"
          )}
          title="Filter online meetings"
        >
          <Video className="h-3.5 w-3.5" />
          Online Only
        </button>

        {/* Response status filter */}
        <div className="relative">
          <button
            data-testid="response-status-filter"
            onClick={() => setShowResponseFilter(!showResponseFilter)}
            className={cn(
              "h-8 px-3 text-xs rounded flex items-center gap-2",
              "border border-border-default bg-bg-secondary",
              "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
              "transition-colors",
              responseStatusFilter && "border-accent text-accent"
            )}
          >
            {responseOptions.find(opt => opt.value === responseStatusFilter)?.label || 'All Responses'}
          </button>

          {showResponseFilter && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowResponseFilter(false)}
              />

              {/* Dropdown */}
              <div className="absolute top-full mt-1 right-0 w-48 bg-surface-primary border border-border-default rounded shadow-lg z-50">
                {responseOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleResponseStatusSelect(option.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-bg-hover flex items-center justify-between",
                      responseStatusFilter === option.value && "bg-bg-selected"
                    )}
                    role="option"
                  >
                    {option.label}
                    {responseStatusFilter === option.value && (
                      <Check className="h-4 w-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sync button */}
        <button
          data-testid="sync-calendar"
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            "h-8 w-8 rounded flex items-center justify-center",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          title="Sync Calendar"
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border-default mx-1" />

        {/* New Event button */}
        <button
          onClick={() => openEditor('create')}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} strokeWidth={2} />
          New Event
        </button>
      </div>
    </div>
  );
}
