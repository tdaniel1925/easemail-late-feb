import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/invitations/verify?token=xxx - Verify an invitation token
// NOTE: This endpoint uses admin client because it's public (no auth required)
// Users need to verify invitation tokens before they have an account
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find invitation by token
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by_user:invited_by(display_name),
        tenant:tenant_id(name)
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      console.error('[Invitation Verify] Not found:', error);
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has been ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Return invitation details
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        tenant_name: invitation.tenant?.name || 'Unknown Organization',
        inviter_name: invitation.invited_by_user?.display_name || 'Someone',
        expires_at: invitation.expires_at,
      },
    });
  } catch (error: any) {
    console.error('[Invitation Verify] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
