import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // Verify account belongs to current user
      const { data: account, error: accountError } = await supabase
        .from('connected_accounts')
        .select('user_id')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (accountError || !account) {
        console.error('[Signatures API] Account not found:', accountError);
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      console.log('[Signatures API] Fetching signatures for user:', user.id, 'account:', accountId);

      // Fetch signatures for specific account + global signatures (account_id IS NULL)
      const { data: signatures, error } = await supabase
        .from('email_signatures')
        .select('*')
        .eq('user_id', user.id)
        .or(`account_id.eq.${accountId},account_id.is.null`)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Signatures API] Error fetching signatures from DB:', error);
        return NextResponse.json({ error: `Failed to fetch signatures: ${error.message}` }, { status: 500 });
      }

      console.log('[Signatures API] Successfully fetched', signatures?.length || 0, 'signatures');
      return NextResponse.json({ signatures });
    } else {
      // No accountId provided - fetch all signatures for current user
      console.log('[Signatures API] Fetching all signatures for user:', user.id);

      // Fetch all signatures for this user
      const { data: signatures, error } = await supabase
        .from('email_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Signatures API] Error fetching signatures from DB:', error);
        return NextResponse.json({ error: `Failed to fetch signatures: ${error.message}` }, { status: 500 });
      }

      console.log('[Signatures API] Successfully fetched', signatures?.length || 0, 'signatures');
      return NextResponse.json({ signatures });
    }
  } catch (error: any) {
    console.error('[Signatures API] Unexpected error in GET /api/signatures:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, body_html, account_id, is_default } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Signature name is required' }, { status: 400 });
    }

    if (!body_html || body_html.trim().length === 0) {
      return NextResponse.json({ error: 'Signature content is required' }, { status: 400 });
    }

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify account belongs to current user
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('user_id')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('[Signatures API] Account not found:', accountError);
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // If setting as default, unset all other defaults for this account
    if (is_default === true) {
      const updateQuery = supabase
        .from('email_signatures')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (account_id) {
        updateQuery.eq('account_id', account_id);
      } else {
        updateQuery.is('account_id', null);
      }

      await updateQuery;
    }

    // Insert new signature
    const { data: signature, error } = await supabase
      .from('email_signatures')
      .insert({
        user_id: user.id,
        account_id: account_id || null,
        name: name.trim(),
        body_html: body_html.trim(),
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating signature:', error);
      return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 });
    }

    return NextResponse.json({ signature }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/signatures:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
