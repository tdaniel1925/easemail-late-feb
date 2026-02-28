"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, UserPlus, RefreshCw, Trash2, Star, Download, ChevronDown, Check } from "lucide-react";
import { useContactsStore } from "@/stores/contacts-store";
import { useContactsAutoSync } from "@/hooks/useContactsAutoSync";
import { useAccountStore } from "@/stores/account-store";
import { cn } from "@/lib/utils";

export function ContactsToolbar() {
  const {
    contacts,
    searchQuery,
    selectedContactIds,
    companyFilter,
    isSyncing,
    setSearchQuery,
    setCompanyFilter,
    selectAllContacts,
    clearContactSelection,
    openEditor,
    setContacts,
  } = useContactsStore();

  const { activeAccountId } = useAccountStore();
  const { triggerSync } = useContactsAutoSync(activeAccountId, 5 * 60 * 1000, true);

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedCount = selectedContactIds.size;

  // Get unique companies for filter
  const companies = useMemo(() => {
    const uniqueCompanies = new Set<string>();
    contacts.forEach(contact => {
      if (contact.company) {
        uniqueCompanies.add(contact.company);
      }
    });
    return Array.from(uniqueCompanies).sort();
  }, [contacts]);

  // Check if all visible contacts are selected
  const allSelected = contacts.length > 0 && selectedContactIds.size === contacts.length;

  // Debounce search query (200ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, setSearchQuery]);

  const handleNewContact = () => {
    openEditor('create');
  };

  const handleRefresh = () => {
    triggerSync();
  };

  const handleDelete = async () => {
    if (selectedCount === 0) return;

    const contactIds = Array.from(selectedContactIds);
    const confirmed = confirm(`Delete ${selectedCount} contact(s)?`);

    if (!confirmed) return;

    // Store original contacts for rollback
    const originalContacts = [...contacts];

    // Optimistically remove from UI
    setContacts(contacts.filter(c => !contactIds.includes(c.id)));
    clearContactSelection();

    try {
      await Promise.all(
        contactIds.map((id) =>
          fetch(`/api/contacts/${id}`, {
            method: "DELETE",
          })
        )
      );

      // Refresh contact list to get fresh data
      triggerSync();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(`Failed to delete contacts: ${err.message}`);

      // Rollback on failure
      setContacts(originalContacts);
    }
  };

  const handleToggleFavorite = async () => {
    if (selectedCount === 0) return;

    const contactIds = Array.from(selectedContactIds);

    try {
      await Promise.all(
        contactIds.map((id) =>
          fetch(`/api/contacts/${id}/favorite`, {
            method: "POST",
          })
        )
      );

      clearContactSelection();
      triggerSync();
    } catch (err: any) {
      console.error('Toggle favorite failed:', err);
      setError(`Failed to toggle favorite: ${err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/contacts/export?accountId=${activeAccountId}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(`Failed to export contacts: ${err.message}`);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      clearContactSelection();
    } else {
      selectAllContacts();
    }
  };

  const handleCompanySelect = (company: string | null) => {
    setCompanyFilter(company);
    setShowCompanyFilter(false);
  };

  return (
    <div className="border-b border-border-default bg-surface-primary">
      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="h-[52px] px-4 flex items-center gap-2">
      {/* Select All Checkbox */}
      <input
        type="checkbox"
        checked={allSelected}
        onChange={handleSelectAll}
        className="h-4 w-4 rounded border-border-default text-accent focus:ring-2 focus:ring-accent cursor-pointer"
        title="Select all contacts"
      />

      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            data-testid="contacts-search"
            type="text"
            placeholder="Search contacts..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className={cn(
              "w-full h-8 pl-9 pr-3 text-sm",
              "bg-bg-secondary border border-border-default rounded",
              "placeholder:text-text-secondary",
              "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* Company Filter */}
      <div className="relative">
        <button
          data-testid="company-filter"
          onClick={() => setShowCompanyFilter(!showCompanyFilter)}
          className={cn(
            "h-8 px-3 text-sm rounded flex items-center gap-2",
            "border border-border-default bg-bg-secondary",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "transition-colors",
            companyFilter && "border-accent text-accent"
          )}
        >
          {companyFilter || "All Companies"}
          <ChevronDown className="h-3 w-3" />
        </button>

        {showCompanyFilter && (
          <div className="absolute top-full mt-1 right-0 w-56 bg-surface-primary border border-border-default rounded shadow-lg z-50 max-h-64 overflow-y-auto">
            <button
              onClick={() => handleCompanySelect(null)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-bg-hover flex items-center justify-between",
                !companyFilter && "bg-bg-selected"
              )}
              role="option"
            >
              All Companies
              {!companyFilter && <Check className="h-4 w-4 text-accent" />}
            </button>
            {companies.map((company) => (
              <button
                key={company}
                onClick={() => handleCompanySelect(company)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-bg-hover flex items-center justify-between",
                  companyFilter === company && "bg-bg-selected"
                )}
                role="option"
              >
                {company}
                {companyFilter === company && <Check className="h-4 w-4 text-accent" />}
              </button>
            ))}
            {companies.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-tertiary">No companies found</div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* New Contact */}
        <button
          onClick={handleNewContact}
          className={cn(
            "h-8 px-3 text-sm font-medium rounded",
            "bg-accent text-white",
            "hover:bg-accent-hover",
            "flex items-center gap-2",
            "transition-colors"
          )}
        >
          <UserPlus className="h-4 w-4" />
          New Contact
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border-default mx-1" />

        {/* Refresh */}
        <button
          data-testid="sync-contacts"
          onClick={handleRefresh}
          disabled={isSyncing}
          className={cn(
            "h-8 w-8 rounded flex items-center justify-center",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          title="Refresh"
        >
          <RefreshCw data-testid={isSyncing ? "syncing-indicator" : undefined} className={cn("h-4 w-4", isSyncing && "animate-spin")} />
        </button>

        {/* Export */}
        <button
          data-testid="export-contacts"
          onClick={handleExport}
          className={cn(
            "h-8 w-8 rounded flex items-center justify-center",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "transition-colors"
          )}
          title="Export Contacts"
        >
          <Download className="h-4 w-4" />
        </button>

        {/* Favorite (only when selection exists) */}
        {selectedCount > 0 && (
          <button
            onClick={handleToggleFavorite}
            className={cn(
              "h-8 w-8 rounded flex items-center justify-center",
              "text-text-secondary hover:text-accent hover:bg-bg-hover",
              "transition-colors"
            )}
            title="Toggle Favorite"
          >
            <Star className="h-4 w-4" />
          </button>
        )}

        {/* Delete (only when selection exists) */}
        {selectedCount > 0 && (
          <button
            onClick={handleDelete}
            className={cn(
              "h-8 w-8 rounded flex items-center justify-center",
              "text-text-secondary hover:text-red-600 hover:bg-bg-hover",
              "transition-colors"
            )}
            title={`Delete ${selectedCount} contact(s)`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Selection count */}
      {selectedCount > 0 && (
        <div data-testid="selection-count" className="text-sm text-text-secondary ml-2">
          {selectedCount} selected
        </div>
      )}
      </div>
    </div>
  );
}
