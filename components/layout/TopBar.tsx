"use client";

import { Bell, Menu, Moon, Sun, Search, PenSquare } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  onToggleSidebar: () => void;
  onCompose?: () => void;
  onSearch?: () => void;
}

export function TopBar({ onToggleSidebar, onCompose, onSearch }: TopBarProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-border-default bg-surface-secondary px-4">
      {/* Menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="rounded-md p-1.5 transition-colors hover:bg-surface-tertiary"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} className="text-text-secondary" strokeWidth={1.5} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-hover">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary">EaseMail</span>
      </div>

      {/* Compose button */}
      {onCompose && (
        <button
          onClick={onCompose}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <PenSquare size={14} strokeWidth={1.5} />
          <span>Compose</span>
        </button>
      )}

      {/* Search bar */}
      <button
        onClick={onSearch}
        className="ml-6 flex h-8 max-w-lg flex-1 cursor-pointer items-center gap-2 rounded-md border border-border-default bg-surface-tertiary px-3 transition-colors hover:bg-surface-hover"
        aria-label="Open search"
      >
        <Search size={14} className="text-text-tertiary" strokeWidth={1.5} />
        <span className="text-xs text-text-tertiary">Search emails, contacts, commands...</span>
        <span className="ml-auto rounded border border-border-default bg-surface-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary">
          ⌘K
        </span>
      </button>

      {/* Right side controls */}
      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 transition-colors hover:bg-surface-tertiary"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun size={16} className="text-text-secondary" strokeWidth={1.5} />
          ) : (
            <Moon size={16} className="text-text-secondary" strokeWidth={1.5} />
          )}
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-1.5 transition-colors hover:bg-surface-tertiary" aria-label="Notifications">
          <Bell size={16} className="text-text-secondary" strokeWidth={1.5} />
          <div className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-surface-secondary bg-accent" />
        </button>

        {/* User avatar */}
        <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent">
          <span className="text-[11px] font-semibold text-white">D</span>
        </div>
      </div>
    </header>
  );
}
