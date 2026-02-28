'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Mail, Sparkles, Users, Shield, Zap, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('microsoft-entra-id', { callbackUrl: '/mail' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding & Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-secondary flex-col justify-between p-12 border-r border-border-default">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft size={16} className="text-text-tertiary group-hover:text-text-secondary transition-colors" strokeWidth={1.5} />
          <span className="text-sm text-text-tertiary group-hover:text-text-secondary transition-colors">Back to home</span>
        </Link>

        {/* Main Content */}
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Mail size={32} className="text-accent" strokeWidth={1.5} />
            <span className="text-2xl font-bold text-text-primary">EaseMail</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-text-primary leading-tight">
              Professional email<br />made simple
            </h1>
            <p className="text-lg text-text-secondary">
              Connect your Microsoft 365 accounts and experience email management reimagined for modern teams.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 pt-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">AI-Powered Assistance</h3>
                <p className="text-sm text-text-secondary">
                  Smart summaries, priority sorting, and intelligent replies to save you hours every week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">Team Collaboration</h3>
                <p className="text-sm text-text-secondary">
                  Shared inboxes, assignments, and internal notes for seamless teamwork.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">Enterprise Security</h3>
                <p className="text-sm text-text-secondary">
                  SOC 2 compliant with end-to-end encryption and granular permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">Lightning Fast</h3>
                <p className="text-sm text-text-secondary">
                  Keyboard shortcuts, instant search, and optimized performance throughout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-text-tertiary">
          © 2026 EaseMail. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-primary">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Mail size={32} className="text-accent" strokeWidth={1.5} />
            <span className="text-2xl font-bold text-text-primary">EaseMail</span>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-sm text-text-secondary">
              Sign in with your Microsoft account to continue
            </p>
          </div>

          {/* Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              <span className="text-sm font-medium text-text-primary">
                {isLoading ? 'Signing in...' : 'Sign in with Microsoft 365'}
              </span>
            </button>

            <p className="text-xs text-text-tertiary text-center">
              By signing in, you agree to our{' '}
              <a href="#" className="text-text-secondary hover:text-text-primary underline">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-text-secondary hover:text-text-primary underline">
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-primary px-4 text-text-tertiary">
                New to EaseMail?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
            >
              Learn more about our plans →
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 border-t border-border-subtle">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-text-primary">10K+</div>
                <div className="text-xs text-text-tertiary mt-1">Users</div>
              </div>
              <div>
                <div className="text-xl font-bold text-text-primary">99.9%</div>
                <div className="text-xs text-text-tertiary mt-1">Uptime</div>
              </div>
              <div>
                <div className="text-xl font-bold text-text-primary">24/7</div>
                <div className="text-xs text-text-tertiary mt-1">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
