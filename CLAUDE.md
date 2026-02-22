# CLAUDE.md — EaseMail v3.0

> **Read this file first. It governs everything you do in this project.**

## What This Project Is

EaseMail v3.0 is a multi-tenant email client built on Microsoft Graph API with AI features, calendar, Teams chat, contacts, CRM, shared inboxes, and white-label branding. Built with Next.js 14 (App Router), Supabase, Zustand, and Tailwind CSS.

## Spec Files — Read Before Building

| File | What It Contains | When to Read |
|------|-----------------|--------------|
| `PROJECT-SPEC.md` | Full architecture, database schema, Gates 0-5, Agents 1-8, all build steps | Always — this is the source of truth |
| `BUILD-STATE.md` | Progress tracker — which steps are done, which is next | Every session start — check where you are |
| `CLAUDE-CODE-INSTRUCTIONS.md` | Exact prompts per build step, test gates, checkpoint checklists | Before each step — copy the prompt for your current step |
| `UI-DESIGN-SYSTEM.md` | Colors, typography, spacing, components, anti-patterns | Before ANY UI work — follow exactly |
| `ADDITIONAL-AGENTS.md` | Agents 9-11: Calendar, MS Teams, Contacts modules | When building those modules |
| `MICRO-FEATURES.md` | 458 email-core micro-features (composer, message list, viewer, etc.) | Before building any email UI component |
| `MICRO-FEATURES-V2.md` | 239 additional features (snooze, snippets, AI, tracking, etc.) | Before building advanced email features |
| `MICRO-FEATURES-V3.md` | 541 features for contacts, settings, Teams, calendar, CRM, admin, billing | Before building non-email modules |
| `MODULARITY-AND-GAPS.md` | 12 missing DB tables, plugin architecture, background jobs | Before database migrations and module integration |
| `COVERAGE-MATRIX.md` | Every screen, API route, and DB table mapped to a build step | For verification — cross-check your work |
| `easemail-mockup.jsx` | Interactive React mockup — visual reference for all views | Before building any UI — this is the design target |

## Build Rules — Non-Negotiable

### 1. One Step at a Time
- Check `BUILD-STATE.md` for the current step
- Build ONLY that step
- Run the test gate for that step
- Do NOT proceed to the next step until the test passes
- Do NOT combine multiple steps into one session

### 2. Test Before Proceeding
Every step has a test gate. Run it. If it fails:
- Fix the code
- Re-run the test
- If it fails 3 times: STOP. Output the error and ask for help. Do not keep guessing.

### 3. Manual Checkpoints Are Mandatory
At checkpoint steps (marked `CP` in BUILD-STATE.md):
- STOP building
- List every checkpoint item
- Wait for human verification
- Do NOT proceed until human signs off

### 4. Context Window Rule
**When you reach 25,000 tokens or less of remaining context:**
1. STOP immediately — do not continue building
2. Commit all work with `git commit -m "Step X.Y: {name} — context handoff"`
3. Update BUILD-STATE.md with current progress
4. Output a HANDOFF PROMPT that includes:
   - Which step was just completed (or partially completed)
   - Which step is next
   - Any in-progress decisions or state
   - Files modified in this session
   - Known issues or gotchas for the next step
5. Tell the user to start a fresh Claude Code session with the handoff prompt

### 5. Follow the Design System
- Read `UI-DESIGN-SYSTEM.md` before writing ANY CSS, Tailwind class, or UI component
- 13px base font, not 16px
- 4px spacing grid — every margin/padding is a multiple of 4
- One accent color: coral `#FF7F50` — used ONLY on primary buttons, focus rings, unread dots, active nav, send button
- Everything else is grayscale
- No gradients, no colored backgrounds, no card-based message lists
- Reference `easemail-mockup.jsx` for the visual target

### 6. Read Micro-Features Before Building Components
Before building any UI component, find the relevant section in MICRO-FEATURES.md, V2, or V3 and implement ALL features listed. Not later. Now.

### 7. Update BUILD-STATE.md After Every Step
Mark the step ✅ with the date. If a step failed and was fixed, note that too.

## Code Standards

### File Organization
```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth pages (login, register, invite)
    (app)/                # Protected app pages
      mail/
      calendar/
      teams/
      contacts/
      crm/
      settings/
    api/                  # API routes
  components/
    ui/                   # Shared UI components (Button, Input, Modal, etc.)
    mail/                 # Email-specific components
    calendar/             # Calendar components
    teams/                # Teams components
    contacts/             # Contact components
    crm/                  # CRM components
    settings/             # Settings components
    layout/               # Layout components (Sidebar, TopBar, etc.)
  lib/
    supabase/             # Supabase client, queries, types
    graph/                # Microsoft Graph client, API wrappers
    ai/                   # Claude API integration
    modules/              # Module registry, feature flags
    stores/               # Zustand stores
    utils/                # Shared utilities
    audit.ts              # Audit logging utility
    undo-queue.ts         # Undo queue system
  types/                  # TypeScript types/interfaces
supabase/
  migrations/             # SQL migration files (numbered)
```

### Naming Conventions
- Components: PascalCase (`MessageList.tsx`, `ComposeModal.tsx`)
- Utilities/hooks: camelCase (`useMessages.ts`, `graphClient.ts`)
- API routes: kebab-case folders (`api/mail/messages/[id]/route.ts`)
- Database: snake_case (`connected_accounts`, `message_labels`)
- Zustand stores: `use{Name}Store.ts` (`useMailStore.ts`)

### TypeScript
- Strict mode enabled
- No `any` types — define proper interfaces
- All API responses typed
- All Supabase queries typed via generated types

### Error Handling
- Every API route: try/catch with proper HTTP status codes
- Every Graph API call: handle token expiry (401 → trigger reauth flow)
- Every mutation: optimistic update with revert on failure
- User-facing errors: toast notification with human-readable message
- Never swallow errors silently

### Performance
- Skeleton screens for loading states (no spinners)
- Optimistic updates for all user actions
- Debounce search inputs (200ms)
- Debounce auto-save (3 seconds)
- Paginate all lists (50 items per page)
- Index all frequently queried columns

## Git Workflow

- Commit after every completed step: `git commit -m "Step X.Y: {name} ✅"`
- Branch per agent: `agent-1/foundation`, `agent-2/auth`, etc.
- Merge to main at manual checkpoints only
- Never force push to main

## Quick Reference

- **Supabase project:** check `.env.local`
- **Azure AD app:** check `.env.local`
- **Graph API scopes needed:** Mail.ReadWrite, Mail.Send, Calendars.ReadWrite, Chat.ReadWrite, Contacts.Read, User.Read, Presence.Read, Team.ReadBasic.All, ChannelMessage.Read.All, OnlineMeetings.ReadWrite
- **AI provider:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Deployment target:** Vercel
