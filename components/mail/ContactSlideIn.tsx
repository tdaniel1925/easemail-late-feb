"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, Building2, MapPin, Calendar, Loader2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAccountStore } from "@/stores/account-store";

interface Contact {
  id: string;
  display_name: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  job_title: string | null;
  mobile_phone: string | null;
  business_phone: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailHistoryItem {
  id: string;
  subject: string | null;
  preview: string | null;
  received_at: string;
  is_read: boolean;
  has_attachments: boolean;
}

interface ContactSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  contactEmail: string;
}

export function ContactSlideIn({ isOpen, onClose, contactEmail }: ContactSlideInProps) {
  const { activeAccountId } = useAccountStore();
  const [contact, setContact] = useState<Contact | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([]);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contactEmail) {
      fetchContactInfo();
      fetchEmailHistory();
    }
  }, [isOpen, contactEmail]);

  const fetchContactInfo = async () => {
    setIsLoadingContact(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts?email=${encodeURIComponent(contactEmail)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch contact");
      }

      const data = await response.json();

      // Get the first matching contact (if multiple accounts have this contact)
      if (data.contacts && data.contacts.length > 0) {
        setContact(data.contacts[0]);
      } else {
        // No contact found - create a basic contact object from email
        setContact({
          id: '',
          display_name: contactEmail.split('@')[0],
          email: contactEmail,
          first_name: null,
          last_name: null,
          company: null,
          job_title: null,
          mobile_phone: null,
          business_phone: null,
          phone: null,
          city: null,
          state: null,
          country: null,
          is_favorite: false,
          notes: null,
          created_at: '',
          updated_at: '',
        });
      }
    } catch (err: any) {
      console.error("Error fetching contact:", err);
      setError(err.message);
    } finally {
      setIsLoadingContact(false);
    }
  };

  const fetchEmailHistory = async () => {
    if (!activeAccountId) {
      console.warn("No active account ID, skipping email history fetch");
      return;
    }

    setIsLoadingHistory(true);

    try {
      const response = await fetch(
        `/api/mail/messages?accountId=${activeAccountId}&fromEmail=${encodeURIComponent(contactEmail)}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch email history");
      }

      const data = await response.json();
      setEmailHistory(data.messages || []);
    } catch (err: any) {
      console.error("Error fetching email history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

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

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 transform border-l border-border-default bg-surface-primary shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default bg-surface-secondary px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Contact Info</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:bg-surface-tertiary"
            aria-label="Close"
          >
            <X size={16} className="text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-52px)] overflow-y-auto">
          {/* Loading state */}
          {isLoadingContact && (
            <div className="flex h-40 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-text-tertiary" strokeWidth={1.5} />
            </div>
          )}

          {/* Error state */}
          {error && !isLoadingContact && (
            <div className="p-4 text-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Contact info */}
          {contact && !isLoadingContact && (
            <div>
              {/* Avatar and name */}
              <div className="border-b border-border-subtle px-4 py-4">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-white">
                    {getInitials(contact.display_name, contact.email)}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {contact.display_name || contact.email}
                  </h3>
                  {contact.job_title && (
                    <p className="mt-0.5 text-xs text-text-secondary">{contact.job_title}</p>
                  )}
                  {contact.company && (
                    <p className="mt-0.5 text-xs text-text-tertiary">{contact.company}</p>
                  )}
                </div>
              </div>

              {/* Contact details */}
              <div className="border-b border-border-subtle px-4 py-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Contact Details
                </h4>
                <div className="space-y-2">
                  {/* Email */}
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="mt-0.5 flex-shrink-0 text-text-tertiary" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-xs text-text-primary">{contact.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  {(contact.mobile_phone || contact.business_phone || contact.phone) && (
                    <div className="flex items-start gap-2">
                      <Phone size={14} className="mt-0.5 flex-shrink-0 text-text-tertiary" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        {contact.mobile_phone && (
                          <p className="text-xs text-text-primary">
                            {contact.mobile_phone} <span className="text-text-tertiary">(Mobile)</span>
                          </p>
                        )}
                        {contact.business_phone && (
                          <p className="text-xs text-text-primary">
                            {contact.business_phone} <span className="text-text-tertiary">(Work)</span>
                          </p>
                        )}
                        {contact.phone && !contact.mobile_phone && !contact.business_phone && (
                          <p className="text-xs text-text-primary">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Company */}
                  {contact.company && (
                    <div className="flex items-start gap-2">
                      <Building2 size={14} className="mt-0.5 flex-shrink-0 text-text-tertiary" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-primary">{contact.company}</p>
                        {contact.job_title && (
                          <p className="text-xs text-text-tertiary">{contact.job_title}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {(contact.city || contact.state || contact.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0 text-text-tertiary" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-primary">
                          {[contact.city, contact.state, contact.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {contact.notes && (
                <div className="border-b border-border-subtle px-4 py-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Notes
                  </h4>
                  <p className="text-xs text-text-secondary">{contact.notes}</p>
                </div>
              )}

              {/* Email history */}
              <div className="px-4 py-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Email History ({emailHistory.length})
                </h4>

                {isLoadingHistory && (
                  <div className="flex h-20 items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-text-tertiary" strokeWidth={1.5} />
                  </div>
                )}

                {!isLoadingHistory && emailHistory.length === 0 && (
                  <div className="py-6 text-center">
                    <Mail size={24} className="mx-auto mb-2 text-text-tertiary" strokeWidth={1} />
                    <p className="text-xs text-text-tertiary">No email history</p>
                  </div>
                )}

                {!isLoadingHistory && emailHistory.length > 0 && (
                  <div className="space-y-2">
                    {emailHistory.map((email) => (
                      <div
                        key={email.id}
                        className="cursor-pointer rounded-md border border-border-subtle bg-surface-secondary p-2 transition-colors hover:bg-surface-hover"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h5 className="flex-1 truncate text-xs font-medium text-text-primary">
                            {email.subject || "(No subject)"}
                          </h5>
                          {!email.is_read && (
                            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                          )}
                        </div>
                        {email.preview && (
                          <p className="mb-1 line-clamp-2 text-xs text-text-tertiary">
                            {email.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                          <Calendar size={10} strokeWidth={1.5} />
                          <span>
                            {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                          </span>
                          {email.has_attachments && (
                            <span className="ml-auto">📎</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
