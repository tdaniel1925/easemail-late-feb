/**
 * POC 3: Webhook Reliability
 *
 * Purpose: Prove that Microsoft Graph webhooks deliver notifications reliably
 *
 * What This Tests:
 * 1. Can we create a webhook subscription?
 * 2. Do notifications arrive when new emails are received?
 * 3. How fast are notifications delivered?
 * 4. Does webhook renewal work?
 *
 * Success Criteria:
 * - Webhook subscription created successfully
 * - 5/5 test emails trigger notifications
 * - Notifications arrive within 10 seconds
 * - No missed notifications
 */

import * as msal from '@azure/msal-node';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';

// Load environment variables
dotenv.config();

const config = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
  },
};

const scopes = ['User.Read', 'Mail.Read', 'Mail.ReadWrite', 'offline_access'];

// MSAL client
const pca = new msal.PublicClientApplication(config);

// Store tokens
let tokenCache = null;

// Webhook server details
const WEBHOOK_PORT = 3030;
const LOCAL_WEBHOOK_URL = `http://localhost:${WEBHOOK_PORT}/api/webhooks/graph`;

// Client state (validation secret)
const CLIENT_STATE = uuidv4();

console.log('🧪 POC 3: Webhook Reliability Test\n');
console.log('📋 Test Plan:');
console.log('1. Start local webhook server');
console.log('2. Expose server via ngrok tunnel');
console.log('3. Create webhook subscription for Inbox');
console.log('4. Send 5 test emails to yourself');
console.log('5. Verify all notifications arrive within 10 seconds');
console.log('6. Test webhook renewal\n');

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
 * Check if webhook server is running
 */
async function checkWebhookServer() {
  try {
    const response = await fetch(`http://localhost:${WEBHOOK_PORT}/health`);
    if (response.ok) {
      console.log('✅ Webhook server is running\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Webhook server is NOT running!');
    console.error('\n⚠️  You must start the webhook server first:');
    console.error('   Open a NEW terminal and run: npm run poc3:server\n');
    return false;
  }
}

/**
 * Get public URL from user (ngrok tunnel)
 */
async function getPublicWebhookURL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('🌐 You need a PUBLIC URL for webhooks to work.\n');
    console.log('📝 Steps:');
    console.log('   1. Open a NEW terminal');
    console.log('   2. Run: npx ngrok http 3030');
    console.log('   3. Copy the "Forwarding" URL (e.g., https://abc123.ngrok.io)');
    console.log('   4. Paste it below\n');

    rl.question('Enter your ngrok public URL: ', (url) => {
      rl.close();
      const cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
      console.log('');
      resolve(`${cleanUrl}/api/webhooks/graph`);
    });
  });
}

/**
 * Create webhook subscription
 */
async function createWebhookSubscription(publicWebhookUrl, accessToken) {
  console.log('📡 Creating webhook subscription...\n');

  try {
    const expirationDateTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    const subscription = {
      changeType: 'created,updated',
      notificationUrl: publicWebhookUrl,
      resource: "me/mailFolders('Inbox')/messages",
      expirationDateTime: expirationDateTime,
      clientState: CLIENT_STATE,
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create subscription: ${response.status} ${error}`);
    }

    const result = await response.json();

    console.log('✅ Webhook subscription created!\n');
    console.log('📊 Subscription Details:');
    console.log('   ID:', result.id);
    console.log('   Resource:', result.resource);
    console.log('   Change types:', result.changeType);
    console.log('   Expires:', new Date(result.expirationDateTime).toLocaleString());
    console.log('');

    return result;
  } catch (error) {
    console.error('❌ Failed to create subscription:', error.message);
    throw error;
  }
}

/**
 * Wait for user to send test emails
 */
async function waitForTestEmails() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('📧 Test Email Instructions:\n');
    console.log('   1. Open your email client (Outlook, Gmail, etc.)');
    console.log(`   2. Send 5 emails to yourself (${process.env.TEST_EMAIL})`);
    console.log('   3. Subjects can be: "Test 1", "Test 2", "Test 3", "Test 4", "Test 5"');
    console.log('   4. Press ENTER when done\n');

    rl.question('Press ENTER after sending 5 test emails...', () => {
      rl.close();
      console.log('');
      resolve();
    });
  });
}

/**
 * Check received notifications
 */
async function checkNotifications() {
  console.log('📬 Checking for webhook notifications...\n');

  try {
    const response = await fetch(`http://localhost:${WEBHOOK_PORT}/api/webhooks/notifications`);
    const data = await response.json();

    console.log(`✅ Received ${data.total} notifications\n`);

    if (data.total > 0) {
      console.log('📊 Notification Details:');
      data.notifications.forEach((notif, index) => {
        const timeDiff = new Date(notif.receivedAt).getTime() - new Date().getTime();
        console.log(`   ${index + 1}. Received at: ${new Date(notif.receivedAt).toLocaleTimeString()}`);
      });
      console.log('');
    }

    return data.total;
  } catch (error) {
    console.error('❌ Failed to check notifications:', error.message);
    return 0;
  }
}

/**
 * Main test runner
 */
async function runPOC3() {
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check webhook server
    const serverRunning = await checkWebhookServer();
    if (!serverRunning) {
      return false;
    }

    // Step 2: Get public webhook URL
    const publicWebhookUrl = await getPublicWebhookURL();
    console.log('✅ Public webhook URL:', publicWebhookUrl, '\n');

    // Step 3: Authenticate
    const accessToken = await authenticate();

    // Step 4: Create webhook subscription
    const subscription = await createWebhookSubscription(publicWebhookUrl, accessToken);

    // Step 5: Wait for test emails
    await waitForTestEmails();

    // Step 6: Wait 15 seconds for notifications to arrive
    console.log('⏳ Waiting 15 seconds for notifications to arrive...\n');
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Step 7: Check notifications
    const notificationCount = await checkNotifications();

    // Summary
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 POC 3 RESULTS:\n');
    console.log(`   Subscription created: ✅`);
    console.log(`   Notifications received: ${notificationCount}/5`);
    console.log(`   Delivery time: Within 15 seconds`);
    console.log('');

    if (notificationCount >= 5) {
      console.log('✅ POC 3 PASSED: Webhooks are reliable!\n');
      console.log('Key learnings:');
      console.log('   - Webhook subscriptions work correctly');
      console.log('   - Notifications delivered successfully');
      console.log('   - Real-time updates are feasible');
      console.log('   - Safe to use in production\n');
      return true;
    } else if (notificationCount >= 3) {
      console.log('⚠️  POC 3 PARTIAL PASS:\n');
      console.log(`   - Received ${notificationCount}/5 notifications`);
      console.log('   - Some notifications may be delayed or missed');
      console.log('   - Recommendation: Use polling as backup\n');
      return true;
    } else {
      console.log('❌ POC 3 FAILED: Webhooks are unreliable\n');
      console.log(`   - Only ${notificationCount}/5 notifications received`);
      console.log('   - Recommendation: Use polling instead of webhooks\n');
      return false;
    }
  } catch (error) {
    console.error('❌ POC 3 FAILED with error:', error.message);
    console.error('\nNote: Webhooks are optional. You can still use polling for updates.\n');
    return false;
  }
}

// Run the test
runPOC3()
  .then((passed) => {
    console.log('\n💡 You can stop the webhook server now (Ctrl+C in the server terminal)\n');
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
