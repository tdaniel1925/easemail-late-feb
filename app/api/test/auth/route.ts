import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * TEST-ONLY endpoint to create a test user and session for E2E tests
 * This should ONLY work in development/test environments
 */
export async function GET() {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // Create or get test tenant
    const { data: testTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('name', 'test-org')
      .single();

    let tenantId = testTenant?.id;

    if (!testTenant) {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          id: crypto.randomUUID(),
          name: 'test-org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating test tenant:', tenantError);
        return NextResponse.json({ error: 'Failed to create test tenant' }, { status: 500 });
      }

      tenantId = newTenant.id;
    }

    // Create or get test user
    const testEmail = 'test@playwright.com';
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          email: testEmail,
          display_name: 'Test User',
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating test user:', userError);
        return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
      }

      userId = newUser.id;
    }

    // Create test connected account (optional - for tests that need an email account)
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingAccount) {
      await supabase
        .from('connected_accounts')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          tenant_id: tenantId,
          email: testEmail,
          provider: 'microsoft',
          status: 'connected',
          access_token: 'test_token',
          refresh_token: 'test_refresh',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    // Return success - the session cookie will be set by middleware
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: testEmail,
        tenantId,
      },
    });
  } catch (error: any) {
    console.error('Test auth setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
