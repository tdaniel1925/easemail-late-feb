import { createAdminClient } from '@/lib/supabase/admin';
import { ConfidentialClientApplication } from '@azure/msal-node';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

class TokenService {
  private refreshLocks: Map<string, Promise<string>> = new Map();

  /**
   * Store tokens for an account (encrypted at rest by Supabase)
   */
  async storeTokens(accountId: string, tokens: TokenData): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('account_tokens')
      .upsert({
        account_id: accountId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_type: 'Bearer',
        expires_at: tokens.expiresAt.toISOString(),
        scopes: tokens.scopes,
        last_refreshed_at: new Date().toISOString(),
        refresh_failure_count: 0,
        last_refresh_error: null,
      }, {
        onConflict: 'account_id',
      });

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`);
    }
  }

  /**
   * Get access token for an account
   * Auto-refreshes if token expires in < 5 minutes
   */
  async getAccessToken(accountId: string): Promise<string> {
    const supabase = createAdminClient();

    // Get token from database
    const { data: tokenData, error } = await supabase
      .from('account_tokens')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error || !tokenData) {
      throw new Error('No tokens found for account');
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

    // Token is valid for > 5 minutes, return it
    if (minutesUntilExpiry > 5) {
      return tokenData.access_token;
    }

    // Token expiring soon or expired, refresh it
    console.log(`Token for account ${accountId} expiring in ${minutesUntilExpiry.toFixed(1)} minutes, refreshing...`);
    return this.refreshToken(accountId);
  }

  /**
   * Refresh token using MSAL
   * Uses mutex to prevent concurrent refreshes
   */
  async refreshToken(accountId: string): Promise<string> {
    // Check if refresh already in progress
    const existingRefresh = this.refreshLocks.get(accountId);
    if (existingRefresh) {
      console.log(`Refresh already in progress for ${accountId}, waiting...`);
      return existingRefresh;
    }

    // Create new refresh promise
    const refreshPromise = this._doRefresh(accountId);
    this.refreshLocks.set(accountId, refreshPromise);

    try {
      const token = await refreshPromise;
      return token;
    } finally {
      this.refreshLocks.delete(accountId);
    }
  }

  private async _doRefresh(accountId: string): Promise<string> {
    const supabase = createAdminClient();

    try {
      // Get current tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('account_tokens')
        .select('*')
        .eq('account_id', accountId)
        .single();

      if (tokenError || !tokenData) {
        throw new Error('No tokens found for account');
      }

      // Get account info
      const { data: account, error: accountError } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError || !account) {
        throw new Error('Account not found');
      }

      // Use MSAL to refresh token
      const msalConfig = {
        auth: {
          clientId: process.env.AZURE_AD_CLIENT_ID!,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
          authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
        },
      };

      const cca = new ConfidentialClientApplication(msalConfig);

      const refreshTokenRequest = {
        refreshToken: tokenData.refresh_token,
        scopes: tokenData.scopes,
      };

      console.log(`Refreshing token for account ${accountId}...`);
      const response = await cca.acquireTokenByRefreshToken(refreshTokenRequest);

      if (!response || !response.accessToken) {
        throw new Error('Token refresh failed: no access token returned');
      }

      // Calculate expiry - MSAL returns expiresOn as a Date object
      const expiresAt = response.expiresOn || new Date(Date.now() + 3600000);

      // Store new tokens
      await this.storeTokens(accountId, {
        accessToken: response.accessToken,
        refreshToken: tokenData.refresh_token, // Keep existing refresh token
        expiresAt,
        scopes: tokenData.scopes,
      });

      console.log(`Token refreshed successfully for ${accountId}, expires at ${expiresAt.toISOString()}`);

      // Reset failure count on success
      await supabase
        .from('account_tokens')
        .update({
          refresh_failure_count: 0,
          last_refresh_error: null,
        })
        .eq('account_id', accountId);

      return response.accessToken;
    } catch (error: any) {
      console.error(`Token refresh failed for ${accountId}:`, error);

      // Record failure
      await this.recordRefreshFailure(accountId, error.message);

      throw error;
    }
  }

  /**
   * Record a token refresh failure
   * Sets account to 'needs_reauth' after 3 failures
   */
  async recordRefreshFailure(accountId: string, errorMessage: string): Promise<void> {
    const supabase = createAdminClient();

    // Increment failure count
    const { data: tokenData } = await supabase
      .from('account_tokens')
      .select('refresh_failure_count')
      .eq('account_id', accountId)
      .single();

    const failureCount = (tokenData?.refresh_failure_count || 0) + 1;

    await supabase
      .from('account_tokens')
      .update({
        refresh_failure_count: failureCount,
        last_refresh_error: errorMessage,
      })
      .eq('account_id', accountId);

    // If 3 failures, mark account as needs_reauth
    if (failureCount >= 3) {
      console.error(`Account ${accountId} has failed ${failureCount} times, marking as needs_reauth`);

      await supabase
        .from('connected_accounts')
        .update({
          status: 'needs_reauth',
          status_message: 'Token refresh failed. Please reconnect your account.',
          error_count: failureCount,
          last_error_at: new Date().toISOString(),
        })
        .eq('id', accountId);
    }
  }

  /**
   * Revoke tokens (on disconnect)
   */
  async revokeTokens(accountId: string): Promise<void> {
    const supabase = createAdminClient();

    // Delete tokens from database
    const { error } = await supabase
      .from('account_tokens')
      .delete()
      .eq('account_id', accountId);

    if (error) {
      throw new Error(`Failed to revoke tokens: ${error.message}`);
    }

    console.log(`Tokens revoked for account ${accountId}`);
  }

  /**
   * Get stored token data (for debugging/testing)
   */
  async getStoredToken(accountId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('account_tokens')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error(`Failed to get stored token: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance
export const tokenService = new TokenService();
