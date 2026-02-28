/**
 * Teams Management API
 * Agent 7.1 - Team Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * GET /api/teams
 * List all teams for the user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all teams for tenant
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(count),
        created_by_user:users!teams_created_by_fkey(id, email, display_name)
      `)
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ teams: teams || [] });
  } catch (error: any) {
    console.error('[Teams API] Error listing teams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get user and tenant
    const { data: user } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Create team
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        tenant_id: user.tenant_id,
        name: name.trim(),
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add creator as team lead
    await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'lead',
      });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error: any) {
    console.error('[Teams API] Error creating team:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
