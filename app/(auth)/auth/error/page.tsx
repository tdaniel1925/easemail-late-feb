'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function AuthErrorPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorContent = () => {
    switch (error) {
      case 'invitation_required':
        return {
          title: 'Invitation Required',
          message: 'EaseMail is currently invitation-only. To get started, you need to receive an invitation from your organization admin.',
          icon: <Mail className="w-12 h-12 text-accent" strokeWidth={1.5} />,
          details: [
            'If you believe your organization is already using EaseMail, ask your admin to send you an invitation.',
            'If you\'re interested in bringing EaseMail to your organization, please contact us for more information.',
          ],
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There was a problem with the authentication configuration.',
          icon: <AlertCircle className="w-12 h-12 text-red-500" strokeWidth={1.5} />,
          details: [
            'This is likely a temporary issue. Please try again later.',
            'If the problem persists, contact support.',
          ],
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          icon: <AlertCircle className="w-12 h-12 text-red-500" strokeWidth={1.5} />,
          details: [
            'Your account may not have the necessary permissions.',
            'Contact your administrator if you believe this is an error.',
          ],
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'The verification link has expired or has already been used.',
          icon: <AlertCircle className="w-12 h-12 text-red-500" strokeWidth={1.5} />,
          details: [
            'Please request a new verification link.',
            'Make sure you\'re using the most recent link sent to your email.',
          ],
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'Something went wrong during the authentication process.',
          icon: <AlertCircle className="w-12 h-12 text-red-500" strokeWidth={1.5} />,
          details: [
            'This may be a temporary issue. Please try signing in again.',
            'If the problem persists, contact support.',
          ],
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border-default bg-surface-secondary p-8 shadow-sm">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {errorContent.icon}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-primary text-center mb-3">
            {errorContent.title}
          </h1>

          {/* Message */}
          <p className="text-sm text-text-secondary text-center mb-6">
            {errorContent.message}
          </p>

          {/* Details */}
          <div className="rounded-md bg-surface-tertiary border border-border-subtle p-4 mb-6">
            <ul className="space-y-2 text-sm text-text-secondary">
              {errorContent.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-text-tertiary mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Back to Sign In
            </Link>

            {error === 'invitation_required' && (
              <a
                href="mailto:support@easemail.com?subject=EaseMail%20Access%20Request"
                className="flex items-center justify-center gap-2 w-full rounded-md border border-border-default bg-surface-primary px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Mail size={16} strokeWidth={2} />
                Request Access
              </a>
            )}
          </div>

          {/* Support */}
          <div className="mt-6 text-center">
            <p className="text-xs text-text-tertiary">
              Need help?{' '}
              <a
                href="mailto:support@easemail.com"
                className="text-accent hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the page content in Suspense to handle useSearchParams()
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <div className="text-text-secondary">Loading...</div>
      </div>
    }>
      <AuthErrorPageContent />
    </Suspense>
  );
}
