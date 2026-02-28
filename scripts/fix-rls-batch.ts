/**
 * Batch RLS Fix Script
 * This script documents the pattern for fixing RLS bypasses
 *
 * Pattern to apply to all API routes:
 *
 * 1. Replace imports:
 *    OLD: import { createAdminClient } from '@/lib/supabase/admin';
 *    NEW: import { createClient, getCurrentUser } from '@/lib/supabase/server';
 *
 * 2. Add authentication:
 *    const user = await getCurrentUser();
 *    if (!user) {
 *      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *    }
 *
 * 3. Use RLS client:
 *    OLD: const supabase = createAdminClient();
 *    NEW: const supabase = await createClient();
 *
 * 4. Add tenant filtering:
 *    .eq('tenant_id', user.tenant_id)
 *
 * Files to fix (47 total):
 */

export const filesToFix = [
  'app/api/mail/messages/route.ts',
  'app/api/mail/messages/[id]/route.ts',
  'app/api/mail/messages/[id]/move/route.ts',
  'app/api/mail/messages/[id]/attachments/[attachmentId]/route.ts',
  'app/api/mail/folders/route.ts',
  'app/api/mail/folders/[id]/route.ts',
  'app/api/mail/search/route.ts',
  'app/api/mail/send/route.ts',
  'app/api/contacts/route.ts',
  'app/api/contacts/[id]/route.ts',
  'app/api/contacts/[id]/favorite/route.ts',
  'app/api/contacts/groups/route.ts',
  'app/api/contacts/sync/route.ts',
  'app/api/calendar/events/route.ts',
  'app/api/calendar/events/[id]/route.ts',
  'app/api/calendar/events/[id]/respond/route.ts',
  'app/api/calendar/sync/route.ts',
  'app/api/accounts/connect/route.ts',
  'app/api/accounts/connect/callback/route.ts',
  'app/api/accounts/[accountId]/stats/route.ts',
  'app/api/organization/members/route.ts',
  'app/api/invitations/route.ts',
  'app/api/invitations/verify/route.ts',
  'app/api/signatures/route.ts',
  'app/api/signatures/[id]/route.ts',
  'app/api/teams/route.ts',
  'app/api/teams/[teamId]/members/route.ts',
  'app/api/teams/messages/route.ts', // Partially fixed
  'app/api/teams/channels/route.ts',
  'app/api/teams/sync/route.ts',
  'app/api/sync/account/route.ts',
  'app/api/sync/messages/route.ts',
  'app/api/sync/folders/route.ts',
  'app/api/attachments/route.ts',
  'app/api/webhooks/manage/route.ts',
  'app/api/webhooks/graph/route.ts',
  'app/api/admin/all-invitations/route.ts',
  'app/api/admin/bootstrap/route.ts',
  'app/api/admin/organizations/route.ts',
  'app/api/debug/fix-folder-types/route.ts',
  'app/api/test/auth/route.ts',
  // AI and CRM routes already fixed in previous session
];

// Status: 10 fixed, 37 remaining
