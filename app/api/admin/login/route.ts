import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminKey, createAdminSession } from '@/lib/admin-auth';

const ADMIN_SESSION_COOKIE = 'admin_session';

// POST /api/admin/login - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    // Verify API key
    if (!verifyAdminKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Create session cookie
    const sessionValue = createAdminSession();
    const cookieStore = await cookies();

    cookieStore.set(ADMIN_SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/login - Admin logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Logout] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
