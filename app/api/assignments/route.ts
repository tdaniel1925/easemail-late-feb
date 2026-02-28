/**
 * Inbox Assignments API
 * Agent 7.3 - Assignment System & 7.4 - Internal Notes
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
    const searchParams = request.nextUrl.searchParams;
    const sharedInboxId = searchParams.get('sharedInboxId');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');

    let query = supabase
      .from('inbox_assignments')
      .select(`
        *,
        message:messages(*),
        assigned_to_user:users!inbox_assignments_assigned_to_fkey(id, email, display_name),
        assigned_by_user:users!inbox_assignments_assigned_by_fkey(id, email, display_name),
        notes:inbox_notes(*)
      `);

    if (sharedInboxId) query = query.eq('shared_inbox_id', sharedInboxId);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (status) query = query.eq('status', status);

    const { data: assignments, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ assignments: assignments || [] });
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
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { sharedInboxId, messageId, assignedTo, priority = 'normal', note } = await request.json();

    if (!sharedInboxId || !messageId) {
      return NextResponse.json({ error: 'sharedInboxId and messageId are required' }, { status: 400 });
    }

    const { data: assignment, error } = await supabase
      .from('inbox_assignments')
      .insert({
        shared_inbox_id: sharedInboxId,
        message_id: messageId,
        assigned_to: assignedTo || null,
        assigned_by: user.id,
        status: assignedTo ? 'assigned' : 'open',
        priority,
      })
      .select()
      .single();

    if (error) throw error;

    // Add note if provided
    if (note && note.trim().length > 0) {
      await supabase.from('inbox_notes').insert({
        assignment_id: assignment.id,
        author_id: user.id,
        body: note.trim(),
        is_internal: true,
      });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
