"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Composer, SearchModal } from "@/components/mail";
import { Toaster } from "@/components/ui/Toaster";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { useComposerStore } from "@/stores/composer-store";
import { useSearchStore } from "@/stores/search-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useInitializeApp } from "@/hooks/useInitializeApp";
import { useHydrated } from "@/hooks/useHydrated";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hydrated = useHydrated();
  const { isOpen, closeComposer, openComposer } = useComposerStore();
  const { openSearch } = useSearchStore();

  // Initialize app settings
  useInitializeApp();

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  if (!hydrated) {
    // Return a loading skeleton during SSR/hydration to prevent mismatch
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-surface-primary">
        <div className="w-60 border-r border-border-default bg-surface-secondary" />
        <div className="flex flex-1 flex-col">
          <div className="h-14 border-b border-border-default bg-surface-primary" />
          <div className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-primary">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCompose={() => openComposer("new")}
          onSearch={openSearch}
        />

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Modals */}
      <Composer open={isOpen} onClose={closeComposer} />
      <SearchModal />
      <KeyboardShortcuts />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
