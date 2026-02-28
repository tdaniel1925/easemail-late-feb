"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, User, Mail, Phone, Building2, MapPin, Calendar, Heart, Loader2 } from "lucide-react";
import { useContactsStore } from "@/stores/contacts-store";
import { useAccountStore } from "@/stores/account-store";
import { cn } from "@/lib/utils";
import type { ContactFormData } from "@/types/contacts";

export function ContactEditorModal() {
  const { editorMode, editingContactId, closeEditor, getContactById } = useContactsStore();
  const { activeAccountId } = useAccountStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - all fields from migration 004
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
  });

  const contact = editingContactId ? getContactById(editingContactId) : null;
  const isOpen = !!editorMode;
  const isEditMode = editorMode === 'edit';

  // Load contact data when editing
  useEffect(() => {
    if (isEditMode && contact) {
      setFormData({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        middle_name: contact.middle_name || "",
        nickname: contact.nickname || "",
        display_name: contact.display_name || "",
        email: contact.email,
        mobile_phone: contact.mobile_phone || "",
        home_phone: contact.home_phone || "",
        business_phone: contact.business_phone || "",
        im_address: contact.im_address || "",
        company: contact.company || "",
        job_title: contact.job_title || "",
        department: contact.department || "",
        office_location: contact.office_location || "",
        profession: contact.profession || "",
        street_address: contact.street_address || "",
        city: contact.city || "",
        state: contact.state || "",
        postal_code: contact.postal_code || "",
        country: contact.country || "",
        birthday: contact.birthday || "",
        anniversary: contact.anniversary || "",
        spouse_name: contact.spouse_name || "",
        notes: contact.notes || "",
        personal_notes: contact.personal_notes || "",
        categories: contact.categories || [],
        is_favorite: contact.is_favorite || false,
      });
    } else if (editorMode === 'create') {
      // Reset form for new contact
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
      });
    }
  }, [editorMode, contact, isEditMode]);

  const handleClose = () => {
    closeEditor();
  };

  const handleChange = (field: keyof ContactFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAccountId) {
      setError('No account selected');
      return;
    }

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode && contact) {
        // Update existing contact
        const response = await fetch(`/api/contacts/${contact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update contact');
        }
      } else {
        // Create new contact
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: activeAccountId,
            ...formData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create contact');
        }
      }

      handleClose();
      // Trigger refresh via auto-sync
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving contact:', error);
      setError(error.message || 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2 bg-surface-primary border border-border-default rounded-lg shadow-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {isEditMode ? 'Edit Contact' : 'New Contact'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 hover:bg-bg-hover transition-colors">
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(85vh-80px)]">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                  <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
                </div>
              )}

              {/* Name Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <User className="h-4 w-4" />
                  <span>Name</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      className={inputClassName}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      className={inputClassName}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name || ""}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    className={inputClassName}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Mail className="h-4 w-4" />
                  <span>Contact Info</span>
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={inputClassName}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={formData.mobile_phone || ""}
                      onChange={(e) => handleChange('mobile_phone', e.target.value)}
                      className={inputClassName}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Business</label>
                    <input
                      type="tel"
                      value={formData.business_phone || ""}
                      onChange={(e) => handleChange('business_phone', e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Home</label>
                    <input
                      type="tel"
                      value={formData.home_phone || ""}
                      onChange={(e) => handleChange('home_phone', e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Building2 className="h-4 w-4" />
                  <span>Professional</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company || ""}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Job Title</label>
                    <input
                      type="text"
                      value={formData.job_title || ""}
                      onChange={(e) => handleChange('job_title', e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <span>Notes</span>
                </div>
                <div>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className={cn(inputClassName, "min-h-[80px] resize-y")}
                    placeholder="Add notes about this contact..."
                  />
                </div>
              </div>

              {/* Favorite */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_favorite"
                  checked={formData.is_favorite || false}
                  onChange={(e) => handleChange('is_favorite', e.target.checked)}
                  className="h-4 w-4 rounded border-border-default text-accent focus:ring-2 focus:ring-accent"
                />
                <label htmlFor="is_favorite" className="text-sm text-text-secondary cursor-pointer">
                  Mark as favorite
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border-default px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded hover:bg-bg-hover text-text-secondary transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : isEditMode ? 'Update Contact' : 'Create Contact'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const inputClassName = cn(
  "w-full px-3 py-2 text-sm",
  "bg-bg-secondary border border-border-default rounded",
  "placeholder:text-text-tertiary",
  "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
  "transition-colors"
);
