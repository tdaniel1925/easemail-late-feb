"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  User,
  Calendar,
  Tag,
  MapPin,
  Star,
  Edit,
  Trash2,
  Heart,
  Cake,
  MessageCircle,
} from "lucide-react";
import { useContactsStore } from "@/stores/contacts-store";
import { formatDistanceToNow } from "date-fns";
import type { Contact } from "@/types/contacts";

export function ContactDetailPane() {
  const { viewedContactId, contacts, openEditor } = useContactsStore();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (viewedContactId) {
      const found = contacts.find((c) => c.id === viewedContactId);
      setContact(found || null);
    } else {
      setContact(null);
    }
  }, [viewedContactId, contacts]);

  const handleEdit = () => {
    if (contact) {
      openEditor('edit', contact.id);
    }
  };

  // No contact selected
  if (!viewedContactId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-primary">
        <User size={48} className="mb-3 text-text-tertiary" strokeWidth={1} />
        <p className="text-sm text-text-secondary">Select a contact to view details</p>
      </div>
    );
  }

  // Contact not found
  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-primary">
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
    <div data-testid="contact-details" className="flex-1 flex flex-col bg-surface-primary overflow-hidden">
      {/* Header with avatar and name */}
      <div className="border-b border-border-default bg-surface-primary px-6 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {contact.avatar_url || contact.photo_data ? (
            <img
              src={contact.photo_data || contact.avatar_url || ''}
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-text-primary">{displayName}</h2>
              {contact.is_favorite && (
                <Star className="h-5 w-5 fill-accent text-accent" />
              )}
            </div>
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

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="h-8 w-8 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              title="Edit Contact"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact details */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Email */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
              <Mail size={14} strokeWidth={1.5} />
              <span>Email</span>
            </div>
            <div className="rounded-md bg-surface-secondary px-3 py-2">
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-accent hover:underline"
              >
                {contact.email}
              </a>
            </div>
          </div>

          {/* Phone Numbers */}
          {(contact.mobile_phone || contact.business_phone || contact.home_phone || contact.phone) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <Phone size={14} strokeWidth={1.5} />
                <span>Phone</span>
              </div>
              <div className="space-y-2">
                {contact.mobile_phone && (
                  <div className="rounded-md bg-surface-secondary px-3 py-2">
                    <div className="text-xs text-text-tertiary mb-0.5">Mobile</div>
                    <a href={`tel:${contact.mobile_phone}`} className="text-sm text-accent hover:underline">
                      {contact.mobile_phone}
                    </a>
                  </div>
                )}
                {contact.business_phone && (
                  <div className="rounded-md bg-surface-secondary px-3 py-2">
                    <div className="text-xs text-text-tertiary mb-0.5">Business</div>
                    <a href={`tel:${contact.business_phone}`} className="text-sm text-accent hover:underline">
                      {contact.business_phone}
                    </a>
                  </div>
                )}
                {contact.home_phone && (
                  <div className="rounded-md bg-surface-secondary px-3 py-2">
                    <div className="text-xs text-text-tertiary mb-0.5">Home</div>
                    <a href={`tel:${contact.home_phone}`} className="text-sm text-accent hover:underline">
                      {contact.home_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Info */}
          {(contact.company || contact.job_title || contact.department || contact.office_location || contact.profession) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <Building2 size={14} strokeWidth={1.5} />
                <span>Professional</span>
              </div>
              <div className="space-y-2 rounded-md bg-surface-secondary px-3 py-2">
                {contact.company && (
                  <div>
                    <span className="text-xs text-text-tertiary">Company:</span>
                    <p className="text-sm text-text-primary">{contact.company}</p>
                  </div>
                )}
                {contact.job_title && (
                  <div>
                    <span className="text-xs text-text-tertiary">Title:</span>
                    <p className="text-sm text-text-primary">{contact.job_title}</p>
                  </div>
                )}
                {contact.department && (
                  <div>
                    <span className="text-xs text-text-tertiary">Department:</span>
                    <p className="text-sm text-text-primary">{contact.department}</p>
                  </div>
                )}
                {contact.office_location && (
                  <div>
                    <span className="text-xs text-text-tertiary">Office:</span>
                    <p className="text-sm text-text-primary">{contact.office_location}</p>
                  </div>
                )}
                {contact.profession && (
                  <div>
                    <span className="text-xs text-text-tertiary">Profession:</span>
                    <p className="text-sm text-text-primary">{contact.profession}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {(contact.street_address || contact.city || contact.state || contact.postal_code || contact.country) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <MapPin size={14} strokeWidth={1.5} />
                <span>Address</span>
              </div>
              <div className="rounded-md bg-surface-secondary px-3 py-2">
                <p className="text-sm text-text-primary whitespace-pre-line">
                  {contact.street_address && `${contact.street_address}\n`}
                  {contact.city || contact.state || contact.postal_code
                    ? `${contact.city || ''}${contact.city && contact.state ? ', ' : ''}${contact.state || ''} ${contact.postal_code || ''}\n`
                    : ''}
                  {contact.country}
                </p>
              </div>
            </div>
          )}

          {/* Personal Info */}
          {(contact.birthday || contact.anniversary || contact.spouse_name) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <Heart size={14} strokeWidth={1.5} />
                <span>Personal</span>
              </div>
              <div className="space-y-2 rounded-md bg-surface-secondary px-3 py-2">
                {contact.birthday && (
                  <div>
                    <span className="text-xs text-text-tertiary">Birthday:</span>
                    <p className="text-sm text-text-primary">{new Date(contact.birthday).toLocaleDateString()}</p>
                  </div>
                )}
                {contact.anniversary && (
                  <div>
                    <span className="text-xs text-text-tertiary">Anniversary:</span>
                    <p className="text-sm text-text-primary">{new Date(contact.anniversary).toLocaleDateString()}</p>
                  </div>
                )}
                {contact.spouse_name && (
                  <div>
                    <span className="text-xs text-text-tertiary">Spouse:</span>
                    <p className="text-sm text-text-primary">{contact.spouse_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {(contact.notes || contact.personal_notes) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <MessageCircle size={14} strokeWidth={1.5} />
                <span>Notes</span>
              </div>
              <div className="space-y-2 rounded-md bg-surface-secondary px-3 py-2">
                {contact.notes && (
                  <div>
                    <span className="text-xs text-text-tertiary">Notes:</span>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
                {contact.personal_notes && (
                  <div>
                    <span className="text-xs text-text-tertiary">Personal Notes:</span>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{contact.personal_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories */}
          {contact.categories && contact.categories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <Tag size={14} strokeWidth={1.5} />
                <span>Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contact.categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex rounded px-2 py-1 text-xs bg-surface-tertiary text-text-secondary"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Email activity */}
          {(contact.email_count || contact.last_emailed_at) && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
                <Calendar size={14} strokeWidth={1.5} />
                <span>Email Activity</span>
              </div>
              <div className="space-y-2 rounded-md bg-surface-secondary px-3 py-2">
                {contact.email_count ? (
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">{contact.email_count}</span>{' '}
                    email{contact.email_count !== 1 ? 's' : ''} exchanged
                  </p>
                ) : null}
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
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
              <Tag size={14} strokeWidth={1.5} />
              <span>Metadata</span>
            </div>
            <div className="space-y-2 rounded-md bg-surface-secondary px-3 py-2">
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
