"use client";

import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { EventDetailsModal } from "@/components/calendar/EventDetailsModal";
import { EventEditorModal } from "@/components/calendar/EventEditorModal";
import { useAccountStore } from "@/stores/account-store";
import { useCalendarAutoSync } from "@/hooks/useCalendarAutoSync";
import { useCalendarKeyboardShortcuts } from "@/hooks/useCalendarKeyboardShortcuts";
import { useCalendarUndo } from "@/hooks/useCalendarUndo";
import { useCalendarNotifications } from "@/hooks/useCalendarNotifications";

export default function CalendarPage() {
  const activeAccountId = useAccountStore((state) => state.activeAccountId);

  // Auto-sync calendar every 5 minutes
  useCalendarAutoSync(activeAccountId, 5 * 60 * 1000, true);

  // Enable keyboard shortcuts
  useCalendarKeyboardShortcuts(true);

  // Enable undo/redo
  useCalendarUndo();

  // Enable calendar notifications
  useCalendarNotifications();

  return (
    <div className="flex h-full flex-col bg-bg-secondary">
      <CalendarToolbar />
      <div className="flex-1 overflow-auto p-4">
        <CalendarGrid />
      </div>
      <EventDetailsModal />
      <EventEditorModal />
    </div>
  );
}
