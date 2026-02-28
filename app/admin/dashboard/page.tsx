'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Mail, Plus, LogOut, Loader2, Crown, Shield, User } from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  display_name: string;
  plan: 'free' | 'professional' | 'enterprise';
  max_seats: number;
  user_count: number;
  pending_invitations: number;
  created_at: string;
}

interface Stats {
  total_organizations: number;
  total_users: number;
  pending_invitations: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setOrganizations(data.organizations || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800 border-gray-200',
      professional: 'bg-blue-100 text-blue-800 border-blue-200',
      enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[plan as keyof typeof colors]}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" strokeWidth={2} />
              <div>
                <h1 className="text-xl font-bold text-text-primary">Admin Dashboard</h1>
                <p className="text-xs text-text-secondary">EaseMail Platform Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg border border-border-default bg-surface-secondary p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-3">
                  <Building2 className="w-6 h-6 text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Organizations</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.total_organizations}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border-default bg-surface-secondary p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-3">
                  <Users className="w-6 h-6 text-green-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Users</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.total_users}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border-default bg-surface-secondary p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-3">
                  <Mail className="w-6 h-6 text-orange-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Pending Invitations</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.pending_invitations}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Organizations</h2>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/invitations"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary border border-border-default rounded-md hover:bg-surface-hover transition-colors"
            >
              <Mail size={16} strokeWidth={2} />
              Manage Invitations
            </Link>
            <Link
              href="/admin/organizations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              <Plus size={16} strokeWidth={2} />
              New Organization
            </Link>
          </div>
        </div>

        {/* Organizations List */}
        {organizations.length === 0 ? (
          <div className="rounded-lg border border-border-default bg-surface-secondary p-12 text-center">
            <Building2 className="w-12 h-12 text-text-tertiary mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No organizations yet</h3>
            <p className="text-sm text-text-secondary mb-4">
              Create your first organization to get started
            </p>
            <Link
              href="/admin/organizations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              <Plus size={16} strokeWidth={2} />
              Create Organization
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-border-default bg-surface-secondary overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-tertiary border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Pending Invites
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {org.display_name}
                        </div>
                        <div className="text-xs text-text-secondary">{org.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getPlanBadge(org.plan)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {org.user_count} / {org.max_seats}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">{org.pending_invitations}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-secondary">
                        {new Date(org.created_at).toLocaleDateString()}
                      </div>
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
