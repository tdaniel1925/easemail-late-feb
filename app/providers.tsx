'use client';

import { SessionProvider } from 'next-auth/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ErrorBoundary>
  );
}
