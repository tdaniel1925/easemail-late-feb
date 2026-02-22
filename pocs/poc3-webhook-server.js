/**
 * POC 3: Webhook Server
 *
 * This is a simple Express server that receives webhook notifications from Microsoft Graph.
 * Run this in a separate terminal window while running poc3-webhooks.js
 */

import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 3030;

// Store received notifications
const notifications = [];

// Middleware to parse JSON
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', notifications: notifications.length });
});

// Webhook endpoint (receives POST from Microsoft Graph)
app.post('/api/webhooks/graph', (req, res) => {
  const validationToken = req.query.validationToken;

  // Microsoft Graph sends validation request on subscription creation
  if (validationToken) {
    console.log('📨 Received validation request from Microsoft Graph');
    console.log('   Validation token:', validationToken.substring(0, 20) + '...');

    // Respond with validation token in plain text
    res.type('text/plain').send(validationToken);
    console.log('✅ Validation response sent\n');
    return;
  }

  // Actual webhook notification
  const notification = req.body;

  console.log('📬 Webhook notification received!');
  console.log('   Time:', new Date().toLocaleTimeString());
  console.log('   Subscription ID:', notification.value?.[0]?.subscriptionId || 'unknown');
  console.log('   Change type:', notification.value?.[0]?.changeType || 'unknown');
  console.log('   Resource:', notification.value?.[0]?.resource || 'unknown');
  console.log('');

  // Store notification with timestamp
  notifications.push({
    receivedAt: new Date(),
    data: notification,
  });

  // Microsoft Graph expects 202 Accepted
  res.status(202).send();
});

// Get all notifications (for testing)
app.get('/api/webhooks/notifications', (req, res) => {
  res.json({
    total: notifications.length,
    notifications: notifications,
  });
});

// Clear notifications (for testing)
app.delete('/api/webhooks/notifications', (req, res) => {
  const count = notifications.length;
  notifications.length = 0;
  res.json({ cleared: count });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Webhook server started!\n');
  console.log(`   Local URL: http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Webhook endpoint: http://localhost:${PORT}/api/webhooks/graph`);
  console.log('\n⏳ Waiting for webhook notifications...\n');
  console.log('💡 You need to expose this server via ngrok or similar tunnel');
  console.log('   Run in another terminal: npx ngrok http 3030\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Session Summary:');
  console.log(`   Total notifications received: ${notifications.length}\n`);
  process.exit(0);
});
