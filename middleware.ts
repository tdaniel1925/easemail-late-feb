import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Allow test mode bypass in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const testMode = request.cookies.get('test-mode')?.value === 'true';
    if (testMode) {
      console.log('[Middleware] Test mode enabled - bypassing auth');
      return NextResponse.next();
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
