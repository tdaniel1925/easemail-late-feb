import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// POST /api/admin/bootstrap - Create new organization and send first owner invitation
// Protected by API key or admin session - only for platform admins
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication - either via header (CLI) or cookie (web UI)
    const apiKey = request.headers.get('x-admin-api-key');
    const isAuthenticatedViaSession = await isAdminAuthenticated();

    if (!apiKey && !isAuthenticatedViaSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (apiKey && apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { organizationName, domain, ownerEmail, ownerName, plan = 'professional' } = body;

    // Validate required fields
    if (!organizationName || !domain || !ownerEmail) {
      return NextResponse.json(
        { error: 'organizationName, domain, and ownerEmail are required' },
        { status: 400 }
      );
    }

    // Check if tenant with this domain already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('name', domain)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Organization with this domain already exists' },
        { status: 409 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', ownerEmail.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if invitation already exists for this email
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', ownerEmail.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Pending invitation already exists for this email' },
        { status: 409 }
      );
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: domain,
        display_name: organizationName,
        plan: plan as 'free' | 'professional' | 'enterprise',
        max_seats: plan === 'free' ? 5 : plan === 'professional' ? 50 : 500,
        features: {
          ai_enabled: plan !== 'free',
          shared_inbox: plan === 'enterprise',
          custom_branding: plan === 'enterprise',
          advanced_analytics: plan === 'enterprise',
        },
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('[Admin Bootstrap] Failed to create tenant:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create organization', details: tenantError?.message },
        { status: 500 }
      );
    }

    // Create owner invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        tenant_id: tenant.id,
        email: ownerEmail.toLowerCase(),
        role: 'owner',
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        // Note: invited_by is NULL for admin-created invitations
      })
      .select()
      .single();

    if (invitationError || !invitation) {
      console.error('[Admin Bootstrap] Failed to create invitation:', invitationError);

      // Rollback: delete the tenant
      await supabase.from('tenants').delete().eq('id', tenant.id);

      return NextResponse.json(
        { error: 'Failed to create invitation', details: invitationError?.message },
        { status: 500 }
      );
    }

    // Generate invitation URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        display_name: tenant.display_name,
        plan: tenant.plan,
      },
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl,
      },
    });
  } catch (error: any) {
    console.error('[Admin Bootstrap] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
