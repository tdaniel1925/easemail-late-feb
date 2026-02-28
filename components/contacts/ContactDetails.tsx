"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Building2, Briefcase, User, Calendar, Tag } from "lucide-react";
import { useContactsStore } from "@/stores/contacts-store";
import { formatDistanceToNow } from "date-fns";

export function ContactDetails() {
  const { viewedContactId, contacts } = useContactsStore();
  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    if (viewedContactId) {
      const found = contacts.find((c) => c.id === viewedContactId);
      setContact(found || null);
    } else {
      setContact(null);
    }
  }, [viewedContactId, contacts]);

  // No contact selected
  if (!viewedContactId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-primary">
        <User size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Select a contact to view details</p>
      </div>
    );
  }

  // Contact not found
  if (!contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-primary">
        <User size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Contact not found</p>
      </div>
    );
  }

  const displayName = contact.display_name || contact.email;
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(contact.display_name, contact.email);

  return (
    <div className="flex h-full flex-col bg-surface-primary">
      {/* Header with avatar and name */}
      <div className="border-b border-border-default bg-surface-primary px-6 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-tertiary text-lg font-medium text-text-secondary">
              {initials}
            </div>
          )}

          {/* Name and basic info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary">{displayName}</h2>
            {contact.job_title && (
              <p className="mt-1 text-sm text-text-secondary">{contact.job_title}</p>
            )}
            {contact.company && (
              <p className="mt-0.5 text-sm text-text-tertiary">{contact.company}</p>
            )}

            {/* Source badge */}
            <div className="mt-2">
              <span
                className={`inline-flex rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${
                  contact.source === 'graph'
                    ? 'bg-blue-500/10 text-blue-600'
                    : contact.source === 'manual'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-gray-500/10 text-gray-600'
                }`}
              >
                {contact.source}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact details */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Email */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
              <Mail size={14} strokeWidth={1.5} />
              <span>Email</span>
            </div>
            <div className="mt-2 rounded-md bg-surface-secondary px-3 py-2">
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-accent hover:underline"
              >
                {contact.email}
              </a>
            </div>
          </div>

          {/* Phone */}
          {contact.phone && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <Phone size={14} strokeWidth={1.5} />
                <span>Phone</span>
              </div>
              <div className="mt-2 rounded-md bg-surface-secondary px-3 py-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="text-sm text-accent hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            </div>
          )}

          {/* Company */}
          {contact.company && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <Building2 size={14} strokeWidth={1.5} />
                <span>Company</span>
              </div>
              <div className="mt-2 rounded-md bg-surface-secondary px-3 py-2">
                <p className="text-sm text-text-primary">{contact.company}</p>
              </div>
            </div>
          )}

          {/* Job Title */}
          {contact.job_title && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <Briefcase size={14} strokeWidth={1.5} />
                <span>Job Title</span>
              </div>
              <div className="mt-2 rounded-md bg-surface-secondary px-3 py-2">
                <p className="text-sm text-text-primary">{contact.job_title}</p>
              </div>
            </div>
          )}

          {/* Email activity */}
          {(contact.email_count > 0 || contact.last_emailed_at) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <Calendar size={14} strokeWidth={1.5} />
                <span>Email Activity</span>
              </div>
              <div className="mt-2 space-y-2 rounded-md bg-surface-secondary px-3 py-2">
                {contact.email_count > 0 && (
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">{contact.email_count}</span>{' '}
                    email{contact.email_count !== 1 ? 's' : ''} exchanged
                  </p>
                )}
                {contact.last_emailed_at && (
                  <p className="text-sm text-text-secondary">
                    Last emailed{' '}
                    <span className="font-medium text-text-primary">
                      {formatDistanceToNow(new Date(contact.last_emailed_at), { addSuffix: true })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
              <Tag size={14} strokeWidth={1.5} />
              <span>Metadata</span>
            </div>
            <div className="mt-2 space-y-2 rounded-md bg-surface-secondary px-3 py-2">
              {contact.created_at && (
                <p className="text-xs text-text-secondary">
                  Created{' '}
                  {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                </p>
              )}
              {contact.updated_at && (
                <p className="text-xs text-text-secondary">
                  Updated{' '}
                  {formatDistanceToNow(new Date(contact.updated_at), { addSuffix: true })}
                </p>
              )}
              {contact.graph_id && (
                <p className="text-xs text-text-tertiary">
                  Graph ID: <span className="font-mono">{contact.graph_id.slice(0, 16)}...</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
