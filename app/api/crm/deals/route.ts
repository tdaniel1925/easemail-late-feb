/**
 * CRM Deals API
 * Agent 7.5 - CRM Deal Management
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
    const stage = searchParams.get('stage');
    const assignedTo = searchParams.get('assignedTo');

    let query = supabase
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(*),
        company:crm_companies(*),
        assigned_user:users(id, email, display_name)
      `)
      .eq('tenant_id', user.tenant_id);

    if (stage) query = query.eq('stage', stage);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    const { data: deals, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ deals: deals || [] });
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

    const { contactId, companyId, title, value, currency = 'USD', stage = 'lead', probability = 0, expectedCloseDate, assignedTo, notes } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: deal, error } = await supabase
      .from('crm_deals')
      .insert({
        tenant_id: user.tenant_id,
        contact_id: contactId || null,
        company_id: companyId || null,
        title,
        value: value || null,
        currency,
        stage,
        probability,
        expected_close_date: expectedCloseDate || null,
        assigned_to: assignedTo || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
