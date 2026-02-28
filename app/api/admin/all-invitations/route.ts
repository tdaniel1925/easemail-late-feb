import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// GET /api/admin/all-invitations - List all invitations across all organizations
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get all invitations with tenant and inviter details
    const query = supabase
      .from('invitations')
      .select(`
        *,
        tenant:tenant_id(id, name, display_name),
        invited_by_user:invited_by(display_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query.eq('status', status);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('[Admin All Invitations] Error fetching invitations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error: any) {
    console.error('[Admin All Invitations] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
