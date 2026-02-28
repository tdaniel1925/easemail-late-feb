"use client";

import { useEffect, useRef, useCallback } from "react";
import { Users } from "lucide-react";
import { useContactsStore } from "@/stores/contacts-store";
import { useAccountStore } from "@/stores/account-store";
import { ContactListItem } from "./ContactListItem";

export function ContactList() {
  const {
    contacts,
    selectedContactIds,
    isLoadingContacts,
    contactsError,
    searchQuery,
    companyFilter,
    sourceFilter,
    favoriteFilter,
    selectedGroupId,
    setContacts,
    setViewedContact,
    toggleContactSelection,
    selectContact,
    setLoadingContacts,
    setContactsError,
    setContactPage,
    setHasMoreContacts,
  } = useContactsStore();

  const { activeAccountId } = useAccountStore();

  // Ref to track the current fetch AbortController
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch contacts when account or filters change
  const fetchContacts = useCallback(async () => {
    if (!activeAccountId) {
      console.log('[ContactList] Skipping fetch - missing accountId');
      setContacts([]);
      setContactsError(null);
      return;
    }

    console.log('[ContactList] Fetching contacts');

    // Cancel any pending fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setLoadingContacts(true);
    setContactsError(null);
    setContactPage(1);
    setHasMoreContacts(true);

    try {
      const params = new URLSearchParams({
        accountId: activeAccountId,
        page: "1",
        limit: "50",
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (companyFilter) {
        params.append('company', companyFilter);
      }

      if (sourceFilter) {
        params.append('source', sourceFilter);
      }

      if (favoriteFilter !== null) {
        params.append('isFavorite', String(favoriteFilter));
      }

      if (selectedGroupId) {
        params.append('groupId', selectedGroupId);
      }

      const response = await fetch(`/api/contacts?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch contacts");
      }

      const data = await response.json();
      console.log('[ContactList] Fetched', data.contacts?.length || 0, 'contacts');
      setContacts(data.contacts || []);

      // Check if there are more contacts
      if (data.pagination) {
        setHasMoreContacts(data.pagination.page < data.pagination.pages);
      } else {
        setHasMoreContacts((data.contacts || []).length >= 50);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching contacts:", err);
        setContactsError(err.message);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingContacts(false);
      }
    }
  }, [activeAccountId, searchQuery, companyFilter, sourceFilter, favoriteFilter, selectedGroupId, setContacts, setLoadingContacts, setContactsError, setContactPage, setHasMoreContacts]);

  useEffect(() => {
    console.log('[ContactList] useEffect triggered', { activeAccountId, favoriteFilter, selectedGroupId });
    fetchContacts();
  }, [activeAccountId, searchQuery, companyFilter, sourceFilter, favoriteFilter, selectedGroupId, fetchContacts]);

  const handleSelect = (contactId: string, isCheckbox: boolean) => {
    if (isCheckbox) {
      toggleContactSelection(contactId);
    } else {
      selectContact(contactId);
      setViewedContact(contactId);
    }
  };

  // Loading state
  if (isLoadingContacts) {
    return (
      <div className="w-[320px] flex h-full flex-col overflow-hidden bg-surface-secondary border-r border-border-default">
        <div className="flex-1 space-y-0 overflow-y-auto">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 border-b border-border-subtle px-3 py-2.5"
              style={{ minHeight: "64px" }}
            >
              <div className="h-10 w-10 animate-pulse-opacity rounded-full bg-surface-tertiary" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-3.5 w-3/4 animate-pulse-opacity rounded bg-surface-tertiary" />
                <div className="h-3 w-1/2 animate-pulse-opacity rounded bg-surface-tertiary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (contactsError) {
    return (
      <div className="w-[320px] flex h-full flex-col items-center justify-center bg-surface-secondary border-r border-border-default">
        <Users size={48} className="mb-3 text-red-500" strokeWidth={1} />
        <p className="text-sm font-medium text-red-500">Error loading contacts</p>
        <p className="mt-1 text-xs text-text-tertiary">{contactsError}</p>
        <button
          onClick={fetchContacts}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No account selected
  if (!activeAccountId) {
    return (
      <div className="w-[320px] flex h-full flex-col items-center justify-center bg-surface-secondary border-r border-border-default">
        <Users size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Select an account to view contacts</p>
      </div>
    );
  }

  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="w-[320px] flex h-full flex-col items-center justify-center bg-surface-secondary border-r border-border-default">
        <Users size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">
          {searchQuery || companyFilter || sourceFilter
            ? "No contacts match your filters"
            : "No contacts found"}
        </p>
        {(searchQuery || companyFilter || sourceFilter) && (
          <button
            onClick={() => {
              // Clear filters would go here
              fetchContacts();
            }}
            className="mt-4 text-xs text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  // Contacts list
  return (
    <div className="w-[320px] flex h-full flex-col overflow-hidden bg-surface-secondary border-r border-border-default">
      {/* Contact count header */}
      <div className="flex items-center justify-between border-b border-border-default bg-surface-primary px-4 py-2">
        <span className="text-xs text-text-secondary">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contacts list */}
      <div data-testid="contacts-list" className="flex-1 overflow-y-auto">
        {contacts.map((contact) => (
          <ContactListItem
            key={contact.id}
            contact={contact}
            isSelected={selectedContactIds.has(contact.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
