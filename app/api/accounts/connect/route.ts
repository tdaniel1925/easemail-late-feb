import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiate OAuth flow to connect additional Microsoft account
 * This is for users who are already logged in and want to add another account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get EaseMail user to check account limits
    const { data: easemailUser, error: easemailUserError } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', user.id)
      .single();

    if (easemailUserError || !easemailUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    const authUrl = new URL(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
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
