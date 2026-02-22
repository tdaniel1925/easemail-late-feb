# CLAUDE-CODE-INSTRUCTIONS.md — How to Build EaseMail v3.0

## Overview

This document contains the EXACT prompts to feed Claude Code for each build step.
Do NOT freestyle. Do NOT combine steps. Do NOT skip tests.

## CRITICAL: Context Window Management

When Claude Code reaches 25,000 tokens or less of remaining context:
1. **STOP IMMEDIATELY** — do not continue building
2. **Save your current progress** — commit all work, update BUILD-STATE.md
3. **Output a handoff prompt** — generate the EXACT prompt for the next step so a fresh Claude Code session can pick up seamlessly
4. The handoff prompt MUST include:
   - Which step was just completed
   - Which step is next
   - Any in-progress state or decisions made
   - Files modified in this session
   - Any known issues or gotchas for the next step
5. **Start a new Claude Code session** with the handoff prompt

This prevents half-finished steps, broken code from context degradation, and lost progress. A clean context window produces better code than a cramped one.

---

## Before You Start

1. Create a new repo: `easemail-v3`
2. Copy `PROJECT-SPEC.md`, `BUILD-STATE.md`, and this file into the repo root
3. Set up Supabase project and Azure AD app registration (see PROJECT-SPEC.md Appendix)
4. Have your .env.local ready with real credentials
5. **IMPORTANT:** Complete Phase 0 (Risk Mitigation POCs) before starting Agent 1

---

## PHASE 0: RISK MITIGATION PROOF-OF-CONCEPTS

**Why this phase exists:** Previous builds failed at integration points (token refresh, sync reliability, webhook stability). Before building the full app, we need to PROVE these critical pieces work in isolation.

**Duration:** 2-4 hours (this saves weeks of debugging later)

**Rule:** Do NOT proceed to Agent 1 until all three POCs pass.

---

### POC 1: Token Refresh Reliability

**Goal:** Prove that Microsoft Graph token refresh works reliably, including edge cases.

**Prompt for Claude Code:**
```
Create a standalone Node.js script (poc-token-refresh.js) that:

1. Uses @azure/msal-node to authenticate with Microsoft using your test account
2. Stores the access token and refresh token
3. Waits until the token expires (or force expiration by setting a 1-minute expiry)
4. Attempts to refresh the token using MSAL's acquireTokenByRefreshToken
5. Logs every step with timestamps
6. Tests error cases:
   - What happens if refresh token is invalid?
   - What happens if you try to refresh twice concurrently?
   - What happens if the network fails mid-refresh?

The script should run for 10 minutes, refreshing tokens 3 times, and log success/failure for each attempt.

Test Gate: The script completes 3 successful refreshes without errors.
```

**Why this matters:** If token refresh fails in production, users get logged out unexpectedly. This POC proves it works BEFORE you build the entire auth system.

