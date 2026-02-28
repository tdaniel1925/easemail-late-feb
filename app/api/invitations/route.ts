import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

// GET /api/invitations - List all invitations for the current user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can view invitations
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - insufficient permissions' }, { status: 403 });
    }

    const supabase = await createClient();

    // Get all invitations for this tenant
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Invitations API] Error fetching invitations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitations });
  } catch (error: any) {
    console.error('[Invitations API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can send invitations' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists in this tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('email', email)
      .eq('tenant_id', user.tenant_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        tenant_id: user.tenant_id,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Invitations API] Error creating invitation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Send invitation email
    console.log(`[Invitations API] Invitation created: ${invitation.token}`);
    console.log(`[Invitations API] Accept URL: /accept-invite?token=${invitation.token}`);

    return NextResponse.json({ invitation });
  } catch (error: any) {
    console.error('[Invitations API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invitations?id=xxx - Cancel/delete an invitation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - insufficient permissions' }, { status: 403 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID required' },
        { status: 400 }
      );
    }

    // Verify invitation belongs to this tenant and delete it
    // RLS will prevent deleting invitations from other tenants
    const { data: invitation } = await supabase
      .from('invitations')
      .select('tenant_id')
      .eq('id', invitationId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Delete invitation
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .eq('tenant_id', user.tenant_id);

    if (error) {
      console.error('[Invitations API] Error deleting invitation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Invitations API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
