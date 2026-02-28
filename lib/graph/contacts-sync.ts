import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GraphContact } from '@/types/contacts';

interface DeltaSyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  deltaToken?: string;
  errors: string[];
}

export class ContactsDeltaSyncService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Perform delta sync for contacts
   * Uses delta tokens to only fetch changes since last sync
   */
  async syncContacts(): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Get current delta token for this account
      const resourceType = 'contacts';
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('delta_token')
        .eq('account_id', this.accountId)
        .eq('resource_type', resourceType)
        .single();

      const deltaToken = syncState?.delta_token;

      // Build delta query URL
      // NOTE: Delta queries do NOT support $select, $filter, $orderby, $expand, or $search
      // These parameters will cause a 400 error from Microsoft Graph
      let deltaUrl = '/me/contacts/delta';

      // If we have a delta token, use it for incremental sync
      if (deltaToken) {
        deltaUrl = deltaToken; // Delta token contains full URL with skipToken
        console.log(`[Contacts Sync] Using delta token for incremental sync`);
      } else {
        console.log(`[Contacts Sync] Starting initial sync (full fetch)`);
      }

      // Fetch contacts using delta query
      let hasMore = true;
      let nextLink = deltaUrl;
      let newDeltaToken: string | undefined;

      while (hasMore) {
        try {
          const response = await this.graphClient.api(nextLink).get();

          const contacts: (GraphContact & { '@removed'?: { reason: string } })[] = response.value || [];
          console.log(`[Contacts Sync] Fetched ${contacts.length} contacts from Graph API`);

          // Process each contact
          for (const contact of contacts) {
            try {
              if (contact['@removed']) {
                // Contact was deleted
                console.log(`[Contacts Sync] Deleting contact: ${contact.id}`);
                await this.deleteContact(contact.id);
                result.deleted++;
              } else {
                // Contact was created or updated
                const isNew = await this.upsertContact(contact);
                if (isNew) {
                  result.created++;
                  console.log(`[Contacts Sync] ✓ Created: "${contact.displayName || contact.emailAddresses?.[0]?.address || '(No Name)'}"`);
                } else {
                  result.updated++;
                  console.log(`[Contacts Sync] ↻ Updated: "${contact.displayName || contact.emailAddresses?.[0]?.address}"`);
                }
              }
              result.synced++;
            } catch (error: any) {
              console.error(`[Contacts Sync] ✗ Failed to process contact "${contact.displayName || contact.id}": ${error.message}`);
              result.errors.push(`Failed to process contact ${contact.id}: ${error.message}`);
            }
          }

          // Check for next page or delta link
          if (response['@odata.nextLink']) {
            nextLink = response['@odata.nextLink'];
          } else if (response['@odata.deltaLink']) {
            newDeltaToken = response['@odata.deltaLink'];
            hasMore = false;
          } else {
            hasMore = false;
          }
        } catch (error: any) {
          result.errors.push(`Delta query failed: ${error.message}`);
          hasMore = false;
        }
      }

      // Store new delta token for next sync
      if (newDeltaToken) {
        await supabase
          .from('sync_state')
          .upsert({
            account_id: this.accountId,
            resource_type: resourceType,
            delta_token: newDeltaToken,
            last_sync_at: new Date().toISOString(),
            sync_status: 'completed',
          });

        result.deltaToken = newDeltaToken;
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Contacts delta sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Upsert a contact into the database
   * Returns true if created, false if updated
   */
  private async upsertContact(contact: GraphContact): Promise<boolean> {
    const supabase = createAdminClient();

    // Get primary email address
    const primaryEmail = contact.emailAddresses?.[0]?.address;

    // Skip contacts without email addresses (can't store without email due to UNIQUE constraint)
    if (!primaryEmail) {
      console.log(`[Contacts Sync] Skipping contact without email: ${contact.displayName || contact.id}`);
      return false;
    }

    // Check if contact exists (by graph_id first, then by email)
    const { data: existing } = await supabase
      .from('account_contacts')
      .select('id')
      .eq('account_id', this.accountId)
      .eq('graph_id', contact.id)
      .single();

    // Map Graph API contact to database fields with all enhanced fields from migration 004
    const contactData = {
      account_id: this.accountId,
      graph_id: contact.id,
      email: primaryEmail,
      display_name: contact.displayName || null,
      first_name: contact.givenName || null,
      last_name: contact.surname || null,
      middle_name: contact.middleName || null,
      nickname: contact.nickName || null,

      // Professional info
      company: contact.companyName || null,
      job_title: contact.jobTitle || null,
      department: contact.department || null,
      office_location: contact.officeLocation || null,
      profession: contact.profession || null,

      // Phone numbers (take first of each array)
      mobile_phone: contact.mobilePhone || null,
      home_phone: contact.homePhones?.[0] || null,
      business_phone: contact.businessPhones?.[0] || null,
      phone: contact.businessPhones?.[0] || contact.mobilePhone || contact.homePhones?.[0] || null, // Legacy field
      im_address: contact.imAddresses?.[0] || null,

      // Address (prefer business, fall back to home)
      street_address: contact.businessAddress?.street || contact.homeAddress?.street || null,
      city: contact.businessAddress?.city || contact.homeAddress?.city || null,
      state: contact.businessAddress?.state || contact.homeAddress?.state || null,
      postal_code: contact.businessAddress?.postalCode || contact.homeAddress?.postalCode || null,
      country: contact.businessAddress?.countryOrRegion || contact.homeAddress?.countryOrRegion || null,

      // Personal info
      birthday: contact.birthday || null,
      spouse_name: contact.spouseName || null,

      // Notes
      personal_notes: contact.personalNotes || null,

      // Categories and flags
      categories: contact.categories || [],
      is_favorite: contact.flag?.flagStatus === 'flagged' || false,

      // Source
      source: 'graph' as const,
      avatar_url: null, // Photos are handled separately via syncContactPhoto
    };

    if (existing) {
      // Update existing contact
      const { error } = await supabase
        .from('account_contacts')
        .update({
          ...contactData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update contact: ${error.message}`);
      }

      return false; // Updated
    } else {
      // Create new contact (handle potential email conflict)
      const { error } = await supabase
        .from('account_contacts')
        .insert(contactData);

      if (error) {
        // If email already exists for this account, update instead
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from('account_contacts')
            .update({
              ...contactData,
              updated_at: new Date().toISOString(),
            })
            .eq('account_id', this.accountId)
            .eq('email', primaryEmail);

          if (updateError) {
            throw new Error(`Failed to update existing contact: ${updateError.message}`);
          }

          return false; // Updated
        }

        throw new Error(`Failed to create contact: ${error.message}`);
      }

      return true; // Created
    }
  }

  /**
   * Delete a contact from the database
   */
  private async deleteContact(graphId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('account_contacts')
      .delete()
      .eq('account_id', this.accountId)
      .eq('graph_id', graphId);

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  }

  /**
   * Get sync statistics for an account
   */
  static async getSyncStats(accountId: string): Promise<{
    totalContacts: number;
    favoriteContacts: number;
    lastSyncAt: string | null;
  }> {
    const supabase = createAdminClient();

    const { count: totalCount } = await supabase
      .from('account_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const { count: favoriteCount } = await supabase
      .from('account_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_favorite', true);

    const { data: syncState } = await supabase
      .from('sync_state')
      .select('last_sync_at')
      .eq('account_id', accountId)
      .eq('resource_type', 'contacts')
      .single();

    return {
      totalContacts: totalCount || 0,
      favoriteContacts: favoriteCount || 0,
      lastSyncAt: syncState?.last_sync_at || null,
    };
  }

  /**
   * Sync contact folders/groups from Microsoft Graph
   * Maps to contact_groups table
   */
  async syncContactFolders(): Promise<DeltaSyncResult> {
    const result: DeltaSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const supabase = createAdminClient();

      // Fetch all contact folders from Graph API
      // Note: contactFolders endpoint does NOT support delta queries
      const response = await this.graphClient
        .api('/me/contactFolders')
        .get();

      const folders = response.value || [];
      console.log(`[Contacts Sync] Fetched ${folders.length} contact folders from Graph API`);

      // Process each folder
      for (const folder of folders) {
        try {
          const folderData = {
            account_id: this.accountId,
            graph_id: folder.id,
            name: folder.displayName,
            parent_group_id: null, // Will be resolved after all folders are synced
            is_system: false,
            sort_order: 0,
          };

          // Check if folder exists
          const { data: existing } = await supabase
            .from('contact_groups')
            .select('id')
            .eq('account_id', this.accountId)
            .eq('graph_id', folder.id)
            .single();

          if (existing) {
            // Update existing folder
            await supabase
              .from('contact_groups')
              .update({
                ...folderData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            result.updated++;
          } else {
            // Create new folder
            await supabase
              .from('contact_groups')
              .insert(folderData);

            result.created++;
          }

          result.synced++;
        } catch (error: any) {
          console.error(`[Contacts Sync] ✗ Failed to sync folder "${folder.displayName}": ${error.message}`);
          result.errors.push(`Failed to sync folder ${folder.id}: ${error.message}`);
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Contact folders sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Fetch and store contact photo from Microsoft Graph
   * Returns base64-encoded photo data
   */
  async syncContactPhoto(graphContactId: string): Promise<string | null> {
    try {
      // Fetch photo from Graph API
      const photoResponse = await this.graphClient
        .api(`/me/contacts/${graphContactId}/photo/$value`)
        .responseType('blob')
        .get();

      if (!photoResponse) {
        return null;
      }

      // Convert blob to base64
      const buffer = await photoResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = photoResponse.type || 'image/jpeg';
      const photoData = `data:${mimeType};base64,${base64}`;

      // Update contact in database
      const supabase = createAdminClient();
      await supabase
        .from('account_contacts')
        .update({ photo_data: photoData })
        .eq('account_id', this.accountId)
        .eq('graph_id', graphContactId);

      return photoData;
    } catch (error: any) {
      // Photo not found or error - this is non-fatal
      console.log(`[Contacts Sync] No photo for contact ${graphContactId}: ${error.message}`);
      return null;
    }
  }
}
