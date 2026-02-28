"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Composer } from "@/components/mail";
import { EventEditorModal } from "@/components/calendar/EventEditorModal";
import { Toaster } from "@/components/ui/Toaster";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { useComposerStore } from "@/stores/composer-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useInitializeApp } from "@/hooks/useInitializeApp";
import { useHydrated } from "@/hooks/useHydrated";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOpen, closeComposer, openComposer } = useComposerStore();
  const { editorMode, closeEditor } = useCalendarStore();

  // Initialize app settings
  useInitializeApp();

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-primary">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar - search is now integrated inside TopBar */}
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCompose={() => openComposer("new")}
        />

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Modals */}
      <Composer open={isOpen} onClose={closeComposer} />
      <EventEditorModal open={editorMode !== null} onClose={closeEditor} />
      <KeyboardShortcuts />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
