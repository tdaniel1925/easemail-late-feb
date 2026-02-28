import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

/**
 * Initiate OAuth flow to connect additional Microsoft account
 * This is for users who are already logged in and want to add another account
 */
export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookieHeader = request.headers.get('cookie') || '';

    console.log('Cookie header:', cookieHeader.substring(0, 100));

    // Call the session endpoint with the same cookies
    const sessionRes = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!sessionRes.ok) {
      console.error('Failed to get session from auth endpoint:', sessionRes.status);
      return NextResponse.json({ error: 'Not authenticated. Please sign in first.' }, { status: 401 });
    }

    const session = await sessionRes.json();

    console.log('Session from endpoint:', {
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      email: session?.user?.email,
    });

    if (!session || !session.user?.email) {
      console.error('Authentication failed - no valid session');
      return NextResponse.json({ error: 'Not authenticated. Please sign in first.' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get user by email from session
    console.log('Looking up user by email:', session.user.email);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.error('User lookup failed:', {
        email: session.user.email,
        error: userError,
        message: userError?.message,
        details: userError?.details,
      });
      return NextResponse.json({ error: 'User not found in database. Please ensure your account is properly set up.' }, { status: 404 });
    }

    console.log('User found:', user.id);

    // Get tenant info to check account limits
    const { data: easemailUser, error: easemailUserError } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', user.id)
      .single();

    if (easemailUserError || !easemailUser) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    // Check current account count
    const { count: accountCount, error: countError } = await supabase
      .from('connected_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'disconnected');

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to check account limit' },
        { status: 500 }
      );
    }

    // Enforce account limits per plan
    const limits: Record<string, number> = {
      starter: 2,
      professional: 5,
      business: 15,
      enterprise: 100,
    };

    const plan = easemailUser.tenants?.plan || 'starter';
    const limit = limits[plan] || 2;

    if ((accountCount || 0) >= limit) {
      return NextResponse.json(
        {
          error: `Account limit reached. Your ${plan} plan allows up to ${limit} connected accounts.`,
          limit,
          current: accountCount,
        },
        { status: 403 }
      );
    }

    // Build Microsoft OAuth URL
    const clientId = process.env.AZURE_AD_CLIENT_ID!;
    const tenantId = process.env.AZURE_AD_TENANT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/accounts/connect/callback`;

    const scopes = [
      'openid',
      'profile',
      'email',
      'offline_access',
      'User.Read',
      'Mail.ReadWrite',
      'Mail.Send',
      'Calendars.ReadWrite',
      'Chat.ReadWrite',
      'Contacts.Read',
      'Presence.Read',
      'ChannelMessage.Read.All',
      'OnlineMeetings.ReadWrite',
    ].join(' ');

    // Store user ID in state parameter for callback validation
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Use 'common' endpoint for multi-tenant support (any Microsoft account)
    const authUrl = new URL(
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
    );

    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account'); // Force account picker

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Connect account initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}
