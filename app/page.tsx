import Link from "next/link";
import { Mail, Calendar, Users, Sparkles, Shield, Zap, ArrowRight, Check } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Navigation */}
      <nav className="border-b border-border-default bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={24} className="text-accent" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-text-primary">EaseMail</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-tertiary rounded-full text-xs text-text-secondary border border-border-subtle">
            <Sparkles size={12} className="text-accent" strokeWidth={2} />
            <span>AI-Powered Email Management</span>
          </div>

          <h1 className="text-5xl font-bold text-text-primary leading-tight">
            Professional Email for<br />Modern Teams
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Connect your Microsoft 365 accounts, manage multiple inboxes, collaborate with your team,
            and let AI help you work smarter—all in one beautiful interface.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors font-medium"
            >
              Sign in with Microsoft
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link
              href="#features"
              className="px-6 py-3 bg-surface-tertiary text-text-primary rounded-md hover:bg-surface-hover transition-colors font-medium"
            >
              Learn More
            </Link>
          </div>

          <p className="text-xs text-text-tertiary">
            Free 14-day trial • No credit card required
          </p>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 rounded-lg border border-border-default bg-surface-secondary p-8 shadow-xl">
          <div className="aspect-video rounded-md bg-surface-tertiary flex items-center justify-center">
            <Mail size={64} className="text-text-tertiary" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 border-t border-border-default">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-text-primary">Everything you need</h2>
          <p className="text-text-secondary">Powerful features to help you manage email efficiently</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <div className="w-12 h-12 rounded-md bg-surface-tertiary flex items-center justify-center mb-4">
              <Mail size={24} className="text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Unified Inbox</h3>
            <p className="text-sm text-text-secondary">
              Connect multiple Microsoft 365 accounts and manage all your emails from one place.
              Switch between accounts seamlessly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <div className="w-12 h-12 rounded-md bg-surface-tertiary flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">AI Assistant</h3>
            <p className="text-sm text-text-secondary">
              Get AI-powered email summaries, smart replies, priority sorting, and intelligent
              categorization to save hours every week.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <div className="w-12 h-12 rounded-md bg-surface-tertiary flex items-center justify-center mb-4">
              <Users size={24} className="text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Team Collaboration</h3>
            <p className="text-sm text-text-secondary">
              Shared inboxes, team assignments, internal notes, and collaborative workflows for
              better teamwork.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <div className="w-12 h-12 rounded-md bg-surface-tertiary flex items-center justify-center mb-4">
              <Calendar size={24} className="text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Calendar & Contacts</h3>
            <p className="text-sm text-text-secondary">
              Integrated calendar for scheduling meetings and contacts management for tracking
              relationships—all in one place.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <div className="w-12 h-12 rounded-md bg-surface-tertiary flex items-center justify-center mb-4">
              <Zap size={24} className="text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Lightning Fast</h3>
            <p className="text-sm text-text-secondary">
              Keyboard shortcuts, instant search, offline support, and optimized performance make
              email management a breeze.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <div className="w-12 h-12 rounded-md bg-surface-tertiary flex items-center justify-center mb-4">
              <Shield size={24} className="text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Enterprise Security</h3>
            <p className="text-sm text-text-secondary">
              SOC 2 compliant, end-to-end encryption, SSO support, and granular permissions to keep
              your data safe.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-border-default">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-text-primary">Simple, transparent pricing</h2>
          <p className="text-text-secondary">Choose the plan that fits your team</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Starter Plan */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Starter</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-text-primary">$0</span>
              <span className="text-text-secondary text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>1 user</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>1 email account</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Basic features</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full px-4 py-2 bg-surface-tertiary text-text-primary rounded-md hover:bg-surface-hover transition-colors text-sm font-medium text-center"
            >
              Get Started
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="p-6 rounded-lg border-2 border-accent bg-surface-secondary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
              Popular
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Professional</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-text-primary">$12</span>
              <span className="text-text-secondary text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>1 user</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>3 email accounts</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>AI features</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Priority support</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm font-medium text-center"
            >
              Get Started
            </Link>
          </div>

          {/* Team Plan */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Team</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-text-primary">$49</span>
              <span className="text-text-secondary text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Up to 20 users</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>5 accounts per user</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Shared inboxes</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>CRM integration</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full px-4 py-2 bg-surface-tertiary text-text-primary rounded-md hover:bg-surface-hover transition-colors text-sm font-medium text-center"
            >
              Get Started
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-6 rounded-lg border border-border-default bg-surface-secondary">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Enterprise</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-text-primary">Custom</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Unlimited users</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Unlimited accounts</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>White-label branding</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full px-4 py-2 bg-surface-tertiary text-text-primary rounded-md hover:bg-surface-hover transition-colors text-sm font-medium text-center"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-border-default">
        <div className="rounded-lg bg-surface-secondary border border-border-default p-12 text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to transform your email workflow?
          </h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already made the switch to EaseMail.
            Start your free trial today—no credit card required.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors font-medium"
          >
            Get Started Free
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={20} className="text-accent" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-text-primary">EaseMail</span>
            </div>
            <p className="text-xs text-text-tertiary">
              © 2026 EaseMail. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
