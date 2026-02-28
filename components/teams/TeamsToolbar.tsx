"use client";

import { useState } from "react";
import { RefreshCw, Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamsStore } from "@/stores/teams-store";
import { useAccountStore } from "@/stores/account-store";
import { useTeamsAutoSync } from "@/hooks/useTeamsAutoSync";

type MessageType = 'all' | 'important' | 'mentions' | 'unread';

export function TeamsToolbar() {
  const { isSyncing, messageTypeFilter, setMessageTypeFilter } = useTeamsStore();
  const { activeAccountId } = useAccountStore();
  const { triggerSync } = useTeamsAutoSync(activeAccountId, 5 * 60 * 1000, true);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const handleSync = () => {
    triggerSync();
  };

  const handleFilterSelect = (type: MessageType) => {
    setMessageTypeFilter(type);
    setShowFilterDropdown(false);
  };

  const filterOptions: { value: MessageType; label: string }[] = [
    { value: 'all', label: 'All Messages' },
    { value: 'important', label: 'Important' },
    { value: 'mentions', label: 'Mentions' },
    { value: 'unread', label: 'Unread' },
  ];

  return (
    <div className="h-[52px] border-b border-border-default bg-surface-primary px-4 flex items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-text-primary">Teams</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Message type filter */}
        <div className="relative">
          <button
            data-testid="message-type-filter"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={cn(
              "h-8 px-3 text-sm rounded flex items-center gap-2",
              "border border-border-default bg-bg-secondary",
              "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
              "transition-colors",
              messageTypeFilter !== 'all' && "border-accent text-accent"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {filterOptions.find(opt => opt.value === messageTypeFilter)?.label}
          </button>

          {showFilterDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFilterDropdown(false)}
              />

              {/* Dropdown */}
              <div className="absolute top-full mt-1 right-0 w-48 bg-surface-primary border border-border-default rounded shadow-lg z-50">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect(option.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-bg-hover flex items-center justify-between",
                      messageTypeFilter === option.value && "bg-bg-selected"
                    )}
                    role="option"
                  >
                    {option.label}
                    {messageTypeFilter === option.value && (
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
          data-testid="sync-teams"
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            "h-8 w-8 rounded flex items-center justify-center",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          title="Sync Teams"
        >
          <RefreshCw
            data-testid={isSyncing ? "syncing-indicator" : undefined}
            className={cn("h-4 w-4", isSyncing && "animate-spin")}
          />
        </button>
      </div>
    </div>
  );
}
