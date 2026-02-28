import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * POST /api/contacts/[id]/favorite
 * Toggle favorite status for a contact
 *
 * This is a database-only operation (not synced to Microsoft Graph)
 * as favorites are a local preference
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.id;
    const supabase = await createClient();

    // Get current contact
    const { data: contact, error: fetchError } = await supabase
      .from('account_contacts')
      .select('id, is_favorite, display_name, email, account_id, connected_accounts!inner(tenant_id)')
      .eq('id', contactId)
      .eq('connected_accounts.tenant_id', user.tenant_id)
      .single();

    if (fetchError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Toggle favorite status
    const newFavoriteStatus = !contact.is_favorite;

    const { data: updatedContact, error: updateError } = await supabase
      .from('account_contacts')
      .update({
        is_favorite: newFavoriteStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select()
      .single();

    if (updateError) {
      console.error('[Contacts API] Failed to toggle favorite:', updateError);
      return NextResponse.json(
        { error: 'Failed to update favorite status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log(
      `[Contacts API] Toggled favorite for "${contact.display_name || contact.email}": ${newFavoriteStatus}`
    );

    return NextResponse.json({
      success: true,
      contact: updatedContact,
      is_favorite: newFavoriteStatus,
    });
  } catch (error: any) {
    console.error('[Contacts API] Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite status', details: error.message },
      { status: 500 }
    );
  }
}
