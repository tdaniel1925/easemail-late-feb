"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Settings as SettingsIcon, User, Palette, Bell, X, FileSignature, Users } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { SignatureSettings } from "@/components/settings/SignatureSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "general");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    // Handle URL parameters for error/success messages
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error) {
      const errorMessages: Record<string, string> = {
        'user_not_found': 'User session not found. Please try logging in again.',
        'account_not_found': 'Account not found. Please try again.',
        'state_expired': 'Authorization expired. Please try again.',
        'invalid_state': 'Invalid authorization state. Please try again.',
        'account_already_connected': 'This account is already connected.',
        'missing_parameters': 'Missing required parameters. Please try again.',
        'connection_failed': 'Failed to connect account. Please try again.',
        'reauth_failed': 'Failed to re-authenticate. Please try again.',
      };
      setNotification({
        type: 'error',
        message: errorMessages[error] || decodeURIComponent(error),
      });
    } else if (success) {
      const successMessages: Record<string, string> = {
        'account_connected': 'Account connected successfully!',
        'account_reauthenticated': 'Account re-authenticated successfully!',
      };
      setNotification({
        type: 'success',
        message: successMessages[success] || decodeURIComponent(success),
      });
    }

    // Auto-dismiss notifications after 5 seconds
    if (error || success) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "accounts", label: "Accounts", icon: User },
    { id: "organization", label: "Organization", icon: Users },
    { id: "signatures", label: "Signatures", icon: FileSignature },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-surface-primary">
      {/* Settings Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border-default bg-surface-secondary">
        <div className="px-4 py-6">
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
          <p className="mt-1 text-xs text-text-tertiary">Manage your preferences</p>
        </div>

        <nav className="px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-surface-selected text-text-primary font-medium"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Notification Banner */}
        {notification && (
          <div className="mx-auto max-w-3xl px-8 pt-6">
            <div className={`rounded-lg p-4 flex items-start justify-between ${
              notification.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`text-sm font-medium ${
                notification.type === 'error' ? 'text-red-800' : 'text-green-800'
              }`}>
                {notification.message}
              </p>
              <button
                onClick={() => setNotification(null)}
                className={`ml-4 ${
                  notification.type === 'error' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl px-8 py-8">
          {activeTab === "general" && <GeneralSettings />}
          {activeTab === "accounts" && <AccountSettings />}
          {activeTab === "organization" && <OrganizationSettings />}
          {activeTab === "signatures" && <SignatureSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { timezone, setTimezone, dateFormat, setDateFormat } = useUIStore();

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const dateFormats = [
    "MM/DD/YYYY",
    "DD/MM/YYYY",
    "YYYY-MM-DD",
    "MMM D, YYYY",
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary">General</h2>
      <p className="mt-1 text-sm text-text-secondary">Configure general application settings</p>

      <div className="mt-6 space-y-6">
        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-text-primary">Timezone</label>
          <p className="mt-1 text-xs text-text-tertiary">
            Select your local timezone for accurate date and time display
          </p>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-2 w-full max-w-md rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-text-primary">Date Format</label>
          <p className="mt-1 text-xs text-text-tertiary">
            Choose how dates are displayed throughout the app
          </p>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="mt-2 w-full max-w-md rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {dateFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account? All synced data will be removed.')) {
      return;
    }

    setDisconnectingId(accountId);
    try {
      const response = await fetch(`/api/accounts/${accountId}/disconnect`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      await fetchAccounts();
    } catch (err: any) {
      setActionError(`Error disconnecting account: ${err.message}`);
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleReauth = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/reauth`);
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      setActionError(`Error re-authenticating: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Accounts</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your connected email accounts</p>
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border-default bg-surface-secondary p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-surface-tertiary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-surface-tertiary" />
                  <div className="h-3 w-32 animate-pulse rounded bg-surface-tertiary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Accounts</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your connected email accounts</p>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Error loading accounts: {error}</p>
          <button
            onClick={fetchAccounts}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary">Accounts</h2>
      <p className="mt-1 text-sm text-text-secondary">Manage your connected email accounts</p>

      {/* Action Error Display */}
      {actionError && (
        <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-border-default bg-surface-secondary p-6 text-center">
            <User size={48} className="mx-auto mb-3 text-text-tertiary" strokeWidth={1} />
            <h3 className="text-sm font-medium text-text-primary">No accounts connected</h3>
            <p className="mt-1 text-xs text-text-tertiary">
              Connect your Microsoft account to get started
            </p>
            <a
              href="/api/accounts/connect"
              className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Connect Account
            </a>
          </div>
        ) : (
          <>
            {accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-lg border border-border-default bg-surface-secondary p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {account.avatar_url ? (
                      <img
                        src={account.avatar_url}
                        alt={account.display_name || account.email}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                        <span className="text-lg font-medium">
                          {(account.display_name || account.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Account Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {account.display_name || account.email}
                      </h3>
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          account.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : account.status === 'auth_failed'
                            ? 'bg-red-100 text-red-800'
                            : account.status === 'syncing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.status === 'active' && '● Active'}
                        {account.status === 'auth_failed' && '● Auth Required'}
                        {account.status === 'syncing' && '● Syncing'}
                        {account.status === 'error' && '● Error'}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-text-secondary truncate">
                      {account.email}
                    </p>

                    {/* Stats */}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      <div>
                        <span className="text-text-tertiary">Messages: </span>
                        <span className="font-medium text-text-primary">{account.messageCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-text-tertiary">Unread: </span>
                        <span className="font-medium text-text-primary">{account.unreadCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-text-tertiary">Folders: </span>
                        <span className="font-medium text-text-primary">{account.folderCount || 0}</span>
                      </div>
                      {account.last_full_sync_at && (
                        <div>
                          <span className="text-text-tertiary">Last synced: </span>
                          <span className="font-medium text-text-primary">
                            {new Date(account.last_full_sync_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {account.status_message && (
                      <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                        {account.status_message}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {account.status === 'auth_failed' && (
                      <button
                        onClick={() => handleReauth(account.id)}
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                      >
                        Re-authenticate
                      </button>
                    )}
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnectingId === account.id}
                      className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                    >
                      {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Another Account */}
            <div className="rounded-lg border border-dashed border-border-default bg-surface-secondary p-4 text-center">
              <p className="text-xs text-text-secondary">Add another email account</p>
              <a
                href="/api/accounts/connect"
                className="mt-2 inline-block rounded-md bg-surface-primary px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
              >
                Connect Account
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme, density, setDensity, readingPanePosition, setReadingPanePosition } = useUIStore();

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary">Appearance</h2>
      <p className="mt-1 text-sm text-text-secondary">Customize how EaseMail looks and feels</p>

      <div className="mt-6 space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-text-primary">Theme</label>
          <p className="mt-1 text-xs text-text-tertiary">
            Choose your preferred color theme
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
            {(["light", "dark", "system"] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex flex-col items-center gap-2 rounded-md border-2 ${
                  theme === themeOption ? "border-accent" : "border-border-default"
                } bg-surface-primary p-4 transition-colors hover:border-accent`}
              >
                <div className={`h-12 w-full rounded ${themeOption === "dark" ? "bg-gray-800" : themeOption === "light" ? "bg-white" : "bg-gradient-to-r from-white to-gray-800"}`} />
                <span className="text-xs font-medium text-text-primary capitalize">{themeOption}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Density */}
        <div>
          <label className="block text-sm font-medium text-text-primary">Density</label>
          <p className="mt-1 text-xs text-text-tertiary">
            Adjust spacing and sizing throughout the interface
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
            {[
              { id: "compact", label: "Compact" },
              { id: "comfortable", label: "Comfortable" },
              { id: "spacious", label: "Spacious" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setDensity(option.id as any)}
                className={`rounded-md border-2 ${
                  density === option.id ? "border-accent" : "border-border-default"
                } bg-surface-primary px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-accent`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Pane */}
        <div>
          <label className="block text-sm font-medium text-text-primary">Reading Pane Position</label>
          <p className="mt-1 text-xs text-text-tertiary">
            Choose where the message viewer appears
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
            {[
              { id: "right", label: "Right" },
              { id: "bottom", label: "Bottom" },
              { id: "hidden", label: "Hidden" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setReadingPanePosition(option.id as any)}
                className={`rounded-md border-2 ${
                  readingPanePosition === option.id ? "border-accent" : "border-border-default"
                } bg-surface-primary px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-accent`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const { notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled } = useUIStore();

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
      <p className="mt-1 text-sm text-text-secondary">Control when and how you receive notifications</p>

      <div className="mt-6 space-y-6">
        {/* Enable Notifications */}
        <div className="flex items-start justify-between">
          <div>
            <label className="block text-sm font-medium text-text-primary">Enable Notifications</label>
            <p className="mt-1 text-xs text-text-tertiary">
              Show desktop notifications for new emails
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-accent"></div>
          </label>
        </div>

        {/* Sound */}
        <div className="flex items-start justify-between">
          <div>
            <label className="block text-sm font-medium text-text-primary">Sound</label>
            <p className="mt-1 text-xs text-text-tertiary">
              Play sound when new emails arrive
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-accent"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
