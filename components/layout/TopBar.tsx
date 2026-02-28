"use client";

import { Bell, Menu, Moon, Sun, Search, PenSquare, Mail, Paperclip, CalendarPlus } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useAccountStore } from "@/stores/account-store";
import { useMailStore } from "@/stores/mail-store";
import { useSearchStore } from "@/stores/search-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { formatDistanceToNow } from "date-fns";

interface TopBarProps {
  onToggleSidebar: () => void;
  onCompose?: () => void;
  onSearch?: () => void;
}

export function TopBar({ onToggleSidebar, onCompose, onSearch }: TopBarProps) {
  const [isDark, setIsDark] = useState(false);
  const { activeAccountId } = useAccountStore();
  const { setViewedMessage } = useMailStore();
  const { openEditor } = useCalendarStore();
  const {
    isOpen: searchOpen,
    query,
    results,
    isSearching,
    selectedIndex,
    closeSearch,
    setQuery,
    setResults,
    setSearching,
    openSearch,
    nextResult,
    previousResult,
  } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Focus input when dropdown opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !activeAccountId) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        accountId: activeAccountId,
      });

      const response = await fetch(`/api/mail/search?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [activeAccountId, setResults, setSearching]);

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      nextResult();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      previousResult();
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  const handleSelectResult = (result: any) => {
    setViewedMessage(result.id);
    closeSearch();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!text || !query.trim()) return text || '';

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-text-primary">
          {part}
        </mark>
      ) : (
        part
      )
    );
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

      {/* Calendar quick-add button */}
      <button
        onClick={() => openEditor('create')}
        className="flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
        title="Schedule event"
      >
        <CalendarPlus size={14} strokeWidth={1.5} />
        <span>Event</span>
      </button>

      {/* Search dropdown */}
      <Popover.Root open={searchOpen} onOpenChange={(open) => open ? openSearch() : closeSearch()}>
        <Popover.Trigger asChild>
          <button
            className="ml-6 flex h-8 max-w-lg flex-1 cursor-pointer items-center gap-2 rounded-md border border-border-default bg-surface-tertiary px-3 transition-colors hover:bg-surface-hover"
            aria-label="Open search"
          >
            <Search size={14} className="text-text-tertiary" strokeWidth={1.5} />
            <span className="text-xs text-text-tertiary">Search emails...</span>
            <span className="ml-auto rounded border border-border-default bg-surface-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary">
              ⌘K
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[600px] rounded-lg border border-border-default bg-surface-primary shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
              <Search size={16} className="text-text-tertiary" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by sender, subject, or content..."
                className="flex-1 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <kbd className="rounded border border-border-default bg-surface-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {isSearching && (
                <div className="px-4 py-6 text-center">
                  <div className="text-sm text-text-secondary">Searching...</div>
                </div>
              )}

              {!isSearching && query && results.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Search size={24} className="mx-auto mb-2 text-text-tertiary" strokeWidth={1} />
                  <div className="text-sm text-text-secondary">No results found</div>
                  <div className="mt-1 text-xs text-text-tertiary">Try a different search term</div>
                </div>
              )}

              {!isSearching && !query && (
                <div className="px-4 py-6 text-center">
                  <Search size={24} className="mx-auto mb-2 text-text-tertiary" strokeWidth={1} />
                  <div className="text-sm text-text-secondary">Start typing to search emails</div>
                  <div className="mt-2 text-xs text-text-tertiary">
                    Search by sender, subject, or email content
                  </div>
                </div>
              )}

              {!isSearching && results.length > 0 && (
                <div className="py-1">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`flex w-full items-start gap-3 px-3 py-2 text-left transition-colors ${
                        index === selectedIndex
                          ? "bg-surface-selected"
                          : "hover:bg-surface-hover"
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        <Mail size={14} className="text-text-tertiary" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* Sender and Date */}
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-primary">
                              From:
                            </span>
                            <span className="truncate text-xs text-text-secondary">
                              {highlightMatch(result.from_name || result.from_address || "Unknown", query)}
                            </span>
                          </div>
                          {result.received_at && (
                            <div className="flex-shrink-0 text-[10px] text-text-tertiary">
                              {formatDistanceToNow(new Date(result.received_at), {
                                addSuffix: true,
                              })}
                            </div>
                          )}
                        </div>

                        {/* Subject */}
                        <div className="mt-0.5 truncate text-sm font-medium text-text-primary">
                          {highlightMatch(result.subject || "(No Subject)", query)}
                        </div>

                        {/* Preview */}
                        {result.preview && (
                          <div className="mt-0.5 truncate text-xs text-text-tertiary">
                            {highlightMatch(result.preview, query)}
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-text-tertiary">
                          {result.has_attachments && (
                            <div className="flex items-center gap-1">
                              <Paperclip size={10} strokeWidth={1.5} />
                              <span>Attachment</span>
                            </div>
                          )}
                          {!result.is_read && (
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                              <span>Unread</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results count */}
            {results.length > 0 && (
              <div className="border-t border-border-subtle px-3 py-2 text-center text-[10px] text-text-tertiary">
                Showing {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

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
