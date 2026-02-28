/**
 * Shared Inboxes API
 * Agent 7.2 - Shared Inbox Setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: sharedInboxes, error } = await supabase
      .from('shared_inboxes')
      .select(`
        *,
        team:teams(*),
        account:connected_accounts(*)
      `)
      .eq('teams.tenant_id', user.tenant_id);

    if (error) throw error;

    return NextResponse.json({ sharedInboxes: sharedInboxes || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { teamId, accountId, name, description, autoAssignStrategy = 'round_robin' } = await request.json();

    if (!teamId || !accountId || !name) {
      return NextResponse.json({ error: 'teamId, accountId, and name are required' }, { status: 400 });
    }

    const { data: sharedInbox, error } = await supabase
      .from('shared_inboxes')
      .insert({
        team_id: teamId,
        account_id: accountId,
        name,
        description,
        auto_assign_strategy: autoAssignStrategy,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ sharedInbox }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
