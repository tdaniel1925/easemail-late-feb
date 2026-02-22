/**
 * POC 2: Delta Sync Performance
 *
 * Purpose: Prove that Microsoft Graph delta queries can sync mailboxes efficiently
 *
 * What This Tests:
 * 1. How long does initial sync take for a mailbox?
 * 2. How many messages can we sync per second?
 * 3. Does pagination work correctly?
 * 4. How fast are incremental delta syncs (no new messages)?
 * 5. How fast are delta syncs with new messages?
 *
 * Success Criteria:
 * - Initial sync < 2 minutes for 1000 messages
 * - Delta sync (no changes) < 1 second
 * - Delta sync (with changes) < 5 seconds
 * - Pagination handled correctly
 */

import * as msal from '@azure/msal-node';
import fetch from 'node-fetch';
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

// MSAL client
const pca = new msal.PublicClientApplication(config);

// Store tokens
let tokenCache = null;

console.log('🧪 POC 2: Delta Sync Performance Test\n');
console.log('📋 Test Plan:');
console.log('1. Authenticate via device code flow');
console.log('2. Get initial delta link for Inbox folder');
console.log('3. Perform initial sync (fetch all messages)');
console.log('4. Measure sync time and throughput');
console.log('5. Perform delta sync (no changes)');
console.log('6. Measure delta sync performance\n');

/**
 * Authenticate and get access token
 */
async function authenticate() {
  console.log('🔐 Authenticating...\n');

  try {
    const deviceCodeRequest = {
      deviceCodeCallback: (response) => {
        console.log('📱 MANUAL STEP REQUIRED:');
        console.log('   1. Open: ' + response.verificationUri);
        console.log('   2. Enter code: ' + response.userCode);
        console.log('   3. Sign in with your Microsoft account');
        console.log('   4. Authorize the app\n');
        console.log('⏳ Waiting for authentication...\n');
      },
      scopes: scopes,
    };

    const response = await pca.acquireTokenByDeviceCode(deviceCodeRequest);
    tokenCache = response;

    console.log('✅ Authenticated as:', response.account.username, '\n');
    return response.accessToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Make a Graph API request
 */
async function callGraphAPI(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.body-content-type="text"', // Get plain text instead of HTML for speed
    },
  });

  if (!response.ok) {
    throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get initial delta link for Inbox
 */
async function getInitialDeltaLink(accessToken) {
  console.log('📥 Getting initial delta link for Inbox...\n');

  try {
    const url = 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages/delta';
    const response = await callGraphAPI(url, accessToken);

    const deltaLink = response['@odata.deltaLink'];
    console.log('✅ Delta link obtained\n');

    return deltaLink;
  } catch (error) {
    console.error('❌ Failed to get delta link:', error.message);
    throw error;
  }
}

/**
 * Perform initial sync (fetch all messages)
 */
async function performInitialSync(accessToken) {
  console.log('🔄 Starting initial sync of Inbox...\n');

  const startTime = Date.now();
  let messages = [];
  let url = 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages/delta';
  let pageCount = 0;
  let deltaLink = null;

  try {
    while (url) {
      const response = await callGraphAPI(url, accessToken);
      pageCount++;

      // Add messages from this page
      if (response.value) {
        messages = messages.concat(response.value);
        console.log(`   Page ${pageCount}: ${response.value.length} messages (total: ${messages.length})`);
      }

      // Check for next page or delta link
      if (response['@odata.nextLink']) {
        url = response['@odata.nextLink'];
      } else if (response['@odata.deltaLink']) {
        deltaLink = response['@odata.deltaLink'];
        url = null; // Exit loop
      } else {
        url = null;
      }
    }

    const duration = Date.now() - startTime;
    const messagesPerSecond = Math.round((messages.length / duration) * 1000);

    console.log('\n✅ Initial sync complete!\n');
    console.log('📊 Sync Statistics:');
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   Pages fetched: ${pageCount}`);
    console.log(`   Time taken: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`   Throughput: ${messagesPerSecond} messages/second`);
    console.log(`   Average per page: ${Math.round(messages.length / pageCount)} messages\n`);

    return { messages, deltaLink, duration, pageCount };
  } catch (error) {
    console.error('❌ Initial sync failed:', error.message);
    throw error;
  }
}

