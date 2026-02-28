'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Building2, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    organizationName: '',
    domain: '',
    ownerEmail: '',
    ownerName: '',
    plan: 'professional' as 'free' | 'professional' | 'enterprise',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create organization');
        setIsLoading(false);
        return;
      }

      setSuccess(data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      setIsLoading(false);
    }
  };

  const handleCopyInviteUrl = () => {
    if (success?.invitation?.invite_url) {
      navigator.clipboard.writeText(success.invitation.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-primary">
        {/* Header */}
        <div className="border-b border-border-default bg-surface-secondary">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <Building2 className="w-6 h-6 text-green-600" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  Organization Created Successfully!
                </h2>
                <p className="text-sm text-green-700">
                  The organization has been set up and the owner invitation has been created.
                </p>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className="rounded-lg border border-border-default bg-surface-secondary p-6 mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Organization Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-text-secondary">Name</dt>
                <dd className="text-sm font-medium text-text-primary">{success.tenant.display_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Domain</dt>
                <dd className="text-sm font-medium text-text-primary">{success.tenant.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Plan</dt>
                <dd className="text-sm font-medium text-text-primary capitalize">{success.tenant.plan}</dd>
              </div>
            </dl>
          </div>

          {/* Invitation Details */}
          <div className="rounded-lg border border-border-default bg-surface-secondary p-6 mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Owner Invitation</h3>
            <dl className="space-y-3 mb-4">
              <div>
                <dt className="text-xs text-text-secondary">Email</dt>
                <dd className="text-sm font-medium text-text-primary">{success.invitation.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Role</dt>
                <dd className="text-sm font-medium text-text-primary capitalize">{success.invitation.role}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Expires</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {new Date(success.invitation.expires_at).toLocaleString()}
                </dd>
              </div>
            </dl>

            {/* Invitation URL */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Invitation URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={success.invitation.invite_url}
                  readOnly
                  className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary font-mono"
                />
                <button
                  onClick={handleCopyInviteUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check size={16} strokeWidth={2} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} strokeWidth={2} />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-text-tertiary">
                Send this URL to the organization owner so they can accept the invitation and set up their account.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/admin/organizations/new"
              onClick={() => {
                setSuccess(null);
                setFormData({
                  organizationName: '',
                  domain: '',
                  ownerEmail: '',
                  ownerName: '',
                  plan: 'professional',
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              Create Another Organization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-surface-secondary">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Create New Organization</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Set up a new organization and send the first owner invitation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-lg border border-border-default bg-surface-secondary p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Organization Information</h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                required
                placeholder="Smith & Associates"
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Domain
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                required
                placeholder="smithlaw.com"
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Users with emails from this domain will automatically join this organization
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="free">Free (5 users)</option>
                <option value="professional">Professional (50 users)</option>
                <option value="enterprise">Enterprise (500 users)</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-surface-secondary p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Owner Information</h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Owner Email
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value.toLowerCase() })}
                required
                placeholder="owner@smithlaw.com"
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Owner Name (Optional)
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Mr. Smith"
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 size={16} strokeWidth={2} />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
