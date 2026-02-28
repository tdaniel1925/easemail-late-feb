import { useEffect, useCallback } from 'react';
import { useContactsStore, Contact } from '@/stores/contacts-store';
import { UndoQueue } from '@/lib/undo-queue';
import { useToastStore } from '@/stores/toast-store';

const contactsUndoQueue = new UndoQueue(50, 5 * 60 * 1000);

/**
 * Undo hook for Contacts module
 *
 * Provides undo/redo functionality for:
 * - Contact edits
 * - Contact deletions
 * - Bulk operations
 */
export function useContactsUndo() {
  const { updateContact, setContacts, contacts } = useContactsStore();
  const { addToast } = useToastStore();

  /**
   * Track contact edit for undo
   */
  const trackContactEdit = useCallback(
    (contactId: string, oldData: Partial<Contact>, newData: Partial<Contact>) => {
      contactsUndoQueue.push({
        type: 'contact-edit',
        description: `Edit contact`,
        data: { contactId, oldData, newData },
        undo: ({ contactId, oldData }: { contactId: string; oldData: Partial<Contact> }) => {
          updateContact(contactId, oldData);
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: 'Contact edit undone',
          });
        },
        redo: ({ contactId, newData }: { contactId: string; newData: Partial<Contact> }) => {
          updateContact(contactId, newData);
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: 'Contact edit redone',
          });
        },
      });
    },
    [updateContact, addToast]
  );

  /**
   * Track contact deletion for undo
   */
  const trackContactDeletion = useCallback(
    (deletedContacts: Contact[]) => {
      contactsUndoQueue.push({
        type: 'contact-delete',
        description: `Delete ${deletedContacts.length} contact(s)`,
        data: { deletedContacts, currentContacts: [...contacts] },
        undo: ({ deletedContacts }: { deletedContacts: Contact[] }) => {
          // Re-add deleted contacts
          setContacts([...contacts, ...deletedContacts]);
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: `Restored ${deletedContacts.length} contact(s)`,
          });
        },
        redo: ({ deletedContacts }: { deletedContacts: Contact[] }) => {
          // Remove contacts again
          const deletedIds = new Set(deletedContacts.map((c) => c.id));
          setContacts(contacts.filter((c) => !deletedIds.has(c.id)));
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: `Deleted ${deletedContacts.length} contact(s)`,
          });
        },
      });
    },
    [setContacts, contacts, addToast]
  );

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    const success = await contactsUndoQueue.undo();
    if (!success) {
      addToast({
        id: `undo-error-${Date.now()}`,
        type: 'error',
        message: 'Nothing to undo',
      });
    }
  }, [addToast]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async () => {
    const success = await contactsUndoQueue.redo();
    if (!success) {
      addToast({
        id: `redo-error-${Date.now()}`,
        type: 'error',
        message: 'Nothing to redo',
      });
    }
  }, [addToast]);

  /**
   * Keyboard shortcuts for undo/redo
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: contactsUndoQueue.canUndo(),
    canRedo: contactsUndoQueue.canRedo(),
    undoDescription: contactsUndoQueue.getUndoDescription(),
    redoDescription: contactsUndoQueue.getRedoDescription(),
    trackContactEdit,
    trackContactDeletion,
  };
}
