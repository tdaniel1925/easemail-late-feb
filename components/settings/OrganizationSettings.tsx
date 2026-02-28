'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Plus, Mail, X, Loader2, Crown, Shield, User, Trash2, Copy, Check } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  created_at: string;
}

export function OrganizationSettings() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchMembers();
      fetchInvitations();
    }
  }, [session]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/organization/members?userEmail=${session?.user?.email}`);
      const data = await response.json();
      if (response.ok) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/invitations?userEmail=${session?.user?.email}`);
      const data = await response.json();
      if (response.ok) {
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Cancel this invitation?')) return;

    try {
      const response = await fetch(`/api/invitations?id=${invitationId}&userEmail=${session?.user?.email}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={14} className="text-yellow-600" strokeWidth={2} />;
      case 'admin':
        return <Shield size={14} className="text-blue-600" strokeWidth={2} />;
      default:
        return <User size={14} className="text-text-tertiary" strokeWidth={2} />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors]}`}>
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const currentUser = members.find(m => m.email === session?.user?.email);
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Organization</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your team members and invitations
        </p>
      </div>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Team Members</h3>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              <Plus size={16} strokeWidth={2} />
              Invite Member
            </button>
          )}
        </div>

        <div className="rounded-lg border border-border-default bg-surface-secondary divide-y divide-border-subtle">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center">
                  <User size={20} className="text-text-tertiary" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {member.display_name}
                    </span>
                    {member.email === session?.user?.email && (
                      <span className="text-xs text-text-tertiary">(You)</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getRoleBadge(member.role)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {isOwnerOrAdmin && invitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Pending Invitations</h3>
          <div className="rounded-lg border border-border-default bg-surface-secondary divide-y divide-border-subtle">
            {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center">
                    <Mail size={20} className="text-text-tertiary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text-primary">{invitation.email}</span>
                    <p className="text-xs text-text-secondary">
                      Invited {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(invitation.role)}
                  <button
                    onClick={() => handleCopyInviteLink(invitation.token)}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors"
                    title="Copy invitation link"
                  >
                    {copiedToken === invitation.token ? (
                      <Check size={16} className="text-green-600" strokeWidth={2} />
                    ) : (
                      <Copy size={16} strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="p-2 text-text-secondary hover:text-red-600 hover:bg-surface-hover rounded-md transition-colors"
                    title="Cancel invitation"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchInvitations();
          }}
          userEmail={session?.user?.email || ''}
        />
      )}
    </div>
  );
}

interface InviteModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

function InviteModal({ onClose, onSuccess, userEmail }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          role,
          userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invitation');
        setIsSubmitting(false);
        return;
      }

      // Show success and copy link
      const inviteUrl = `${window.location.origin}/accept-invite?token=${data.invitation.token}`;
      navigator.clipboard.writeText(inviteUrl);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-surface-secondary p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Invite Team Member</h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
              className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="member">Member - Can use all features</option>
              <option value="admin">Admin - Can manage team and settings</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} strokeWidth={2} />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-text-tertiary">
          The invitation link will be copied to your clipboard. Share it with the person you're inviting.
        </p>
      </div>
    </div>
  );
}
