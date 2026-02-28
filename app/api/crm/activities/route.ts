/**
 * CRM Activities API
 * Agent 7.6 - Activity Logging
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
    const contactId = searchParams.get('contactId');
    const dealId = searchParams.get('dealId');
    const activityType = searchParams.get('activityType');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        contact:crm_contacts(*),
        deal:crm_deals(*),
        message:messages(id, subject),
        performed_by_user:users(id, email, display_name)
      `)
      .eq('tenant_id', user.tenant_id);

    if (contactId) query = query.eq('contact_id', contactId);
    if (dealId) query = query.eq('deal_id', dealId);
    if (activityType) query = query.eq('activity_type', activityType);

    const { data: activities, error } = await query
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ activities: activities || [] });
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

    const { contactId, dealId, messageId, activityType, subject, body } = await request.json();

    if (!contactId || !activityType) {
      return NextResponse.json({ error: 'contactId and activityType are required' }, { status: 400 });
    }

    const validTypes = ['email_sent', 'email_received', 'note', 'call', 'meeting', 'task'];
    if (!validTypes.includes(activityType)) {
      return NextResponse.json({ error: `activityType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const { data: activity, error } = await supabase
      .from('crm_activities')
      .insert({
        tenant_id: user.tenant_id,
        contact_id: contactId,
        deal_id: dealId || null,
        message_id: messageId || null,
        activity_type: activityType,
        subject: subject || null,
        body: body || null,
        performed_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update contact's last_contacted_at
    if (activityType === 'email_sent' || activityType === 'email_received') {
      await supabase
        .from('crm_contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', contactId);
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
