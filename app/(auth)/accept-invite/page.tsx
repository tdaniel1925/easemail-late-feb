'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Mail, Check, X, Loader2 } from 'lucide-react';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      // Store token in sessionStorage for auth callback
      sessionStorage.setItem('invitation_token', token);
      fetchInvitation();
    } else {
      setError('Invalid invitation link');
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/verify?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired invitation');
        return;
      }

      setInvitation(data.invitation);
    } catch (err: any) {
      setError('Failed to load invitation');
      console.error('Error fetching invitation:', err);
    }
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Redirect to sign in - auth.ts will handle the invitation
      await signIn('microsoft-entra-id', { callbackUrl: '/mail' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <X size={32} className="text-red-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Invalid Invitation</h1>
            <p className="mt-2 text-sm text-text-secondary">{error}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors font-medium"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <Loader2 size={32} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <Mail size={32} className="text-accent" strokeWidth={1.5} />
          <span className="text-2xl font-bold text-text-primary">EaseMail</span>
        </div>

        {/* Invitation Card */}
        <div className="rounded-lg border border-border-default bg-surface-secondary p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-tertiary mb-6">
            <Check size={32} className="text-accent" strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
            You've been invited!
          </h1>

          <p className="text-sm text-text-secondary text-center mb-6">
            {invitation.inviter_name || 'Someone'} has invited you to join{' '}
            <span className="font-semibold text-text-primary">
              {invitation.tenant_name}
            </span>{' '}
            on EaseMail.
          </p>

          <div className="rounded-md bg-surface-primary p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">Email:</span>
              <span className="font-medium text-text-primary">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-text-tertiary">Role:</span>
              <span className="font-medium text-text-primary capitalize">
                {invitation.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <span>Accept & Sign In with Microsoft</span>
              </>
            )}
          </button>

          <p className="text-xs text-text-tertiary text-center mt-4">
            By accepting, you agree to join this organization and use EaseMail's services.
          </p>
        </div>

        <p className="text-xs text-text-tertiary text-center">
          Didn't expect this invitation?{' '}
          <a href="#" className="text-text-secondary hover:text-text-primary underline">
            Report this
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <Loader2 size={32} className="animate-spin text-text-tertiary" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
