import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClientWithToken } from '@/lib/graph/client';
import { tokenService } from '@/lib/graph/token-service';

/**
 * GET /api/contacts/[id]
 * Get a single contact by ID
 */
export async function GET(
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

    // Get contact and validate tenant access via connected_accounts join
    const { data: contact, error } = await supabase
      .from('account_contacts')
      .select(`
        *,
        connected_accounts!inner(tenant_id)
      `)
      .eq('id', contactId)
      .eq('connected_accounts.tenant_id', user.tenant_id)
      .single();

    if (error || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error: any) {
    console.error('[Contacts API] Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Update a contact
 *
 * For manual contacts (source='manual', graph_id=null): Updates database only
 * For Graph contacts (source='graph', graph_id!=null): Updates via Microsoft Graph then syncs to database
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.id;
    const body = await request.json();
    const supabase = await createClient();

    // Get contact from database
    const { data: contact, error: contactError } = await supabase
      .from('account_contacts')
      .select('account_id, connected_accounts!inner(tenant_id), *')
      .eq('id', contactId)
      .eq('connected_accounts.tenant_id', user.tenant_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // For manual contacts, update database directly
    if (contact.source === 'manual' || !contact.graph_id) {
      // Build update object with all allowed fields
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Name fields
      if (body.first_name !== undefined) updateData.first_name = body.first_name;
      if (body.last_name !== undefined) updateData.last_name = body.last_name;
      if (body.middle_name !== undefined) updateData.middle_name = body.middle_name;
      if (body.nickname !== undefined) updateData.nickname = body.nickname;
      if (body.display_name !== undefined) updateData.display_name = body.display_name;
      if (body.email !== undefined) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
          );
        }
        updateData.email = body.email;
      }

      // Professional fields
      if (body.company !== undefined) updateData.company = body.company;
      if (body.job_title !== undefined) updateData.job_title = body.job_title;
      if (body.department !== undefined) updateData.department = body.department;
      if (body.office_location !== undefined) updateData.office_location = body.office_location;
      if (body.profession !== undefined) updateData.profession = body.profession;

      // Contact fields
      if (body.mobile_phone !== undefined) updateData.mobile_phone = body.mobile_phone;
      if (body.home_phone !== undefined) updateData.home_phone = body.home_phone;
      if (body.business_phone !== undefined) updateData.business_phone = body.business_phone;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.im_address !== undefined) updateData.im_address = body.im_address;

      // Address fields
      if (body.street_address !== undefined) updateData.street_address = body.street_address;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.state !== undefined) updateData.state = body.state;
      if (body.postal_code !== undefined) updateData.postal_code = body.postal_code;
      if (body.country !== undefined) updateData.country = body.country;

      // Personal fields
      if (body.birthday !== undefined) updateData.birthday = body.birthday;
      if (body.anniversary !== undefined) updateData.anniversary = body.anniversary;
      if (body.spouse_name !== undefined) updateData.spouse_name = body.spouse_name;

      // Notes
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.personal_notes !== undefined) updateData.personal_notes = body.personal_notes;

      // Categories and favorite
      if (body.categories !== undefined) updateData.categories = body.categories;
      if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite;

      const { data: updatedContact, error: updateError } = await supabase
        .from('account_contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (updateError) {
        console.error('[Contacts API] Failed to update contact:', updateError);
        return NextResponse.json(
          { error: 'Failed to update contact', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contact: updatedContact,
      });
    }

    // For Graph contacts, update via Microsoft Graph API
    try {
      const accessToken = await tokenService.getAccessToken(contact.account_id);
      const graphClient = createGraphClientWithToken(accessToken);

      // Build Graph API update object
      const graphUpdate: any = {};

      if (body.first_name !== undefined) graphUpdate.givenName = body.first_name;
      if (body.last_name !== undefined) graphUpdate.surname = body.last_name;
      if (body.middle_name !== undefined) graphUpdate.middleName = body.middle_name;
      if (body.nickname !== undefined) graphUpdate.nickName = body.nickname;
      if (body.display_name !== undefined) graphUpdate.displayName = body.display_name;

      if (body.company !== undefined) graphUpdate.companyName = body.company;
      if (body.job_title !== undefined) graphUpdate.jobTitle = body.job_title;
      if (body.department !== undefined) graphUpdate.department = body.department;
      if (body.office_location !== undefined) graphUpdate.officeLocation = body.office_location;
      if (body.profession !== undefined) graphUpdate.profession = body.profession;

      if (body.mobile_phone !== undefined) graphUpdate.mobilePhone = body.mobile_phone;
      if (body.home_phone !== undefined) graphUpdate.homePhones = [body.home_phone];
      if (body.business_phone !== undefined) graphUpdate.businessPhones = [body.business_phone];
      if (body.im_address !== undefined) graphUpdate.imAddresses = [body.im_address];

      if (body.birthday !== undefined) graphUpdate.birthday = body.birthday;
      if (body.spouse_name !== undefined) graphUpdate.spouseName = body.spouse_name;
      if (body.personal_notes !== undefined) graphUpdate.personalNotes = body.personal_notes;
      if (body.categories !== undefined) graphUpdate.categories = body.categories;

      // Email update requires different handling - must update emailAddresses array
      if (body.email !== undefined) {
        graphUpdate.emailAddresses = [{
          address: body.email,
          name: body.display_name || contact.display_name || body.email,
        }];
      }

      // Address (business or home)
      if (body.street_address !== undefined || body.city !== undefined || body.state !== undefined || body.postal_code !== undefined || body.country !== undefined) {
        graphUpdate.businessAddress = {
          street: body.street_address || contact.street_address || '',
          city: body.city || contact.city || '',
          state: body.state || contact.state || '',
          postalCode: body.postal_code || contact.postal_code || '',
          countryOrRegion: body.country || contact.country || '',
        };
      }

      // Update via Graph API
      await graphClient
        .api(`/me/contacts/${contact.graph_id}`)
        .patch(graphUpdate);

      console.log('[Contacts API] Updated Graph contact:', contact.graph_id);

      // Now update database with same data
      const dbUpdate: any = {
        updated_at: new Date().toISOString(),
        ...Object.keys(body).reduce((acc: any, key) => {
          // Map fields that exist in our database
          if (key in contact && key !== 'id' && key !== 'account_id' && key !== 'graph_id' && key !== 'source') {
            acc[key] = body[key];
          }
          return acc;
        }, {}),
      };

      const { data: updatedContact, error: dbError } = await supabase
        .from('account_contacts')
        .update(dbUpdate)
        .eq('id', contactId)
        .select()
        .single();

      if (dbError) {
        console.error('[Contacts API] Failed to update contact in database:', dbError);
        return NextResponse.json(
          { error: 'Contact updated in Graph but failed to sync to database', details: dbError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contact: updatedContact,
      });
    } catch (graphError: any) {
      console.error('[Contacts API] Failed to update Graph contact:', graphError);
      return NextResponse.json(
        { error: 'Failed to update contact via Microsoft Graph', details: graphError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Contacts API] Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Delete a contact
 *
 * For manual contacts (source='manual', graph_id=null): Deletes from database only
 * For Graph contacts (source='graph', graph_id!=null): Deletes via Microsoft Graph then from database
 */
export async function DELETE(
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

    // Get contact from database
    const { data: contact, error: contactError } = await supabase
      .from('account_contacts')
      .select('account_id, connected_accounts!inner(tenant_id), *')
      .eq('id', contactId)
      .eq('connected_accounts.tenant_id', user.tenant_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // For manual contacts, delete from database only
    if (contact.source === 'manual' || !contact.graph_id) {
      const { error: deleteError } = await supabase
        .from('account_contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) {
        console.error('[Contacts API] Failed to delete contact:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete contact', details: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    }

    // For Graph contacts, delete via Microsoft Graph API
    try {
      const accessToken = await tokenService.getAccessToken(contact.account_id);
      const graphClient = createGraphClientWithToken(accessToken);

      // Delete via Graph API
      await graphClient
        .api(`/me/contacts/${contact.graph_id}`)
        .delete();

      console.log('[Contacts API] Deleted Graph contact:', contact.graph_id);

      // Delete from database
      const { error: deleteError } = await supabase
        .from('account_contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) {
        console.error('[Contacts API] Failed to delete contact from database:', deleteError);
        return NextResponse.json(
          { error: 'Contact deleted from Graph but failed to delete from database', details: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (graphError: any) {
      console.error('[Contacts API] Failed to delete Graph contact:', graphError);
      return NextResponse.json(
        { error: 'Failed to delete contact via Microsoft Graph', details: graphError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Contacts API] Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact', details: error.message },
      { status: 500 }
    );
  }
}
