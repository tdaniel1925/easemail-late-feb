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

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOpen, closeComposer, openComposer } = useComposerStore();
  const { openSearch } = useSearchStore();

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
