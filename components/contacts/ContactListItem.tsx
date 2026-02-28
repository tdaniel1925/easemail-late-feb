"use client";

import { Building2, Mail, Phone, User } from "lucide-react";
import type { Contact } from "@/types/contacts";

interface ContactListItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contactId: string, isCheckbox: boolean) => void;
}

export function ContactListItem({
  contact,
  isSelected,
  onSelect,
}: ContactListItemProps) {
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

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(contact.id, true);
  };

  const handleRowClick = () => {
    onSelect(contact.id, false);
  };

  const displayName = contact.display_name || contact.email;
  const initials = getInitials(contact.display_name, contact.email);

  return (
    <div
      data-testid="contact-item"
      id={`contact-${contact.id}`}
      onClick={handleRowClick}
      className={`group relative flex cursor-pointer gap-3 border-b border-border-subtle px-3 py-2.5 transition-colors ${
        isSelected
          ? "border-l-2 border-l-accent bg-accent-subtle"
          : "border-l-2 border-l-transparent hover:bg-surface-hover"
      }`}
      style={{ minHeight: "64px" }}
    >
      {/* Checkbox - visible on hover or when selected */}
      <div className="flex items-center">
        <input
          data-testid="contact-checkbox"
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxClick}
          onClick={(e) => e.stopPropagation()}
          className={`h-4 w-4 cursor-pointer rounded border-border-default text-accent focus:ring-2 focus:ring-accent ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
      </div>

      {/* Avatar */}
      <div className="flex items-center">
        {contact.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tertiary text-xs font-medium text-text-secondary">
            {initials}
          </div>
        )}
      </div>

      {/* Contact content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {/* Top row: name and company */}
        <div className="flex items-center justify-between gap-2">
          <span data-testid="contact-name" className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-text-primary">
            {displayName}
          </span>
          {contact.company && (
            <div className="flex items-center gap-1 text-xs text-text-tertiary">
              <Building2 size={12} strokeWidth={1.5} />
              <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                {contact.company}
              </span>
            </div>
          )}
        </div>

        {/* Middle row: email */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Mail size={12} strokeWidth={1.5} className="flex-shrink-0 text-text-tertiary" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-text-secondary">
            {contact.email}
          </span>
        </div>

        {/* Bottom row: phone and job title */}
        <div className="flex items-center gap-3 overflow-hidden">
          {contact.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} strokeWidth={1.5} className="flex-shrink-0 text-text-tertiary" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-text-tertiary">
                {contact.phone}
              </span>
            </div>
          )}
          {contact.job_title && (
            <div className="flex items-center gap-1.5">
              <User size={12} strokeWidth={1.5} className="flex-shrink-0 text-text-tertiary" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-text-tertiary">
                {contact.job_title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Source badge */}
      {contact.source && (
        <div className="flex items-center">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
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
      )}
    </div>
  );
}
