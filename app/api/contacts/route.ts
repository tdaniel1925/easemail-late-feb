import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * GET /api/contacts
 * List contacts with pagination, filtering, and search
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 * - search (optional): Search by name or email
 * - company (optional): Filter by company
 * - source (optional): Filter by source (graph, manual, inferred)
 * - isFavorite (optional): Filter by favorite status (true/false)
 * - groupId (optional): Filter by contact group UUID
 * - sortBy (optional): Sort field (display_name, email, company, last_emailed_at)
 * - sortOrder (optional): Sort direction (asc, desc - default: asc)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Required or alternative parameters
    const accountId = searchParams.get('accountId');
    const email = searchParams.get('email');

    // Allow either accountId OR email filter
    if (!accountId && !email) {
      return NextResponse.json(
        { error: 'accountId or email is required' },
        { status: 400 }
      );
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );
    const offset = (page - 1) * limit;

    // Filter parameters
    const search = searchParams.get('search');
    const company = searchParams.get('company');
    const source = searchParams.get('source');
    const isFavorite = searchParams.get('isFavorite');
    const groupId = searchParams.get('groupId');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'display_name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    // If accountId is provided, validate it belongs to user's tenant
    if (accountId) {
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
    }

    // Build query
    let query = supabase
      .from('account_contacts')
      .select('*', { count: 'exact' });

    // Apply accountId filter if provided
    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    // Apply email filter if provided (exact match)
    if (email) {
      query = query.eq('email', email);
    }

    // Apply search filter (search in display_name, email, first_name, last_name)
    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `first_name.ilike.%${search}%,` +
        `last_name.ilike.%${search}%`
      );
    }

    // Apply company filter
    if (company) {
      query = query.eq('company', company);
    }

    // Apply source filter
    if (source && ['graph', 'manual', 'inferred'].includes(source)) {
      query = query.eq('source', source);
    }

    // Apply favorite filter
    if (isFavorite !== null && (isFavorite === 'true' || isFavorite === 'false')) {
      query = query.eq('is_favorite', isFavorite === 'true');
    }

    // Apply group filter (join with contact_group_members)
    if (groupId) {
      // TODO: Implement group filtering with JOIN
      // For now, we'll fetch all contacts and filter client-side
      // Proper implementation would use:
      // query = query.in('id', supabase.from('contact_group_members').select('contact_id').eq('group_id', groupId))
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contacts', details: error.message },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      contacts: contacts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Create a new contact manually (source: 'manual')
 *
 * Body:
 * - accountId (required): Connected account UUID
 * - email (required): Contact email address
 * - first_name (optional): First name
 * - last_name (optional): Last name
 * - display_name (optional): Display name (auto-generated if not provided)
 * - company (optional): Company name
 * - job_title (optional): Job title
 * - phone (optional): Phone number
 * - mobile_phone (optional): Mobile phone
 * - notes (optional): Notes about the contact
 * - is_favorite (optional): Mark as favorite (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountId,
      email,
      first_name,
      last_name,
      display_name,
      middle_name,
      nickname,
      company,
      job_title,
      department,
      office_location,
      profession,
      mobile_phone,
      home_phone,
      business_phone,
      phone,
      im_address,
      street_address,
      city,
      state,
      postal_code,
      country,
      birthday,
      anniversary,
      spouse_name,
      notes,
      personal_notes,
      categories,
      is_favorite = false,
    } = body;

    // Validate required fields
    if (!accountId || !email) {
      return NextResponse.json(
        { error: 'accountId and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Auto-generate display_name if not provided
    const finalDisplayName = display_name ||
      (first_name && last_name ? `${first_name} ${last_name}` :
       first_name || last_name || email);

    // Check if contact with same email already exists for this account
    const { data: existingContact } = await supabase
      .from('account_contacts')
      .select('id, email')
      .eq('account_id', accountId)
      .eq('email', email)
      .single();

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact with this email already exists for this account' },
        { status: 409 }
      );
    }

    // Create contact
    const contactData = {
      account_id: accountId,
      graph_id: null, // Manual contacts don't have Graph IDs
      email,
      display_name: finalDisplayName,
      first_name: first_name || null,
      last_name: last_name || null,
      middle_name: middle_name || null,
      nickname: nickname || null,
      company: company || null,
      job_title: job_title || null,
      department: department || null,
      office_location: office_location || null,
      profession: profession || null,
      mobile_phone: mobile_phone || null,
      home_phone: home_phone || null,
      business_phone: business_phone || null,
      phone: phone || mobile_phone || business_phone || home_phone || null,
      im_address: im_address || null,
      street_address: street_address || null,
      city: city || null,
      state: state || null,
      postal_code: postal_code || null,
      country: country || null,
      birthday: birthday || null,
      anniversary: anniversary || null,
      spouse_name: spouse_name || null,
      notes: notes || null,
      personal_notes: personal_notes || null,
      categories: categories || [],
      is_favorite: is_favorite || false,
      source: 'manual',
      email_count: 0,
      last_emailed_at: null,
    };

    const { data: newContact, error: insertError } = await supabase
      .from('account_contacts')
      .insert(contactData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating contact:', insertError);
      return NextResponse.json(
        { error: 'Failed to create contact', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: newContact,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
