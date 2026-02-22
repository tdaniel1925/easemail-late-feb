import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiate reauth flow for an account that needs reauthentication
 * Similar to connect flow but updates existing account instead of creating new one
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const supabase = await createClient();

    // Verify account exists and belongs to user
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Build Microsoft OAuth URL
    const clientId = process.env.AZURE_AD_CLIENT_ID!;
    const tenantId = process.env.AZURE_AD_TENANT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/accounts/reauth/callback`;

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

    // Store account ID in state for callback
    const state = Buffer.from(
      JSON.stringify({
        accountId: account.id,
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
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to ensure fresh tokens
    authUrl.searchParams.set('login_hint', account.email); // Pre-fill with account email

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });
  } catch (error: any) {
    console.error('Reauth initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate reauth' },
      { status: 500 }
    );
  }
}
