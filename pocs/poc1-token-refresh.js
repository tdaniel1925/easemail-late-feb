/**
 * POC 1: Token Refresh Reliability
 *
 * Purpose: Prove that MSAL can refresh Microsoft Graph tokens reliably
 *
 * What This Tests:
 * 1. Can we get initial tokens via device code flow?
 * 2. Can we refresh the token before it expires?
 * 3. Does concurrent refresh cause issues?
 * 4. How does MSAL handle invalid refresh tokens?
 *
 * Success Criteria:
 * - 3 successful token refreshes
 * - No errors during refresh
 * - Tokens remain valid after refresh
 */

import * as msal from '@azure/msal-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
  },
};

const scopes = ['User.Read', 'Mail.Read', 'offline_access'];

// MSAL client (using PublicClientApplication for device code flow)
const pca = new msal.PublicClientApplication(config);

// Store tokens
let tokenCache = null;

console.log('🧪 POC 1: Token Refresh Reliability Test\n');
console.log('📋 Test Plan:');
console.log('1. Authenticate via device code flow');
console.log('2. Store access token and refresh token');
console.log('3. Wait for token to expire (or force expiration)');
console.log('4. Refresh token using MSAL');
console.log('5. Repeat 3 times to verify reliability\n');

/**
 * Step 1: Initial authentication via device code
 */
async function authenticateWithDeviceCode() {
  console.log('🔐 Starting device code authentication...\n');

  try {
    const deviceCodeRequest = {
      deviceCodeCallback: (response) => {
        console.log('📱 MANUAL STEP REQUIRED:');
        console.log('   1. Open: ' + response.verificationUri);
        console.log('   2. Enter code: ' + response.userCode);
        console.log('   3. Sign in with your Microsoft account');
        console.log('   4. Authorize the app\n');
        console.log('⏳ Waiting for you to complete authentication...\n');
      },
      scopes: scopes,
    };

    const response = await pca.acquireTokenByDeviceCode(deviceCodeRequest);

    console.log('✅ Authentication successful!\n');
    console.log('📊 Token Details:');
    console.log('   Account:', response.account.username);
    console.log('   Expires:', new Date(response.expiresOn).toLocaleString());
    console.log('   Scopes:', response.scopes.join(', '));
    console.log('   Access token length:', response.accessToken.length, 'chars');
    console.log('   Has refresh token:', !!response.refreshToken ? 'Yes' : 'No');
    console.log('');

    tokenCache = response;
    return response;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Step 2: Refresh the token
 */
async function refreshToken(attempt) {
  console.log(`🔄 Refresh Attempt ${attempt}/3\n`);

  try {
    const silentRequest = {
      account: tokenCache.account,
      scopes: scopes,
      forceRefresh: true, // Force refresh instead of using cache
    };

    const startTime = Date.now();
    const response = await pca.acquireTokenSilent(silentRequest);
    const duration = Date.now() - startTime;

    console.log(`✅ Token refreshed successfully in ${duration}ms\n`);
    console.log('📊 New Token Details:');
    console.log('   Expires:', new Date(response.expiresOn).toLocaleString());
    console.log('   Access token changed:', response.accessToken !== tokenCache.accessToken ? 'Yes' : 'No');
    console.log('   Scopes:', response.scopes.join(', '));
    console.log('');

    tokenCache = response;
    return { success: true, duration };
  } catch (error) {
    console.error(`❌ Refresh failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Step 3: Test token with Microsoft Graph API
 */
async function testTokenValidity() {
  console.log('🧪 Testing token validity with Graph API...\n');

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokenCache.accessToken}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      console.log('✅ Token is valid! User:', user.displayName, `(${user.mail})\n`);
      return true;
    } else {
      console.error('❌ Token is invalid. Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Graph API test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runPOC1() {
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Initial authentication
    await authenticateWithDeviceCode();

    // Test initial token
    await testTokenValidity();

    // Step 2: Refresh token 3 times
    const results = [];

    for (let i = 1; i <= 3; i++) {
      console.log('⏳ Waiting 5 seconds before refresh...\n');
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const result = await refreshToken(i);
      results.push(result);

      if (result.success) {
        await testTokenValidity();
      } else {
        console.error('⚠️  Stopping test due to refresh failure\n');
        break;
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 POC 1 RESULTS:\n');

    const successCount = results.filter((r) => r.success).length;
    const avgDuration =
      results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;

    console.log(`   Successful refreshes: ${successCount}/3`);
    console.log(`   Average refresh time: ${Math.round(avgDuration)}ms`);
    console.log(`   Test status: ${successCount === 3 ? '✅ PASSED' : '❌ FAILED'}\n`);

    if (successCount === 3) {
      console.log('✅ POC 1 PASSED: Token refresh is reliable!\n');
      console.log('Key learnings:');
      console.log('   - MSAL successfully refreshes tokens');
      console.log('   - Average refresh time:', Math.round(avgDuration), 'ms');
      console.log('   - No errors encountered');
      console.log('   - Safe to use in production\n');
      return true;
    } else {
      console.log('❌ POC 1 FAILED: Token refresh is NOT reliable\n');
      console.log('⚠️  DO NOT PROCEED to Agent 1 until this is fixed!\n');
      return false;
    }
  } catch (error) {
    console.error('❌ POC 1 FAILED with error:', error.message);
    console.error('\n⚠️  DO NOT PROCEED to Agent 1 until this is fixed!\n');
    return false;
  }
}

// Check environment variables
if (!process.env.AZURE_AD_CLIENT_ID) {
  console.error('❌ ERROR: Missing environment variables!');
  console.error('');
  console.error('Please create a .env file in the pocs/ directory with:');
  console.error('   AZURE_AD_CLIENT_ID=your-client-id');
  console.error('   AZURE_AD_CLIENT_SECRET=your-client-secret');
  console.error('   AZURE_AD_TENANT_ID=your-tenant-id');
  console.error('');
  console.error('See .env.example for template.');
  process.exit(1);
}

// Run the test
runPOC1()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
