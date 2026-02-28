"use client";

import { useState } from "react";
import {
  Mail,
  Calendar,
  Users,
  Settings,
  Search,
  PenSquare,
  Folder,
  Archive,
  Trash2,
  Flag,
  Star,
  FileSignature,
  Keyboard,
  CalendarPlus,
  UserCircle,
  ChevronRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  content: HelpContent[];
}

interface HelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: HelpCircle,
    content: [
      {
        title: "Welcome to EaseMail",
        description: "EaseMail is a modern email client that connects to your Microsoft 365 account. It provides a clean, intuitive interface for managing your emails, calendar, and contacts.",
        steps: [
          "Sign in with your Microsoft 365 account",
          "Grant the necessary permissions for EaseMail to access your emails, calendar, and contacts",
          "Wait for the initial sync to complete",
          "Start managing your emails!",
        ],
      },
      {
        title: "Initial Setup",
        description: "When you first log in, EaseMail will sync your emails, folders, calendar events, and contacts from your Microsoft 365 account. This may take a few minutes depending on the size of your mailbox.",
        tips: [
          "The sync happens in the background, so you can start using EaseMail immediately",
          "You'll see a sync indicator in the folder list showing progress",
          "Connected accounts can be managed in Settings > Accounts",
        ],
      },
    ],
  },
  {
    id: "email",
    title: "Email Features",
    icon: Mail,
    content: [
      {
        title: "Composing Emails",
        description: "Create and send emails with rich formatting, attachments, and signatures.",
        steps: [
          "Click the 'Compose' button in the top bar (or press C)",
          "Enter recipient email addresses (press Enter or comma to add multiple)",
          "Add a subject and compose your message",
          "Use the formatting toolbar to style your text",
          "Add attachments by clicking the paperclip icon",
          "Select a signature from the dropdown (if you have any configured)",
          "Click 'Send' to send your email",
        ],
        tips: [
          "Use Cmd/Ctrl+Enter to send quickly",
          "Press Escape to close the composer without saving",
          "Emails are automatically saved as drafts",
          "You can reply, reply all, or forward from any email",
        ],
      },
      {
        title: "Reading Emails",
        description: "View and interact with your emails in a clean, focused interface.",
        steps: [
          "Click any email in the message list to view it",
          "Use the toolbar to reply, forward, archive, or delete",
          "Click the contact icon to view sender details and email history",
          "Mark emails as flagged/starred for quick access later",
        ],
        tips: [
          "Unread emails have a blue dot indicator",
          "Use J/K keys to navigate between emails",
          "The 'Re-Sync' button downloads full email content if only preview was synced",
        ],
      },
      {
        title: "Folders and Organization",
        description: "Organize your emails with folders and manage them efficiently.",
        steps: [
          "Click any folder in the sidebar to view its contents",
          "Use Archive (E) to move emails to the Archive folder",
          "Delete emails with the Delete button or Backspace key",
          "All folders from your Microsoft 365 account are automatically synced",
        ],
        tips: [
          "Inbox, Sent Items, Drafts, and other default folders appear first",
          "Custom folders appear below in alphabetical order",
          "Folder counts update in real-time as emails are processed",
        ],
      },
      {
        title: "Search",
        description: "Quickly find emails using the powerful search feature.",
        steps: [
          "Click the search bar or press Cmd/Ctrl+K",
          "Type your search query (sender, subject, or content)",
          "Use arrow keys to navigate results",
          "Press Enter to open the selected email",
        ],
        tips: [
          "Search looks through sender names, subjects, and email body content",
          "Results update as you type",
          "Press Escape to close search",
        ],
      },
      {
        title: "Keyboard Shortcuts",
        description: "Work faster with keyboard shortcuts.",
        steps: [
          "C - Compose new email",
          "R - Reply to selected email",
          "A - Reply all",
          "F - Forward",
          "E - Archive",
          "Backspace/Delete - Delete email",
          "S - Toggle star/flag",
          "J - Next email",
          "K - Previous email",
          "Cmd/Ctrl+K - Open search",
          "Escape - Close modal/composer",
        ],
      },
    ],
  },
  {
    id: "calendar",
    title: "Calendar",
    icon: Calendar,
    content: [
      {
        title: "Creating Events",
        description: "Schedule meetings and events directly from EaseMail.",
        steps: [
          "Click the 'Event' button in the top bar",
          "Enter event title, location, and description",
          "Set start and end times",
          "Add attendees by typing their email addresses",
          "Toggle 'All Day' for all-day events",
          "Enable 'Online Meeting' to create a Teams meeting link",
          "Set a reminder (e.g., 15 minutes before)",
          "Click 'Create Event' to save",
        ],
        tips: [
          "Events sync to your Microsoft 365 calendar",
          "Recurring events can be created using the recurrence options",
          "Meeting invites are sent automatically to attendees",
        ],
      },
      {
        title: "Viewing Your Calendar",
        description: "View your schedule in month, week, day, or agenda views.",
        steps: [
          "Navigate to the Calendar page from the sidebar",
          "Switch between Month, Week, Day, and Agenda views",
          "Click any event to view full details",
          "Use the navigation arrows to move between time periods",
          "Click 'Today' to jump to the current date",
        ],
      },
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    icon: Users,
    content: [
      {
        title: "Viewing Contact Information",
        description: "Access contact details and email history from any email.",
        steps: [
          "Open an email",
          "Click the contact icon in the message header",
          "View contact details including phone, company, location",
          "See email history with this contact",
          "Click any email in the history to open it",
        ],
        tips: [
          "Contact information syncs from Microsoft 365",
          "Email history shows the last 10 emails",
          "Contacts are automatically inferred from your email interactions",
        ],
      },
      {
        title: "Managing Contacts",
        description: "View, create, and organize your contacts.",
        steps: [
          "Navigate to the Contacts page from the sidebar",
          "Browse all contacts or search by name/email",
          "Click 'New Contact' to add a contact manually",
          "Fill in contact details (name, email, phone, company, etc.)",
          "Click 'Save' to create the contact",
        ],
        tips: [
          "Contacts sync bidirectionally with Microsoft 365",
          "Mark contacts as favorites for quick access",
          "Group contacts for easy organization",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    content: [
      {
        title: "Managing Connected Accounts",
        description: "View and manage your Microsoft 365 accounts.",
        steps: [
          "Navigate to Settings from the sidebar",
          "View account status, email address, and sync information",
          "Click 'Reconnect' if an account shows an error status",
          "Add additional accounts by clicking 'Connect Account'",
        ],
        tips: [
          "Multiple accounts are supported",
          "Each account syncs independently",
          "Account sync status is shown in real-time",
        ],
      },
      {
        title: "Email Signatures",
        description: "Create and manage email signatures for your accounts.",
        steps: [
          "Go to Settings > Signatures",
          "Click 'New Signature'",
          "Enter a name for your signature",
          "Type your signature content (supports basic formatting)",
          "Select which account this signature applies to (or All Accounts)",
          "Check 'Set as Default' to use this signature automatically",
          "Click 'Save'",
        ],
        tips: [
          "You can have multiple signatures per account",
          "Default signatures are inserted automatically when composing",
          "Signatures support basic HTML formatting",
          "Account-specific signatures override global signatures",
        ],
      },
      {
        title: "Sync & Performance",
        description: "Manage how EaseMail syncs your data.",
        steps: [
          "Initial sync downloads recent emails (last 30 days by default)",
          "New emails sync automatically every few minutes",
          "Use 'Re-Sync' button on individual emails to download full content",
          "Calendar and contacts sync happens in the background",
        ],
        tips: [
          "Sync happens automatically - no manual refresh needed",
          "Large attachments may take longer to download",
          "Sync errors are logged and can be retried",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    content: [
      {
        title: "Common Issues",
        description: "Solutions to frequently encountered problems.",
        steps: [
          "**Emails not syncing**: Check account status in Settings > Accounts. Click 'Reconnect' if needed.",
          "**Missing email content**: Click the 'Re-Sync' button on the message to download full content.",
          "**Signatures not appearing**: Make sure you've set a default signature in Settings > Signatures.",
          "**Search not working**: Try refreshing the page. Search indexes are built in the background.",
          "**Calendar events not showing**: Navigate to the Calendar page to trigger a sync.",
        ],
      },
      {
        title: "Reconnecting Accounts",
        description: "If your account shows an error status or emails stop syncing:",
        steps: [
          "Go to Settings > Accounts",
          "Find the account with error status",
          "Click 'Reconnect'",
          "Sign in with your Microsoft 365 account again",
          "Grant the necessary permissions",
          "Wait for sync to resume",
        ],
      },
      {
        title: "Performance Tips",
        description: "Keep EaseMail running smoothly:",
        tips: [
          "Clear browser cache if the app feels slow",
          "Use Chrome or Edge for best performance",
          "Keep your browser updated to the latest version",
          "If folders load slowly, try refreshing the page",
          "Large mailboxes (>10,000 emails) may take longer to search",
        ],
      },
    ],
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: Keyboard,
    content: [
      {
        title: "Email Shortcuts",
        description: "Navigate and manage emails quickly with keyboard shortcuts.",
        steps: [
          "**C** - Compose new email",
          "**R** - Reply to current email",
          "**A** - Reply all",
          "**F** - Forward email",
          "**E** - Archive email",
          "**Backspace/Delete** - Delete email",
          "**S** - Toggle star/flag",
          "**J** or **↓** - Next email",
          "**K** or **↑** - Previous email",
          "**Enter** - Open selected email",
        ],
      },
      {
        title: "Global Shortcuts",
        description: "Navigate the app and access features quickly.",
        steps: [
          "**Cmd/Ctrl + K** - Open search",
          "**Escape** - Close modal/composer",
          "**/** - Focus search (when not in composer)",
          "**G then I** - Go to Inbox",
          "**G then S** - Go to Sent",
          "**G then D** - Go to Drafts",
          "**?** - Show keyboard shortcuts help",
        ],
      },
      {
        title: "Composer Shortcuts",
        description: "Speed up email composition.",
        steps: [
          "**Cmd/Ctrl + Enter** - Send email",
          "**Cmd/Ctrl + B** - Bold text",
          "**Cmd/Ctrl + I** - Italic text",
          "**Cmd/Ctrl + U** - Underline text",
          "**Escape** - Close composer",
        ],
      },
    ],
  },
];

export default function HelpPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["getting-started"]));
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Filter sections based on search
  const filteredSections = helpSections.filter((section) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.content.some(
        (content) =>
          content.title.toLowerCase().includes(query) ||
          content.description.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="flex h-full flex-col bg-surface-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-surface-secondary px-6 py-4">
        <h1 className="text-2xl font-semibold text-text-primary">Help & Documentation</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Learn how to use EaseMail and get the most out of your email experience
        </p>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-primary py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);

            return (
              <div
                key={section.id}
                className="rounded-lg border border-border-default bg-surface-secondary"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                >
                  <Icon size={20} className="text-accent" strokeWidth={1.5} />
                  <h2 className="flex-1 text-lg font-semibold text-text-primary">{section.title}</h2>
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-text-secondary" strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={20} className="text-text-secondary" strokeWidth={1.5} />
                  )}
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="border-t border-border-subtle px-4 py-4">
                    <div className="space-y-6">
                      {section.content.map((content, idx) => (
                        <div key={idx}>
                          <h3 className="text-sm font-semibold text-text-primary">{content.title}</h3>
                          <p className="mt-2 text-sm text-text-secondary">{content.description}</p>

                          {content.steps && (
                            <div className="mt-3">
                              <h4 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                Steps:
                              </h4>
                              <ol className="mt-2 space-y-1.5 pl-5">
                                {content.steps.map((step, stepIdx) => (
                                  <li
                                    key={stepIdx}
                                    className="list-decimal text-sm text-text-secondary"
                                    dangerouslySetInnerHTML={{ __html: step }}
                                  />
                                ))}
                              </ol>
                            </div>
                          )}

                          {content.tips && (
                            <div className="mt-3 rounded-md bg-surface-primary p-3">
                              <h4 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                Tips:
                              </h4>
                              <ul className="mt-2 space-y-1.5">
                                {content.tips.map((tip, tipIdx) => (
                                  <li key={tipIdx} className="flex items-start gap-2 text-sm text-text-secondary">
                                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="py-12 text-center">
              <Search size={48} className="mx-auto mb-3 text-text-tertiary" strokeWidth={1} />
              <p className="text-sm text-text-secondary">No help articles found</p>
              <p className="mt-1 text-xs text-text-tertiary">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
