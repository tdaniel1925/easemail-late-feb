export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_contacts: {
        Row: {
          account_id: string
          avatar_url: string | null
          company: string | null
          created_at: string | null
          display_name: string | null
          email: string
          email_count: number | null
          first_name: string | null
          graph_id: string | null
          id: string
          job_title: string | null
          last_emailed_at: string | null
          last_name: string | null
          phone: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          email_count?: number | null
          first_name?: string | null
          graph_id?: string | null
          id?: string
          job_title?: string | null
          last_emailed_at?: string | null
          last_name?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          email_count?: number | null
          first_name?: string | null
          graph_id?: string | null
          id?: string
          job_title?: string | null
          last_emailed_at?: string | null
          last_name?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_folders: {
        Row: {
          account_id: string
          created_at: string | null
          custom_color: string | null
          display_name: string
          folder_type: string | null
          graph_id: string
          id: string
          is_favorite: boolean | null
          is_hidden: boolean | null
          last_synced_at: string | null
          parent_graph_id: string | null
          sort_order: number | null
          total_count: number | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          custom_color?: string | null
          display_name: string
          folder_type?: string | null
          graph_id: string
          id?: string
          is_favorite?: boolean | null
          is_hidden?: boolean | null
          last_synced_at?: string | null
          parent_graph_id?: string | null
          sort_order?: number | null
          total_count?: number | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          custom_color?: string | null
          display_name?: string
          folder_type?: string | null
          graph_id?: string
          id?: string
          is_favorite?: boolean | null
          is_hidden?: boolean | null
          last_synced_at?: string | null
          parent_graph_id?: string | null
          sort_order?: number | null
          total_count?: number | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_folders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_tokens: {
        Row: {
          access_token: string
          account_id: string
          created_at: string | null
          expires_at: string
          id: string
          last_refresh_error: string | null
          last_refreshed_at: string | null
          refresh_failure_count: number | null
          refresh_token: string
          scopes: string[]
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          last_refresh_error?: string | null
          last_refreshed_at?: string | null
          refresh_failure_count?: number | null
          refresh_token: string
          scopes: string[]
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          last_refresh_error?: string | null
          last_refreshed_at?: string | null
          refresh_failure_count?: number | null
          refresh_token?: string
          scopes?: string[]
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string | null
          graph_id: string
          id: string
          is_cached: boolean | null
          is_inline: boolean | null
          message_id: string
          name: string
          size_bytes: number | null
          storage_path: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          graph_id: string
          id?: string
          is_cached?: boolean | null
          is_inline?: boolean | null
          message_id: string
          name: string
          size_bytes?: number | null
          storage_path?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          graph_id?: string
          id?: string
          is_cached?: boolean | null
          is_inline?: boolean | null
          message_id?: string
          name?: string
          size_bytes?: number | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_senders: {
        Row: {
          blocked_at: string | null
          domain: string | null
          email: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          domain?: string | null
          email: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          domain?: string | null
          email?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_senders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          color: string | null
          created_at: string | null
          display_name: string | null
          email: string
          error_count: number | null
          id: string
          initial_sync_complete: boolean | null
          is_default: boolean | null
          last_error_at: string | null
          last_full_sync_at: string | null
          messages_synced: number | null
          microsoft_id: string
          sort_order: number | null
          status: string
          status_message: string | null
          tenant_id_ms: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          error_count?: number | null
          id?: string
          initial_sync_complete?: boolean | null
          is_default?: boolean | null
          last_error_at?: string | null
          last_full_sync_at?: string | null
          messages_synced?: number | null
          microsoft_id: string
          sort_order?: number | null
          status?: string
          status_message?: string | null
          tenant_id_ms?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          error_count?: number | null
          id?: string
          initial_sync_complete?: boolean | null
          is_default?: boolean | null
          last_error_at?: string | null
          last_full_sync_at?: string | null
          messages_synced?: number | null
          microsoft_id?: string
          sort_order?: number | null
          status?: string
          status_message?: string | null
          tenant_id_ms?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          body: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          message_id: string | null
          performed_at: string | null
          performed_by: string | null
          subject: string | null
          tenant_id: string
        }
        Insert: {
          activity_type: string
          body?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          message_id?: string | null
          performed_at?: string | null
          performed_by?: string | null
          subject?: string | null
          tenant_id: string
        }
        Update: {
          activity_type?: string
          body?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          message_id?: string | null
          performed_at?: string | null
          performed_by?: string | null
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          size: string | null
          tenant_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          size?: string | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          size?: string | null
          tenant_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_contact_id: string | null
          address: Json | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          job_title: string | null
          last_contacted_at: string | null
          last_name: string | null
          phone: string | null
          source: string | null
          tags: string[] | null
          tenant_id: string
          total_emails: number | null
          updated_at: string | null
        }
        Insert: {
          account_contact_id?: string | null
          address?: Json | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          tenant_id: string
          total_emails?: number | null
          updated_at?: string | null
        }
        Update: {
          account_contact_id?: string | null
          address?: Json | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          tenant_id?: string
          total_emails?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_contact_id_fkey"
            columns: ["account_contact_id"]
            isOneToOne: false
            referencedRelation: "account_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          stage: string | null
          tenant_id: string
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_signatures: {
        Row: {
          account_id: string | null
          body_html: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          body_html: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          body_html?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_signatures_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          category: string | null
          created_at: string | null
          created_by: string
          id: string
          is_shared: boolean | null
          name: string
          subject: string | null
          tenant_id: string
          updated_at: string | null
          use_count: number | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          category?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_shared?: boolean | null
          name: string
          subject?: string | null
          tenant_id: string
          updated_at?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          category?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_shared?: boolean | null
          name?: string
          subject?: string | null
          tenant_id?: string
          updated_at?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          message_id: string
          remind_at: string
          reminded_at: string | null
          replied_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          message_id: string
          remind_at: string
          reminded_at?: string | null
          replied_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          message_id?: string
          remind_at?: string
          reminded_at?: string | null
          replied_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          message_id: string
          priority: string | null
          resolved_at: string | null
          shared_inbox_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message_id: string
          priority?: string | null
          resolved_at?: string | null
          shared_inbox_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message_id?: string
          priority?: string | null
          resolved_at?: string | null
          shared_inbox_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_assignments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_assignments_shared_inbox_id_fkey"
            columns: ["shared_inbox_id"]
            isOneToOne: false
            referencedRelation: "shared_inboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_notes: {
        Row: {
          assignment_id: string
          author_id: string
          body: string
          created_at: string | null
          id: string
          is_internal: boolean | null
        }
        Insert: {
          assignment_id: string
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
        }
        Update: {
          assignment_id?: string
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_notes_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "inbox_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_splits: {
        Row: {
          ai_category: string | null
          color: string | null
          created_at: string | null
          filter_type: string
          icon: string | null
          id: string
          is_enabled: boolean | null
          name: string
          rule_conditions: Json | null
          sort_order: number | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          color?: string | null
          created_at?: string | null
          filter_type: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          rule_conditions?: Json | null
          sort_order?: number | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_category?: string | null
          color?: string | null
          created_at?: string | null
          filter_type?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          rule_conditions?: Json | null
          sort_order?: number | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string | null
          status: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string | null
          status?: string | null
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string | null
          status?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_failures: {
        Row: {
          account_id: string | null
          context: Json | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          job_id: string
          job_name: string
          retry_count: number | null
        }
        Insert: {
          account_id?: string | null
          context?: Json | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          job_id: string
          job_name: string
          retry_count?: number | null
        }
        Update: {
          account_id?: string | null
          context?: Json | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          job_id?: string
          job_name?: string
          retry_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_failures_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_rules: {
        Row: {
          account_id: string
          actions: Json
          conditions: Json
          created_at: string | null
          graph_rule_id: string | null
          id: string
          is_enabled: boolean | null
          name: string
          priority: number | null
          stop_processing: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          actions?: Json
          conditions?: Json
          created_at?: string | null
          graph_rule_id?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          priority?: number | null
          stop_processing?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          actions?: Json
          conditions?: Json
          created_at?: string | null
          graph_rule_id?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          priority?: number | null
          stop_processing?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      message_labels: {
        Row: {
          created_at: string | null
          label_id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          label_id: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          label_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_labels_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_tracking: {
        Row: {
          created_at: string | null
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          message_id: string
          open_count: number | null
          opens: Json | null
          read_receipt_requested: boolean | null
          tracking_pixel_id: string | null
        }
        Insert: {
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          message_id: string
          open_count?: number | null
          opens?: Json | null
          read_receipt_requested?: boolean | null
          tracking_pixel_id?: string | null
        }
        Update: {
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          message_id?: string
          open_count?: number | null
          opens?: Json | null
          read_receipt_requested?: boolean | null
          tracking_pixel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_tracking_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          account_id: string
          ai_category: string | null
          ai_priority_score: number | null
          ai_processed_at: string | null
          ai_sentiment: string | null
          ai_summary: string | null
          attachment_count: number | null
          bcc_recipients: Json | null
          body_content_type: string | null
          body_html: string | null
          body_text: string | null
          categories: string[] | null
          cc_recipients: Json | null
          conversation_id: string | null
          conversation_index: string | null
          created_at: string | null
          folder_id: string
          from_address: string | null
          from_name: string | null
          graph_id: string
          has_attachments: boolean | null
          id: string
          importance: string | null
          internet_message_id: string | null
          is_deleted: boolean | null
          is_draft: boolean | null
          is_flagged: boolean | null
          is_read: boolean | null
          preview: string | null
          received_at: string | null
          reply_to: Json | null
          sent_at: string | null
          subject: string | null
          to_recipients: Json | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_processed_at?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachment_count?: number | null
          bcc_recipients?: Json | null
          body_content_type?: string | null
          body_html?: string | null
          body_text?: string | null
          categories?: string[] | null
          cc_recipients?: Json | null
          conversation_id?: string | null
          conversation_index?: string | null
          created_at?: string | null
          folder_id: string
          from_address?: string | null
          from_name?: string | null
          graph_id: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          internet_message_id?: string | null
          is_deleted?: boolean | null
          is_draft?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          preview?: string | null
          received_at?: string | null
          reply_to?: Json | null
          sent_at?: string | null
          subject?: string | null
          to_recipients?: Json | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_processed_at?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachment_count?: number | null
          bcc_recipients?: Json | null
          body_content_type?: string | null
          body_html?: string | null
          body_text?: string | null
          categories?: string[] | null
          cc_recipients?: Json | null
          conversation_id?: string | null
          conversation_index?: string | null
          created_at?: string | null
          folder_id?: string
          from_address?: string | null
          from_name?: string | null
          graph_id?: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          internet_message_id?: string | null
          is_deleted?: boolean | null
          is_draft?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          preview?: string | null
          received_at?: string | null
          reply_to?: Json | null
          sent_at?: string | null
          subject?: string | null
          to_recipients?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "account_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          folder_id: string
          id: string
          message_id: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          folder_id: string
          id?: string
          message_id: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          folder_id?: string
          id?: string
          message_id?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "account_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_steps: {
        Row: {
          actions: Json
          created_at: string | null
          icon: string | null
          id: string
          keyboard_shortcut: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string | null
          icon?: string | null
          id?: string
          keyboard_shortcut?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string | null
          icon?: string | null
          id?: string
          keyboard_shortcut?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_steps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          account_id: string
          attachment_ids: string[] | null
          bcc_recipients: Json | null
          body_html: string | null
          cc_recipients: Json | null
          created_at: string | null
          draft_graph_id: string | null
          error_message: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          subject: string | null
          timezone: string
          to_recipients: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          attachment_ids?: string[] | null
          bcc_recipients?: Json | null
          body_html?: string | null
          cc_recipients?: Json | null
          created_at?: string | null
          draft_graph_id?: string | null
          error_message?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          timezone: string
          to_recipients?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          attachment_ids?: string[] | null
          bcc_recipients?: Json | null
          body_html?: string | null
          cc_recipients?: Json | null
          created_at?: string | null
          draft_graph_id?: string | null
          error_message?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          timezone?: string
          to_recipients?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_inboxes: {
        Row: {
          account_id: string
          auto_assign_strategy: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          auto_assign_strategy?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          auto_assign_strategy?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_inboxes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_inboxes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      snippets: {
        Row: {
          body_html: string
          body_text: string
          category: string | null
          created_at: string | null
          created_by: string
          id: string
          is_shared: boolean | null
          name: string
          shortcut: string | null
          tenant_id: string
          updated_at: string | null
          use_count: number | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text: string
          category?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_shared?: boolean | null
          name: string
          shortcut?: string | null
          tenant_id: string
          updated_at?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string
          category?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_shared?: boolean | null
          name?: string
          shortcut?: string | null
          tenant_id?: string
          updated_at?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "snippets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snippets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      snoozed_messages: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          message_id: string
          original_folder_id: string
          returned_at: string | null
          snooze_until: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          message_id: string
          original_folder_id: string
          returned_at?: string | null
          snooze_until: string
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          message_id?: string
          original_folder_id?: string
          returned_at?: string | null
          snooze_until?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "snoozed_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snoozed_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snoozed_messages_original_folder_id_fkey"
            columns: ["original_folder_id"]
            isOneToOne: false
            referencedRelation: "account_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snoozed_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_state: {
        Row: {
          account_id: string
          created_at: string | null
          delta_link: string | null
          error_count: number | null
          error_message: string | null
          folder_id: string
          id: string
          last_sync_at: string | null
          messages_processed: number | null
          next_retry_at: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          delta_link?: string | null
          error_count?: number | null
          error_message?: string | null
          folder_id: string
          id?: string
          last_sync_at?: string | null
          messages_processed?: number | null
          next_retry_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          delta_link?: string | null
          error_count?: number | null
          error_message?: string | null
          folder_id?: string
          id?: string
          last_sync_at?: string | null
          messages_processed?: number | null
          next_retry_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_state_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "account_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          accent_color: string | null
          created_at: string | null
          custom_domain: string | null
          domain_verified: boolean | null
          email_footer_html: string | null
          email_from_name: string | null
          favicon_url: string | null
          id: string
          login_background_url: string | null
          login_tagline: string | null
          logo_dark_url: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          domain_verified?: boolean | null
          email_footer_html?: string | null
          email_from_name?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          login_tagline?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          domain_verified?: boolean | null
          email_footer_html?: string | null
          email_from_name?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          login_tagline?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          max_accounts_per_user: number
          max_seats: number
          name: string
          plan: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          max_accounts_per_user?: number
          max_seats?: number
          name: string
          plan?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          max_accounts_per_user?: number
          max_seats?: number
          name?: string
          plan?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_auto_summarize: boolean | null
          ai_smart_replies: boolean | null
          ai_tone: string | null
          auto_advance: string | null
          conversation_view: boolean | null
          created_at: string | null
          date_format: string | null
          default_account_id: string | null
          density: string | null
          id: string
          keyboard_shortcuts: boolean | null
          notification_sound: boolean | null
          notifications_enabled: boolean | null
          reading_pane: string | null
          signature_id: string | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_auto_summarize?: boolean | null
          ai_smart_replies?: boolean | null
          ai_tone?: string | null
          auto_advance?: string | null
          conversation_view?: boolean | null
          created_at?: string | null
          date_format?: string | null
          default_account_id?: string | null
          density?: string | null
          id?: string
          keyboard_shortcuts?: boolean | null
          notification_sound?: boolean | null
          notifications_enabled?: boolean | null
          reading_pane?: string | null
          signature_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_auto_summarize?: boolean | null
          ai_smart_replies?: boolean | null
          ai_tone?: string | null
          auto_advance?: string | null
          conversation_view?: boolean | null
          created_at?: string | null
          date_format?: string | null
          default_account_id?: string | null
          density?: string | null
          id?: string
          keyboard_shortcuts?: boolean | null
          notification_sound?: boolean | null
          notifications_enabled?: boolean | null
          reading_pane?: string | null
          signature_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          onboarded_at: string | null
          role: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_seen_at?: string | null
          onboarded_at?: string | null
          role?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          onboarded_at?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          account_id: string
          change_types: string[]
          client_state: string
          created_at: string | null
          expiration_at: string
          graph_subscription_id: string
          id: string
          is_active: boolean | null
          last_notification_at: string | null
          notification_url: string
          renewal_failures: number | null
          resource: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          change_types?: string[]
          client_state: string
          created_at?: string | null
          expiration_at: string
          graph_subscription_id: string
          id?: string
          is_active?: boolean | null
          last_notification_at?: string | null
          notification_url: string
          renewal_failures?: number | null
          resource: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          change_types?: string[]
          client_state?: string
          created_at?: string | null
          expiration_at?: string
          graph_subscription_id?: string
          id?: string
          is_active?: boolean | null
          last_notification_at?: string | null
          notification_url?: string
          renewal_failures?: number | null
          resource?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_monthly_cost: { Args: { seat_count: number }; Returns: number }
      can_have_individual_subscription: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      decrypt_api_key: {
        Args: { ciphertext: string; encryption_key: string }
        Returns: string
      }
      encrypt_api_key: {
        Args: { encryption_key: string; plaintext: string }
        Returns: string
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_subscription_context: {
        Args: { user_id_param: string }
        Returns: string
      }
      is_beta_user: { Args: { user_id_param: string }; Returns: boolean }
      log_billing_event: {
        Args: {
          p_amount: number
          p_event_type: string
          p_new_value: Json
          p_old_value: Json
          p_org_id: string
          p_triggered_by: string
        }
        Returns: string
      }
      should_enforce_billing: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
