import { Client } from '@microsoft/microsoft-graph-client';
import { tokenService } from './token-service';

/**
 * Create an authenticated Microsoft Graph client for an account
 * Automatically handles token refresh
 */
export async function createGraphClient(accountId: string): Promise<Client> {
  const client = Client.init({
    authProvider: async (done) => {
      try {
        const accessToken = await tokenService.getAccessToken(accountId);
        done(null, accessToken);
      } catch (error: any) {
        console.error(`Failed to get access token for ${accountId}:`, error);
        done(error, null);
      }
    },
  });

  return client;
}

/**
 * Create Graph client with manual token (for initial auth)
 */
export function createGraphClientWithToken(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
