"use client";

import { useEffect, useRef, useCallback } from "react";
import { Search, Mail, Folder, User, Clock } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchStore } from "@/stores/search-store";
import { useAccountStore } from "@/stores/account-store";
import { useMailStore } from "@/stores/mail-store";
import { formatDistanceToNow } from "date-fns";

export function SearchModal() {
  const {
    isOpen,
    query,
    results,
    isSearching,
    selectedIndex,
    closeSearch,
    setQuery,
    setResults,
    setSearching,
    nextResult,
    previousResult,
  } = useSearchStore();

  const { activeAccountId } = useAccountStore();
  const { setViewedMessage } = useMailStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
    if (result.type === "message") {
      setViewedMessage(result.id);
      closeSearch();
    }
    // TODO: Handle other result types (contacts, folders)
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

  const getResultIcon = (type: string) => {
    switch (type) {
      case "message":
        return <Mail size={16} className="text-text-tertiary" strokeWidth={1.5} />;
      case "contact":
        return <User size={16} className="text-text-tertiary" strokeWidth={1.5} />;
      case "folder":
        return <Folder size={16} className="text-text-tertiary" strokeWidth={1.5} />;
      default:
        return <Search size={16} className="text-text-tertiary" strokeWidth={1.5} />;
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeSearch()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-lg border border-border-default bg-surface-primary shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
            <Search size={18} className="text-text-tertiary" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search emails, contacts, folders..."
              className="flex-1 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <kbd className="rounded border border-border-default bg-surface-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="px-4 py-8 text-center">
                <div className="text-sm text-text-secondary">Searching...</div>
              </div>
            )}

            {!isSearching && query && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Search size={32} className="mx-auto mb-2 text-text-tertiary" strokeWidth={1} />
                <div className="text-sm text-text-secondary">No results found</div>
                <div className="mt-1 text-xs text-text-tertiary">Try a different search term</div>
              </div>
            )}

            {!isSearching && !query && (
              <div className="px-4 py-8 text-center">
                <Search size={32} className="mx-auto mb-2 text-text-tertiary" strokeWidth={1} />
                <div className="text-sm text-text-secondary">Start typing to search</div>
                <div className="mt-2 flex justify-center gap-2">
                  <kbd className="rounded border border-border-default bg-surface-secondary px-2 py-1 text-[10px] text-text-tertiary">
                    ↑ ↓
                  </kbd>
                  <span className="text-xs text-text-tertiary">to navigate</span>
                  <kbd className="rounded border border-border-default bg-surface-secondary px-2 py-1 text-[10px] text-text-tertiary">
                    ↵
                  </kbd>
                  <span className="text-xs text-text-tertiary">to select</span>
                </div>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className={`flex w-full items-start gap-3 px-4 py-2 text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-surface-selected"
                        : "hover:bg-surface-hover"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{getResultIcon(result.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-sm font-medium text-text-primary">
                          {highlightMatch(result.title, query)}
                        </div>
                        {result.received_at && (
                          <div className="flex-shrink-0 text-xs text-text-tertiary">
                            {formatDistanceToNow(new Date(result.received_at), {
                              addSuffix: true,
                            })}
                          </div>
                        )}
                      </div>
                      {result.subtitle && (
                        <div className="mt-0.5 truncate text-xs text-text-secondary">
                          {highlightMatch(result.subtitle, query)}
                        </div>
                      )}
                      {result.preview && (
                        <div className="mt-1 truncate text-xs text-text-tertiary">
                          {highlightMatch(result.preview, query)}
                        </div>
                      )}
                      {result.folder_name && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-text-tertiary">
                          <Folder size={10} strokeWidth={1.5} />
                          <span>{result.folder_name}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
