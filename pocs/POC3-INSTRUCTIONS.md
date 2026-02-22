# POC 3: Webhook Reliability - Setup Instructions

POC 3 tests Microsoft Graph webhooks to verify real-time notifications work.

## Overview

Webhooks require:
1. A **publicly accessible URL** (webhooks can't reach localhost)
2. A **webhook server** to receive notifications
3. A **webhook subscription** created via Microsoft Graph API

## Setup Steps

### Step 1: Install Dependencies

```powershell
cd "C:\dev\1 - EaseMail -  Late Feb\pocs"
npm install
```

### Step 2: Start Webhook Server (Terminal 1)

```powershell
npm run poc3:server
```

You should see:
```
🚀 Webhook server started!
   Local URL: http://localhost:3030
   Webhook endpoint: http://localhost:3030/api/webhooks/graph
⏳ Waiting for webhook notifications...
```

**Leave this terminal running!**

### Step 3: Expose Server via ngrok (Terminal 2)

Open a **NEW PowerShell terminal** and run:

```powershell
npx ngrok http 3030
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok.io -> http://localhost:3030
```

**Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok.io`)

**Leave this terminal running!**

### Step 4: Run POC 3 Test (Terminal 3)

Open a **THIRD PowerShell terminal** and run:

```powershell
cd "C:\dev\1 - EaseMail -  Late Feb\pocs"
npm run poc3
```

### Step 5: Follow Prompts

The test will:
1. Ask for your **ngrok public URL** (paste the HTTPS URL from step 3)
2. Ask you to authenticate (device code flow)
3. Create webhook subscription
4. Ask you to **send 5 test emails to yourself**
5. Wait for notifications
6. Report results

### Step 6: Send Test Emails

When prompted:
1. Open your email client (Outlook.com, Gmail, etc.)
2. Send 5 emails to `info@tonnerow.com`
3. Subjects can be: "Test 1", "Test 2", "Test 3", "Test 4", "Test 5"
4. Press ENTER in the POC terminal

The test will wait 15 seconds, then check how many webhook notifications were received.

## Expected Results

**Success:**
- ✅ 5/5 notifications received within 15 seconds
- ✅ POC 3 PASSED

**Partial Success:**
- ⚠️  3-4/5 notifications received
- ⚠️  Webhooks work but may have occasional delays
- Recommendation: Use polling as backup

**Failure:**
- ❌ < 3/5 notifications received
- ❌ Webhooks unreliable
- Recommendation: Use polling instead

## Troubleshooting

**"Webhook server is NOT running"**
→ Make sure you started the server in Terminal 1 (`npm run poc3:server`)

**"Failed to create subscription"**
→ Check your ngrok URL is correct and includes `https://`

**"No notifications received"**
→ Check the webhook server terminal (Terminal 1) - are notifications appearing there?
→ If yes, there's a bug. If no, webhooks aren't working.

**ngrok session expired**
→ Free ngrok sessions expire after 2 hours. Restart ngrok and get a new URL.

## Notes

- Webhooks are **optional** - EaseMail can work with polling instead
- Even if POC 3 fails, you can proceed to Agent 1
- Webhooks add real-time feel but aren't critical for MVP
