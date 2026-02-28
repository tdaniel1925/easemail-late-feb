import { useEffect } from 'react';
import { useContactsStore } from '@/stores/contacts-store';
import { useRouter } from 'next/navigation';

/**
 * Keyboard shortcuts for Contacts module
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Search contacts
 * - Cmd/Ctrl + N: New contact (future: open contact form)
 * - Cmd/Ctrl + A: Select all contacts
 * - Escape: Clear selection
 * - Delete/Backspace: Delete selected contacts (future: implement delete)
 * - j/k: Navigate up/down in contacts list
 * - Enter: View selected contact details
 */
export function useContactsKeyboardShortcuts(enabled: boolean = true) {
  const {
    contacts,
    viewedContactId,
    selectedContactIds,
    setViewedContact,
    selectAllContacts,
    clearContactSelection,
    setSearchQuery,
  } = useContactsStore();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

      // Shortcuts that work everywhere
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input (future: implement)
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-testid="contacts-search"]'
        );
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Shortcuts that only work when NOT in input fields
      if (isInputField) return;

      // Select all contacts
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectAllContacts();
        return;
      }

      // Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        clearContactSelection();
        setViewedContact(null);
        return;
      }

      // Navigate contacts with j/k
      if (contacts.length > 0) {
        const currentIndex = contacts.findIndex((c) => c.id === viewedContactId);

        if (e.key === 'j') {
          e.preventDefault();
          // Go to next contact
          if (currentIndex < contacts.length - 1) {
            const nextContact = contacts[currentIndex + 1];
            setViewedContact(nextContact.id);
          } else if (currentIndex === -1 && contacts.length > 0) {
            // No contact selected, select first
            setViewedContact(contacts[0].id);
          }
          return;
        }

        if (e.key === 'k') {
          e.preventDefault();
          // Go to previous contact
          if (currentIndex > 0) {
            const prevContact = contacts[currentIndex - 1];
            setViewedContact(prevContact.id);
          } else if (currentIndex === -1 && contacts.length > 0) {
            // No contact selected, select last
            setViewedContact(contacts[contacts.length - 1].id);
          }
          return;
        }

        // View contact details with Enter
        if (e.key === 'Enter' && currentIndex !== -1) {
          e.preventDefault();
          // Contact details already shown when viewedContactId is set
          return;
        }
      }

      // New contact
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // Future: Open contact form modal
        console.log('[Keyboard Shortcut] New contact - not yet implemented');
        return;
      }

      // Export contacts
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        // Future: Trigger export
        console.log('[Keyboard Shortcut] Export contacts - not yet implemented');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    contacts,
    viewedContactId,
    selectedContactIds,
    setViewedContact,
    selectAllContacts,
    clearContactSelection,
    setSearchQuery,
    router,
  ]);
}

// Export shortcut definitions for help modal
export const CONTACTS_KEYBOARD_SHORTCUTS = {
  General: [
    { key: 'Cmd/Ctrl + K', description: 'Search contacts' },
    { key: 'Cmd/Ctrl + N', description: 'New contact' },
    { key: 'Cmd/Ctrl + A', description: 'Select all contacts' },
    { key: 'Escape', description: 'Clear selection' },
  ],
  Navigation: [
    { key: 'j', description: 'Next contact' },
    { key: 'k', description: 'Previous contact' },
    { key: 'Enter', description: 'View contact details' },
  ],
  Actions: [
    { key: 'Cmd/Ctrl + E', description: 'Export contacts' },
    { key: 'Delete', description: 'Delete selected contacts' },
  ],
};