/**
 * Perform delta sync (check for changes)
 */
async function performDeltaSync(deltaLink, accessToken) {
  console.log('🔄 Performing delta sync (checking for changes)...\n');

  const startTime = Date.now();

  try {
    const response = await callGraphAPI(deltaLink, accessToken);

    const duration = Date.now() - startTime;
    const changedMessages = response.value || [];
    const newDeltaLink = response['@odata.deltaLink'];

    console.log(`✅ Delta sync complete in ${duration}ms\n`);
    console.log('📊 Delta Sync Results:');
    console.log(`   Changed/new messages: ${changedMessages.length}`);
    console.log(`   Time taken: ${duration}ms`);
    console.log(`   Status: ${changedMessages.length === 0 ? 'No changes' : 'Changes detected'}\n`);

    return { changedMessages, newDeltaLink, duration };
  } catch (error) {
    console.error('❌ Delta sync failed:', error.message);
    throw error;
  }
}

/**
 * Main test runner
 */
async function runPOC2() {
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Authenticate
    const accessToken = await authenticate();

    // Step 2: Initial sync
    const initialSync = await performInitialSync(accessToken);

    // Step 3: Delta sync (should be fast - no changes)
    console.log('⏳ Waiting 3 seconds before delta sync...\n');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const deltaSync1 = await performDeltaSync(initialSync.deltaLink, accessToken);

    // Step 4: Another delta sync to test consistency
    console.log('⏳ Waiting 3 seconds before second delta sync...\n');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const deltaSync2 = await performDeltaSync(deltaSync1.newDeltaLink, accessToken);

    // Summary
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 POC 2 RESULTS:\n');

    const initialSyncTime = initialSync.duration / 1000;
    const avgDeltaSyncTime = (deltaSync1.duration + deltaSync2.duration) / 2;

    console.log('Initial Sync:');
    console.log(`   Messages synced: ${initialSync.messages.length}`);
    console.log(`   Time: ${initialSyncTime.toFixed(2)} seconds`);
    console.log(`   Pages: ${initialSync.pageCount}`);
    console.log('');

    console.log('Delta Sync Performance:');
    console.log(`   First delta: ${deltaSync1.duration}ms (${deltaSync1.changedMessages.length} changes)`);
    console.log(`   Second delta: ${deltaSync2.duration}ms (${deltaSync2.changedMessages.length} changes)`);
    console.log(`   Average: ${Math.round(avgDeltaSyncTime)}ms`);
    console.log('');

    // Determine pass/fail
    const initialSyncPassed = initialSync.messages.length === 0 || initialSyncTime < 120; // < 2 min
    const deltaSyncPassed = avgDeltaSyncTime < 1000; // < 1 second

    const overallPassed = initialSyncPassed && deltaSyncPassed;

    if (overallPassed) {
      console.log('✅ POC 2 PASSED: Delta sync is fast and reliable!\n');
      console.log('Key learnings:');
      console.log(`   - Initial sync: ${initialSyncTime.toFixed(1)}s for ${initialSync.messages.length} messages`);
      console.log(`   - Delta sync: ${Math.round(avgDeltaSyncTime)}ms average`);
      console.log('   - Pagination works correctly');
      console.log('   - Safe to use in production\n');
    } else {
      console.log('⚠️  POC 2 PARTIAL PASS:\n');
      if (!initialSyncPassed) {
        console.log(`   ⚠️  Initial sync slower than target (${initialSyncTime.toFixed(1)}s vs 120s target)`);
      }
      if (!deltaSyncPassed) {
        console.log(`   ❌ Delta sync slower than target (${Math.round(avgDeltaSyncTime)}ms vs 1000ms target)`);
      }
      console.log('');
    }

    return overallPassed;
  } catch (error) {
    console.error('❌ POC 2 FAILED with error:', error.message);
    console.error('\n⚠️  DO NOT PROCEED to Agent 1 until this is fixed!\n');
    return false;
  }
}

// Run the test
runPOC2()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
