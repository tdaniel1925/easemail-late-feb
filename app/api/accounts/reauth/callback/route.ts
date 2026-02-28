import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tokenService } from '@/lib/graph/token-service';

/**
 * OAuth callback for reauthenticating existing accounts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth reauth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=missing_parameters`
      );
    }

    // Validate state parameter
    let stateData: { accountId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=invalid_state`
      );
    }

    // Check state timestamp (must be < 10 minutes old)
    if (Date.now() - stateData.timestamp > 600000) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=state_expired`
      );
    }

    const supabase = await createClient();

    // Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', stateData.accountId)
      .single();

    if (accountError || !account) {
      console.error('Account lookup failed:', {
        accountId: stateData.accountId,
        error: accountError,
      });
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=account_not_found`
      );
    }

    // Exchange code for tokens using direct OAuth2 endpoint
    // Use 'common' endpoint for multi-tenant support (any Microsoft account)
    const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

    const tokenParams = new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/accounts/reauth/callback`,
      grant_type: 'authorization_code',
      scope: 'User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite Chat.ReadWrite Contacts.Read Presence.Read ChannelMessage.Read.All OnlineMeetings.ReadWrite offline_access',
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      throw new Error(errorData.error_description || 'Failed to acquire tokens');
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to acquire tokens');
    }

    // Store new tokens
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    await tokenService.storeTokens(account.id, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scopes: tokens.scope?.split(' ') || [],
    });

    // Update account status back to active
    await supabase
      .from('connected_accounts')
      .update({
        status: 'active',
        status_message: null,
        error_count: 0,
        last_error_at: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    // Reset sync state to trigger fresh sync
    await supabase
      .from('sync_state')
      .update({
        status: 'pending',
        error_message: null,
        next_sync_at: new Date().toISOString(),
      })
      .eq('account_id', account.id);

    console.log(`Account reauthenticated successfully: ${account.email}`);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=accounts&success=account_reauthenticated`
    );
  } catch (error: any) {
    console.error('Reauth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=accounts&error=${encodeURIComponent(
        error.message || 'reauth_failed'
      )}`
    );
  }
}
