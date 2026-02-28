import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

// GET /api/organization/members - List all members in the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all members in this tenant
    const { data: members, error } = await supabase
      .from('users')
      .select('id, email, display_name, role, created_at')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Organization Members API] Error fetching members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('[Organization Members API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
