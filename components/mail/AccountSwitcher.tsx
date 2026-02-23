"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, ChevronDown, AlertCircle } from "lucide-react";
import { useAccountStore, type Account } from "@/stores/account-store";

export function AccountSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    accounts,
    activeAccountId,
    isLoading,
    error,
    setAccounts,
    setActiveAccount,
    setLoading,
    setError,
  } = useAccountStore();

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts");

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data.accounts || []);

      // Set first account as active if none is selected
      if (!activeAccountId && data.accounts.length > 0) {
        setActiveAccount(data.accounts[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSwitch = (accountId: string) => {
    setActiveAccount(accountId);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "needs_reauth":
        return "bg-red-500";
      case "syncing":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (email: string, displayName: string | null) => {
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Calculate total unread across all accounts
  const totalUnread = accounts.reduce((sum, acc) => sum + (acc.unreadCount || 0), 0);

  // Find active account
  const activeAccount = accounts.find((acc) => acc.id === activeAccountId);

  // Show warning if any account needs reauth
  const needsReauth = accounts.some((acc) => acc.status === "needs_reauth");

  return (
    <div className="relative px-3 py-3 pb-2" ref={dropdownRef}>
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
          isOpen ? "bg-surface-tertiary" : "hover:bg-surface-tertiary"
        }`}
        disabled={isLoading}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Switch account"
      >
        <div className={`h-2 w-2 rounded-full ${totalUnread > 0 ? "bg-accent" : "bg-green-500"}`} />
        <span className="flex-1 text-left text-xs font-medium text-text-primary">
          {isLoading ? "Loading..." : activeAccount ? activeAccount.email : "All Accounts"}
        </span>
        <ChevronDown
          size={12}
          className={`text-text-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>

      {/* Warning banner for accounts needing reauth */}
      {needsReauth && !isOpen && (
        <div className="mt-2 flex items-center gap-1.5 rounded-md border border-yellow-200 bg-yellow-50 px-2.5 py-1.5 dark:border-yellow-900 dark:bg-yellow-950">
          <AlertCircle size={12} className="text-yellow-600 dark:text-yellow-500" strokeWidth={1.5} />
          <span className="flex-1 text-[10px] text-yellow-700 dark:text-yellow-400">
            {accounts.find((a) => a.status === "needs_reauth")?.email.split("@")[0]} needs reconnection
          </span>
          <button className="text-[10px] font-medium text-accent">Fix</button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-3 right-3 top-14 z-50 mt-1 overflow-hidden rounded-md border border-border-default bg-surface-elevated shadow-md">
          {/* Account list */}
          <div className="max-h-64 overflow-y-auto">
            {error && (
              <div className="px-3 py-2 text-xs text-red-500">
                Error loading accounts: {error}
              </div>
            )}

            {!error && accounts.length === 0 && !isLoading && (
              <div className="px-3 py-2 text-center text-xs text-text-tertiary">
                No accounts connected
              </div>
            )}

            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountSwitch(account.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-surface-hover ${
                  account.id === activeAccountId ? "bg-surface-selected" : ""
                }`}
              >
                {/* Status indicator */}
                <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${getStatusColor(account.status)}`} />

                {/* Avatar */}
                {account.avatar_url ? (
                  <img
                    src={account.avatar_url}
                    alt={account.email}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                    {getInitials(account.email, account.display_name)}
                  </div>
                )}

                {/* Account info */}
                <div className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs text-text-primary">
                    {account.display_name || account.email}
                  </span>
                  {account.display_name && (
                    <span className="text-[10px] text-text-tertiary">
                      {account.email}
                    </span>
                  )}
                </div>

                {/* Unread count */}
                {(account.unreadCount || 0) > 0 && (
                  <span className="text-xs font-semibold text-text-primary">
                    {account.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add account button */}
          <a
            href="/api/accounts/connect"
            className="flex w-full items-center gap-2 border-t border-border-default px-3 py-2 transition-colors hover:bg-surface-hover"
            onClick={() => setIsOpen(false)}
          >
            <Plus size={12} className="text-accent" strokeWidth={1.5} />
            <span className="text-xs text-accent">Add account</span>
          </a>
        </div>
      )}
    </div>
  );
}
