import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { tokenService } from '@/lib/graph/token-service';

/**
 * OAuth callback for connecting additional Microsoft accounts
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
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/accounts?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/accounts?error=missing_parameters`
      );
    }

    // Validate state parameter
    let stateData: { userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/accounts?error=invalid_state`
      );
    }

    // Check state timestamp (must be < 10 minutes old)
    if (Date.now() - stateData.timestamp > 600000) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/accounts?error=state_expired`
      );
    }

    const supabase = await createClient();

    // Verify user matches state
    const { data: easemailUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', stateData.userId)
      .single();

    if (userError || !easemailUser) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/accounts?error=user_not_found`
      );
    }

    // Exchange code for tokens using direct OAuth2 endpoint
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;

    const tokenParams = new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/accounts/connect/callback`,
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

    // Get user profile from Graph API
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, tokens.access_token);
      },
    });

    const profile = await graphClient.api('/me').get();

    // Check if this account is already connected
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('microsoft_id', profile.id)
      .single();

    if (existingAccount) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/accounts?error=account_already_connected`
      );
    }

    // Get next available color for this user's accounts
    const { data: userAccounts } = await supabase
      .from('connected_accounts')
      .select('account_color')
      .eq('user_id', easemailUser.id);

    const usedColors = new Set(
      userAccounts?.map((a) => a.account_color) || []
    );
    const availableColors = [
      'blue',
      'green',
      'purple',
      'orange',
      'pink',
      'yellow',
      'red',
      'teal',
    ];
    const nextColor =
      availableColors.find((c) => !usedColors.has(c)) || 'blue';

    // Determine account type
    const accountType = profile.mail?.includes('@outlook.com')
      ? 'personal'
      : 'work';

    // Create connected account
    const { data: newAccount, error: accountError } = await supabase
      .from('connected_accounts')
      .insert({
        user_id: easemailUser.id,
        microsoft_id: profile.id,
        email: profile.mail || profile.userPrincipalName,
        display_name: profile.displayName,
        avatar_url: null, // Will be updated by sync job
        tenant_id_ms: null, // Will be populated from token claims if needed
        account_type: accountType,
        account_color: nextColor,
        status: 'active',
        is_default: false, // Additional accounts are never default
      })
      .select()
      .single();

    if (accountError || !newAccount) {
      console.error('Failed to create connected account:', accountError);
      throw new Error('Failed to create connected account');
    }

    // Store tokens
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    await tokenService.storeTokens(newAccount.id, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scopes: tokens.scope?.split(' ') || [],
    });

    // Create initial sync state for folders
    const { data: folders } = await graphClient
      .api('/me/mailFolders')
      .select('id,displayName,parentFolderId')
      .top(50)
      .get();

    if (folders && folders.value) {
      const folderRows = folders.value.map((folder: any) => ({
        account_id: newAccount.id,
        graph_id: folder.id,
        parent_graph_id: folder.parentFolderId,
        display_name: folder.displayName,
        total_count: 0,
        unread_count: 0,
      }));

      await supabase.from('folders').insert(folderRows);
    }

    // Create sync state record
    await supabase.from('sync_state').insert({
      account_id: newAccount.id,
      resource_type: 'messages',
      status: 'pending',
      next_sync_at: new Date().toISOString(),
    });

    // Trigger initial sync via Inngest (if running)
    // This will be handled by the sync job

    console.log(
      `Account connected successfully: ${newAccount.email} (${newAccount.id})`
    );

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/accounts?success=account_connected`
    );
  } catch (error: any) {
    console.error('Connect account callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/accounts?error=${encodeURIComponent(
        error.message || 'connection_failed'
      )}`
    );
  }
}
