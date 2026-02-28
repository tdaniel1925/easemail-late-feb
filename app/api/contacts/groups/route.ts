import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * GET /api/contacts/groups
 * List contact groups for an account
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - includeSystem (optional): Include system groups (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Optional parameters
    const includeSystem = searchParams.get('includeSystem') !== 'false';

    // Validate account exists and is active
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status, tenant_id')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status === 'error' || account.status === 'disconnected') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('contact_groups')
      .select('*, contact_count:contact_group_members(count)')
      .eq('account_id', accountId);

    // Filter system groups if requested
    if (!includeSystem) {
      query = query.eq('is_system', false);
    }

    // Sort by sort_order then name
    query = query.order('sort_order', { ascending: true })
                 .order('name', { ascending: true });

    // Execute query
    const { data: groups, error } = await query;

    if (error) {
      console.error('Error fetching contact groups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contact groups', details: error.message },
        { status: 500 }
      );
    }

    // Transform to include member count
    const transformedGroups = (groups || []).map(group => ({
      ...group,
      member_count: group.contact_count?.[0]?.count || 0,
    }));

    return NextResponse.json({
      groups: transformedGroups,
      total: transformedGroups.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/contacts/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts/groups
 * Create a new contact group
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - name (required): Group name
 * - description (optional): Group description
 * - color (optional): Hex color code (default: #6B7280)
 * - parent_group_id (optional): Parent group UUID for nested groups
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountId,
      name,
      description,
      color = '#6B7280',
      parent_group_id,
    } = body;

    // Validate required fields
    if (!accountId || !name) {
      return NextResponse.json(
        { error: 'accountId and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status, tenant_id')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if group with same name already exists for this account
    const { data: existingGroup } = await supabase
      .from('contact_groups')
      .select('id, name')
      .eq('account_id', accountId)
      .eq('name', name)
      .single();

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Contact group with this name already exists for this account' },
        { status: 409 }
      );
    }

    // Create group
    const groupData = {
      account_id: accountId,
      graph_id: null, // Manual groups don't have Graph IDs
      name,
      description: description || null,
      color,
      parent_group_id: parent_group_id || null,
      is_system: false,
      sort_order: 0,
    };

    const { data: newGroup, error: insertError } = await supabase
      .from('contact_groups')
      .insert(groupData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating contact group:', insertError);
      return NextResponse.json(
        { error: 'Failed to create contact group', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      group: newGroup,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/contacts/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
