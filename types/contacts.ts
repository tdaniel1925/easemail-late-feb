// ================================================================
// EaseMail v3.0 - Contacts Module Type Definitions
// Based on migration 004_contacts_enhancement.sql
// ================================================================

/**
 * Core Contact entity
 * Represents a contact from Microsoft Graph or manually created
 */
export interface Contact {
  // Core identity fields
  id: string;
  account_id: string;
  graph_id: string | null; // null for manually created contacts
  email: string;

  // Name fields
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  nickname: string | null;

  // Professional info
  company: string | null;
  job_title: string | null;
  department: string | null;
  office_location: string | null;
  profession: string | null;

  // Contact methods
  mobile_phone: string | null;
  home_phone: string | null;
  business_phone: string | null;
  phone: string | null; // Legacy field from migration 001
  im_address: string | null;

  // Address
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;

  // Personal info
  birthday: string | null; // ISO date string
  anniversary: string | null; // ISO date string
  spouse_name: string | null;

  // Media & metadata
  avatar_url: string | null;
  photo_data: string | null; // base64 encoded from Graph API

  // Notes & organization
  notes: string | null;
  personal_notes: string | null;
  categories: string[] | null; // Array of category tags from Graph API

  // Interaction tracking
  email_count: number | null; // Total emails sent/received with this contact
  last_emailed_at: string | null; // ISO timestamp

  // System fields
  is_favorite: boolean | null;
  source: 'graph' | 'manual' | 'inferred';
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Contact Group (folder) for organizing contacts
 * Examples: Work, Family, Friends, VIP Clients, etc.
 */
export interface ContactGroup {
  id: string;
  account_id: string;
  graph_id: string | null; // from Microsoft Graph contactFolders
  name: string;
  description: string | null;
  color: string; // hex color for UI (#6B7280 default)
  parent_group_id: string | null; // for nested groups
  is_system: boolean; // true for built-in groups (All, Favorites, etc.)
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Junction table entry for many-to-many Contact ↔ Group relationship
 * A contact can belong to multiple groups
 */
export interface ContactGroupMember {
  contact_id: string;
  group_id: string;
  added_at: string | null;
}

/**
 * Interaction history with a contact
 * Tracks all emails, meetings, calls
 */
export interface ContactInteraction {
  id: string;
  account_id: string;
  contact_id: string;
  interaction_type: 'email_sent' | 'email_received' | 'meeting' | 'call' | 'note';

  // Foreign keys to related records (only one will be set)
  message_id: string | null;
  event_id: string | null;

  // Interaction details
  subject: string | null;
  snippet: string | null; // First 200 chars of body or meeting notes
  occurred_at: string; // ISO timestamp

  created_at: string | null;
}

/**
 * Microsoft Graph API Contact response type
 * Used for syncing from Graph API /me/contacts
 */
export interface GraphContact {
  id: string;
  emailAddresses: Array<{
    address: string;
    name?: string;
  }>;
  displayName?: string;
  givenName?: string;
  surname?: string;
  middleName?: string;
  nickName?: string;
  jobTitle?: string;
  companyName?: string;
  department?: string;
  officeLocation?: string;
  profession?: string;
  mobilePhone?: string;
  homePhones?: string[];
  businessPhones?: string[];
  imAddresses?: string[];
  homeAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryOrRegion?: string;
  };
  businessAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryOrRegion?: string;
  };
  birthday?: string; // ISO date
  spouseName?: string;
  personalNotes?: string;
  categories?: string[];
  flag?: {
    flagStatus: 'flagged' | 'complete' | 'notFlagged';
  };
}

/**
 * Microsoft Graph API ContactFolder response type
 * Used for syncing contact groups from /me/contactFolders
 */
export interface GraphContactFolder {
  id: string;
  parentFolderId: string | null;
  displayName: string;
}

/**
 * Delta sync response from Graph API
 * Contains contacts/folders and nextLink/deltaLink for pagination
 */
export interface GraphContactDeltaResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string; // Pagination link
  '@odata.deltaLink'?: string; // Token for next delta sync
  value: GraphContact[];
}

export interface GraphContactFolderDeltaResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
  value: GraphContactFolder[];
}

/**
 * Client-side display contact with computed fields
 * Used in UI components for enriched display
 */
export interface ContactWithGroups extends Contact {
  groups?: ContactGroup[];
  recentInteractions?: ContactInteraction[];
  initials?: string; // Computed: first letter of first + last name
  fullName?: string; // Computed: first + middle + last
}

/**
 * Filter/search options for contact list
 */
export interface ContactFilters {
  searchQuery?: string;
  groupId?: string | null;
  isFavorite?: boolean;
  source?: 'graph' | 'manual' | 'inferred';
  hasEmail?: boolean;
  sortBy?: 'name' | 'email' | 'company' | 'lastEmailed' | 'created';
  sortOrder?: 'asc' | 'desc';
}

/**
 * API response types
 */
export interface ContactsListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactGroupsListResponse {
  groups: ContactGroup[];
  total: number;
}

export interface ContactSyncResponse {
  success: boolean;
  synced: number;
  errors?: string[];
  deltaLink?: string;
}

/**
 * Contact editor form data
 * Used in ContactEditorModal component
 */
export interface ContactFormData {
  // Name
  first_name: string;
  last_name: string;
  middle_name?: string;
  nickname?: string;
  display_name?: string;

  // Contact
  email: string;
  mobile_phone?: string;
  home_phone?: string;
  business_phone?: string;
  im_address?: string;

  // Professional
  company?: string;
  job_title?: string;
  department?: string;
  office_location?: string;
  profession?: string;

  // Address
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Personal
  birthday?: string;
  anniversary?: string;
  spouse_name?: string;

  // Notes
  notes?: string;
  personal_notes?: string;

  // Organization
  categories?: string[];
  is_favorite?: boolean;
}
