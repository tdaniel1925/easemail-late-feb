import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// GET /api/admin/organizations - List all organizations
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get all tenants with user counts
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsError) {
      console.error('[Admin Organizations] Error fetching tenants:', tenantsError);
      return NextResponse.json({ error: tenantsError.message }, { status: 500 });
    }

    // Get user counts for each tenant
    const tenantsWithCounts = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        const { count: invitationCount } = await supabase
          .from('invitations')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'pending');

        return {
          ...tenant,
          user_count: userCount || 0,
          pending_invitations: invitationCount || 0,
        };
      })
    );

    // Get total stats
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      organizations: tenantsWithCounts,
      stats: {
        total_organizations: tenants?.length || 0,
        total_users: totalUsers || 0,
        pending_invitations: totalInvitations || 0,
      },
    });
  } catch (error: any) {
    console.error('[Admin Organizations] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
