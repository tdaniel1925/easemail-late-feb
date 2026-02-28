"use client";

import { ContactsSidebar } from "@/components/contacts/ContactsSidebar";
import { ContactsToolbar } from "@/components/contacts/ContactsToolbar";
import { ContactList } from "@/components/contacts/ContactList";
import { ContactDetailPane } from "@/components/contacts/ContactDetailPane";
import { ContactEditorModal } from "@/components/contacts/ContactEditorModal";
import { useAccountStore } from "@/stores/account-store";
import { useContactsAutoSync } from "@/hooks/useContactsAutoSync";
import { useContactsKeyboardShortcuts } from "@/hooks/useContactsKeyboardShortcuts";
import { useContactsUndo } from "@/hooks/useContactsUndo";

export default function ContactsPage() {
  const activeAccountId = useAccountStore((state) => state.activeAccountId);

  // Auto-sync contacts every 5 minutes
  useContactsAutoSync(activeAccountId, 5 * 60 * 1000, true);

  // Enable keyboard shortcuts
  useContactsKeyboardShortcuts(true);

  // Enable undo/redo
  useContactsUndo();

  return (
    <div className="flex h-full flex-col bg-bg-secondary">
      {/* Toolbar */}
      <ContactsToolbar />

      {/* 3-column Outlook layout: Sidebar | List | Detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Groups/Folders Sidebar (200px) */}
        <ContactsSidebar />

        {/* Middle: Contact List (320px) */}
        <ContactList />

        {/* Right: Contact Detail Pane (flex-1) */}
        <ContactDetailPane />
      </div>

      {/* Modals */}
      <ContactEditorModal />
    </div>
  );
}
