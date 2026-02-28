/**
 * CRM Contacts API
 * Agent 7.5 - CRM Contact & Deal Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('crm_contacts')
      .select('*')
      .eq('tenant_id', user.tenant_id);

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data: contacts, error } = await query
      .order('last_contacted_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ contacts: contacts || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { email, firstName, lastName, companyName, jobTitle, phone, tags, source = 'manual' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .insert({
        tenant_id: user.tenant_id,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        company_name: companyName || null,
        job_title: jobTitle || null,
        phone: phone || null,
        tags: tags || [],
        source,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
