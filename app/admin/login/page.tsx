'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid API key');
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border-default bg-surface-secondary p-8 shadow-sm">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-accent/10 p-4">
              <Shield className="w-8 h-8 text-accent" strokeWidth={2} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
            Admin Access
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            Enter your admin API key to continue
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder="Enter your admin API key"
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-text-tertiary">
              The admin API key is set in your <code className="bg-surface-tertiary px-1 py-0.5 rounded">.env.local</code> file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