**Expected outcome:** You learn:
- How long tokens actually last
- What errors Microsoft returns (they're not always obvious)
- Whether concurrent refreshes cause issues
- How to structure error handling

---

### POC 2: Delta Sync Performance

**Goal:** Prove that Microsoft Graph delta queries can sync a large mailbox efficiently.

**Prompt for Claude Code:**
```
Create a standalone Node.js script (poc-delta-sync.js) that:

1. Authenticates with Microsoft Graph using your test account
2. Fetches the initial delta link for the Inbox folder
3. Performs an initial sync of ALL messages (could be thousands)
4. Logs how many messages were fetched and how long it took
5. Waits 30 seconds
6. Performs a delta sync (should return only new/changed messages)
7. Repeat delta sync 5 times to verify it stays efficient

Measure:
- Time to fetch initial delta (all messages)
- Time to fetch incremental delta (should be < 1 second)
- Number of API calls required
- Any pagination issues

Test Gate:
- Initial sync completes in < 2 minutes for 1000 messages
- Delta syncs complete in < 1 second with no new messages
- Delta syncs correctly detect new messages
```

**Why this matters:** Delta sync is the core of the sync engine. If it's slow or buggy, the entire app feels broken.

**Expected outcome:** You learn:
- How pagination works (Graph returns 200 messages per page)
- What the delta response looks like
- How to handle "delta link expired" errors
- Realistic performance benchmarks

---

### POC 3: Webhook Reliability

**Goal:** Prove that Microsoft Graph webhooks deliver notifications reliably.

**Prompt for Claude Code:**
```
Create a minimal Next.js app with a single API route for webhook handling:

1. Create POST /api/webhooks/graph
2. Subscribe to mailFolder messages (Inbox) via Graph API
3. Set up ngrok or Vercel dev tunnel to expose localhost
4. Send yourself 5 test emails
5. Log each webhook notification received
6. Verify all 5 emails triggered webhook notifications

Test:
- Do all notifications arrive?
- How long is the delay between send and notification?
- What happens if the webhook endpoint returns an error?
- What happens if the endpoint is slow (add a 5-second delay)?

Test Gate:
- 5/5 test emails trigger webhook notifications
- Notifications arrive within 10 seconds
- Webhook renewal logic works (simulate 24-hour expiration)
```

**Why this matters:** Webhooks are critical for real-time updates. If they don't work, users won't see new emails without manual refresh.

**Expected outcome:** You learn:
- Webhook payload structure
- Retry behavior if endpoint fails
- Validation requirements (clientState secret)
- Renewal timing (webhooks expire every 3 days)

---

### POC Results Document

After completing all three POCs, create a `POC-RESULTS.md` file documenting:

```markdown
# Phase 0: POC Results

## POC 1: Token Refresh
- ✅ Passed / ❌ Failed
- Token lifetime: X minutes
- Refresh success rate: X/3
- Key learnings:
  - [What you learned]
  - [Any gotchas]

## POC 2: Delta Sync
- ✅ Passed / ❌ Failed
- Initial sync time (1000 messages): X seconds
- Delta sync time (0 new messages): X seconds
- Pagination required: Yes/No
- Key learnings:
  - [What you learned]

## POC 3: Webhooks
- ✅ Passed / ❌ Failed
- Notification delivery rate: 5/5
- Average delay: X seconds
- Key learnings:
  - [What you learned]

## Decision
- [ ] All POCs passed → Proceed to Agent 1
- [ ] One or more POCs failed → Debug before proceeding
```

**Only proceed to Agent 1 if all three POCs passed.**

---

## How to Use

1. Open Claude Code in the repo
2. Copy the prompt for the CURRENT step (check BUILD-STATE.md)
3. Paste it into Claude Code
4. Wait for it to complete and run the test
5. If test passes: update BUILD-STATE.md, move to next step
6. If test fails: tell Claude Code "The test failed. Here's the error: [paste error]. Fix it."
7. At manual checkpoints: test in browser yourself before proceeding

---

## CONTEXT WINDOW HANDOFF PROTOCOL

When you reach 25,000 tokens or less remaining, follow this exact protocol:

### Step 1: Stop Immediately
DO NOT continue building. Finish the current file edit if mid-edit, then STOP.

### Step 2: Commit All Work
```bash
git add .
git commit -m "Step X.Y: [name] — context handoff at [percentage]% complete"
```

### Step 3: Update BUILD-STATE.md
Mark the current step status:
- If completed: ✅ with date
- If partially complete: 🔨 In Progress (X% complete)

### Step 4: Generate Handoff Prompt

Use this template (fill in all [brackets]):

```
## CONTEXT HANDOFF — EaseMail v3.0

**Previous session ended:** [Date and time]
**Current step:** [X.Y - Step name]
**Step status:** [X% complete / Fully complete / Blocked]
**Remaining context when stopped:** [X tokens]

### What Was Completed in Last Session
[List each file created/modified with brief description]

Example:
- ✅ `lib/graph/token-service.ts` — Token storage and refresh logic implemented
- ✅ `lib/graph/client.ts` — Graph client factory with retry logic
- 🔨 `app/api/auth/[...nextauth]/route.ts` — Started but incomplete (50% done)

### Current Step Instructions
[Copy the exact prompt from CLAUDE-CODE-INSTRUCTIONS.md for current step]

### Test Status
- Test gate [X.Y] status: [✅ Passing / ❌ Failing / ⬜ Not run yet]
- If failing, error message:
  ```
  [Paste full error if applicable]
  ```

### Known Issues & Gotchas
[List any issues discovered that the next session should be aware of]

Example:
- Token expiry in MSAL is in seconds, not milliseconds
- Supabase RLS policies need `auth.uid()` not `current_user`
- The email body sanitizer strips `<style>` tags by default

### Environment State
- [ ] `npm run dev` works
- [ ] `npm run build` works
- [ ] Supabase migrations applied
- [ ] .env.local configured
- [ ] Dependencies installed

### Next Steps (in order)
1. [Immediate next task]
2. [Following task]
3. [Task after that]

Example:
1. Complete the NextAuth callback functions (signIn, jwt, session)
2. Test authentication flow with Microsoft OAuth
3. Verify user/account records created in Supabase
4. Run test gate 2.1
5. If passing, move to Step 2.2

### Files Modified This Session
[Full list of file paths]

### Decision Log
[Any architectural decisions made this session that affect future steps]

Example:
- Decided to use Inngest instead of Supabase pg_cron for background jobs
- Token encryption using Supabase Vault (not pgcrypto)
- Refresh tokens cached in memory for 5 minutes to reduce DB queries

---

**HANDOFF COMPLETE. Start fresh Claude Code session with this prompt.**
```

### Step 5: Output to User
Paste the filled handoff prompt to the user and say:

"I've reached the context window limit. Here's your handoff prompt for the next session. Copy this entire prompt and paste it into a fresh Claude Code session to continue where we left off."

### Step 6: User Starts New Session
User opens new Claude Code terminal and pastes the handoff prompt. Claude Code reads it and continues seamlessly.

---

## AGENT 1: FOUNDATION

### Prompt for Step 1.1
```
Read PROJECT-SPEC.md. You are building Step 1.1 — Project Scaffold.

Initialize a Next.js 14 App Router project with TypeScript, Tailwind CSS, and shadcn/ui.
Create the EXACT folder structure specified in Step 1.1 of the spec.
Create placeholder files (with proper TypeScript exports) for all specified paths.

Install dependencies:
- @microsoft/microsoft-graph-client
- @azure/msal-node
- @supabase/supabase-js
- @supabase/ssr
- next-auth
- zustand
- zod
- tiptap (core + starter-kit + extensions)
- dompurify
- @anthropic-ai/sdk
- lucide-react
- date-fns
- sentry

After creating everything:
1. Run `npm run build` — it must succeed
2. Run `npx tsc --noEmit` — it must succeed
3. Verify all directories and files exist

Update BUILD-STATE.md step 1.1 to ✅ if passing, ❌ if failing.
Do NOT proceed to step 1.2.
```

### Prompt for Step 1.2
```
Read PROJECT-SPEC.md. You are building Step 1.2 — Database Migration.

Create a Supabase migration file at supabase/migrations/001_initial_schema.sql
containing the COMPLETE database schema from Gate 1 of the spec. This includes
ALL tables, indexes, and RLS policies exactly as specified.

Then:
1. Run `npx supabase db push`
2. Verify all tables exist
3. Verify RLS is enabled on all tables
4. Run `npx supabase gen types typescript --local > types/database.ts`

Update BUILD-STATE.md step 1.2 to ✅ if passing, ❌ if failing.
Do NOT proceed to step 1.3.
```

### Prompt for Step 1.3
```
Read PROJECT-SPEC.md. You are building Step 1.3 — Environment Configuration.

Create:
1. `.env.example` with ALL required environment variables (see spec)
2. `lib/env.ts` with a Zod schema that validates ALL required vars at runtime
3. Import and call the validation in `app/layout.tsx` or a server component

The app MUST crash with a clear error message if any required var is missing.

Test: Temporarily remove a var from .env.local and verify the app shows
which var is missing. Then restore it.

Update BUILD-STATE.md step 1.3 to ✅ if passing, ❌ if failing.
Do NOT proceed to step 1.4.
```

### Prompt for Step 1.4
```
Read PROJECT-SPEC.md. You are building Step 1.4 — Supabase Client Setup.

Create:
1. `lib/supabase/client.ts` — browser client (singleton)
2. `lib/supabase/server.ts` — server client (uses cookies)
3. `lib/supabase/admin.ts` — service role client (for background jobs)
4. `lib/supabase/middleware.ts` — auth session refresh middleware
5. Update `middleware.ts` at project root to use Supabase middleware

Test by querying the tenants table (should return empty array, not error).

Update BUILD-STATE.md step 1.4 to ✅ if passing, ❌ if failing.
Do NOT proceed to step 1.5.
```

### Prompt for Step 1.5
```
Read PROJECT-SPEC.md. You are building Step 1.5 — Zustand Store Setup.

Create these Zustand stores with TypeScript interfaces but EMPTY implementations:
1. `stores/mail-store.ts` — messages, selectedMessageId, selectedFolderId, + actions
2. `stores/account-store.ts` — accounts, activeAccountId, + actions
3. `stores/ui-store.ts` — sidebarOpen, readingPane, theme, density, + actions
4. `stores/sync-store.ts` — syncStatus per account, lastSyncAt, + actions

Each store should have the correct TypeScript types matching the database schema.
Actions should be stub functions that log "not implemented" for now.

Write tests to verify each store has the required shape.

Update BUILD-STATE.md step 1.5 to ✅ if passing, ❌ if failing.

STOP. This completes Agent 1. Alert the user for MANUAL CHECKPOINT 1.
```

---

## AGENT 2: AUTH ENGINE

### Prompt for Step 2.1
```
Read PROJECT-SPEC.md. You are building Step 2.1 — NextAuth Microsoft Provider.

IMPORTANT CONTEXT: Previous EaseMail builds broke because of auth issues.
This step must be BULLETPROOF.

Set up NextAuth.js with the Azure AD / Microsoft provider:
1. Create `app/api/auth/[...nextauth]/route.ts`
2. Configure Microsoft provider with correct scopes from spec (MINIMUM_SCOPES)
3. In the signIn callback: create/update user in Supabase users table
4. In the signIn callback: create/update connected_account in Supabase
5. In the jwt callback: store the Graph API tokens
6. In the session callback: expose accountId and user info
7. Create `app/(auth)/login/page.tsx` with "Sign in with Microsoft" button

Test:
1. Visit /login
2. Click "Sign in with Microsoft"
3. Complete OAuth flow
4. Verify redirect to /mail
5. Verify user row in Supabase users table
6. Verify connected_account row in Supabase

Update BUILD-STATE.md step 2.1 to ✅ if passing, ❌ if failing.
Do NOT proceed to step 2.2.
```

### Prompt for Step 2.2
```
Read PROJECT-SPEC.md. You are building Step 2.2 — Token Storage Service.

THIS IS THE MOST CRITICAL STEP. Previous builds failed here.

Create `lib/graph/token-service.ts` with a TokenService class:

1. storeTokens(accountId, { accessToken, refreshToken, expiresAt, scopes })
   - Stores in account_tokens table
   - Uses Supabase admin client (bypasses RLS for background jobs)

2. getAccessToken(accountId) → string
   - Check if token expires in < 5 minutes
   - If yes: call refreshToken() first
   - If no: return current access token
   - MUST handle concurrent calls (only one refresh at a time)

3. refreshToken(accountId) → string
   - Use MSAL ConfidentialClientApplication.acquireTokenByRefreshToken
   - On success: update tokens in DB, reset failure count
   - On failure: increment failure count
   - After 3 failures: set connected_account status to 'needs_reauth'
   - Log EVERY attempt (success and failure) with timestamps

4. revokeTokens(accountId)
   - Delete from account_tokens table

Write comprehensive tests. This service must be PERFECT.

Update BUILD-STATE.md step 2.2 to ✅ if passing, ❌ if failing.
Do NOT proceed to step 2.3.
```

### Prompts for Steps 2.3-2.7
```
[Follow the same pattern — one prompt per step, referencing the spec,
with explicit test requirements and the instruction to NOT proceed]
```

---

## MANUAL CHECKPOINT PROTOCOL

At each manual checkpoint, Daniel should:

1. Open the app in Chrome
2. Open Chrome DevTools Console (check for errors)
3. Open Supabase Dashboard (check tables)
4. Walk through EVERY checklist item in the spec
5. If ANY item fails: create an entry in BUILD-STATE.md Error Log
6. Tell Claude Code: "Checkpoint X failed. These items don't work: [list]. Fix them."
7. Only sign off when ALL items pass

---

## TIPS FOR SUCCESS

1. **One step at a time.** Never ask Claude Code to do two steps at once.
2. **Read the error.** When a test fails, paste the FULL error into Claude Code.
3. **Don't skip tests.** The tests are there to catch the exact bugs that broke previous builds.
4. **Manual checkpoints are mandatory.** This is where you catch the subtle issues.
5. **If stuck on a step for > 3 attempts:** Come back to Claude chat (me) with the error.
   I can help diagnose without touching the code.
6. **Keep BUILD-STATE.md updated.** It's your source of truth.
7. **Commit after each passing step.** `git commit -m "Step 1.1: Project scaffold ✅"`
   This way you can always roll back to the last working state.
