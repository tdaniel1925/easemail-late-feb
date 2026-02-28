import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Fetch signature (must belong to user)
    const { data: signature, error } = await supabase
      .from('email_signatures')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !signature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
    }

    return NextResponse.json({ signature });
  } catch (error: any) {
    console.error('Error in GET /api/signatures/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Verify signature belongs to user
    const { data: existingSignature, error: fetchError } = await supabase
      .from('email_signatures')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingSignature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, body_html, is_default } = body;

    // Build update object
    const updates: any = {};
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json({ error: 'Signature name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }
    if (body_html !== undefined) {
      if (body_html.trim().length === 0) {
        return NextResponse.json({ error: 'Signature content cannot be empty' }, { status: 400 });
      }
      updates.body_html = body_html.trim();
    }
    if (is_default !== undefined) {
      updates.is_default = is_default;
    }

    updates.updated_at = new Date().toISOString();

    // If setting as default, unset all other defaults for this account
    if (is_default === true) {
      const updateQuery = supabase
        .from('email_signatures')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id);

      if (existingSignature.account_id) {
        updateQuery.eq('account_id', existingSignature.account_id);
      } else {
        updateQuery.is('account_id', null);
      }

      await updateQuery;
    }

    // Update signature
    const { data: signature, error } = await supabase
      .from('email_signatures')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating signature:', error);
      return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 });
    }

    return NextResponse.json({ signature });
  } catch (error: any) {
    console.error('Error in PATCH /api/signatures/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Delete signature (must belong to user)
    const { error } = await supabase
      .from('email_signatures')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting signature:', error);
      return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/signatures/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
