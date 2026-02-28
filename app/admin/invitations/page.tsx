'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Loader2, Mail, Clock, XCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Invitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  created_at: string;
  tenant: {
    id: string;
    name: string;
    display_name: string;
  };
  invited_by_user?: {
    display_name: string;
    email: string;
  };
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'expired' | 'cancelled' | 'all'>('pending');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [statusFilter]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/all-invitations?status=${statusFilter}`);
      const data = await response.json();

      if (response.ok) {
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      pending: <Clock size={12} strokeWidth={2} />,
      accepted: <CheckCircle size={12} strokeWidth={2} />,
      expired: <XCircle size={12} strokeWidth={2} />,
      cancelled: <XCircle size={12} strokeWidth={2} />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <Loader2 size={32} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Invitations</h1>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage all invitations across all organizations
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            {['pending', 'accepted', 'expired', 'cancelled', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 text-sm font-medium border transition-colors first:rounded-l-md last:rounded-r-md ${
                  statusFilter === status
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface-secondary text-text-primary border-border-default hover:bg-surface-hover'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Invitations Table */}
        {invitations.length === 0 ? (
          <div className="rounded-lg border border-border-default bg-surface-secondary p-12 text-center">
            <Mail className="w-12 h-12 text-text-tertiary mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No {statusFilter !== 'all' ? statusFilter : ''} invitations
            </h3>
            <p className="text-sm text-text-secondary">
              {statusFilter === 'pending' ? 'All invitations have been processed.' : 'Try changing the filter to see other invitations.'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border-default bg-surface-secondary overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-tertiary border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{invitation.email}</div>
                        {invitation.invited_by_user && (
                          <div className="text-xs text-text-secondary">
                            by {invitation.invited_by_user.display_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {invitation.tenant.display_name}
                        </div>
                        <div className="text-xs text-text-secondary">{invitation.tenant.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(invitation.role)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(invitation.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-secondary">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => handleCopyInviteLink(invitation.token)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-tertiary rounded transition-colors"
                          title="Copy invitation link"
                        >
                          {copiedToken === invitation.token ? (
                            <>
                              <Check size={14} className="text-green-600" strokeWidth={2} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} strokeWidth={1.5} />
                              Copy Link
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
