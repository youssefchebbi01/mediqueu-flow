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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          hashed_key: string
          id: string
          last_used_at: string | null
          name: string
          org_id: string
          prefix: string
          revoked_at: string | null
          scopes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          hashed_key: string
          id?: string
          last_used_at?: string | null
          name: string
          org_id: string
          prefix: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          hashed_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string
          prefix?: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          clinic_id: string | null
          created_at: string
          doctor_id: string | null
          doctor_name: string
          id: string
          organization_id: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          specialty: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name: string
          id?: string
          organization_id?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          specialty: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string
          id?: string
          organization_id?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          specialty?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          created_at: string
          external_account: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          metadata: Json
          org_id: string
          provider: string
          scopes: string[]
          status: string
          sync_direction: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_account?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json
          org_id: string
          provider: string
          scopes?: string[]
          status?: string
          sync_direction?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_account?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json
          org_id?: string
          provider?: string
          scopes?: string[]
          status?: string
          sync_direction?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          appointment_id: string | null
          chief_complaint: string | null
          clinic_id: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          doctor_user_id: string | null
          follow_up_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          patient_id: string
          prescription: string | null
          treatment: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          doctor_user_id?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id: string
          prescription?: string | null
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          doctor_user_id?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id?: string
          prescription?: string | null
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          clinic_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
        }
        Insert: {
          clinic_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          clinic_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      doctors_directory: {
        Row: {
          available: boolean | null
          avatar: string | null
          clinic_id: string | null
          created_at: string
          id: string
          name: string
          next_slot: string | null
          rating: number | null
          specialty: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available?: boolean | null
          avatar?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          name: string
          next_slot?: string | null
          rating?: number | null
          specialty: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available?: boolean | null
          avatar?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          name?: string
          next_slot?: string | null
          rating?: number | null
          specialty?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_directory_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          errors: Json
          failed_rows: number
          filename: string | null
          id: string
          kind: string
          org_id: string
          status: string
          succeeded_rows: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          failed_rows?: number
          filename?: string | null
          id?: string
          kind: string
          org_id: string
          status?: string
          succeeded_rows?: number
          total_rows?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          failed_rows?: number
          filename?: string | null
          id?: string
          kind?: string
          org_id?: string
          status?: string
          succeeded_rows?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          created_at: string
          event: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: Database["public"]["Enums"]["notification_category"] | null
          created_at: string
          id: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"] | null
          created_at?: string
          id?: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"] | null
          created_at?: string
          id?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          appointment_retention_days: number
          audit_retention_days: number
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          primary_color: string | null
          seat_limit: number
          slug: string
          support_email: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          appointment_retention_days?: number
          audit_retention_days?: number
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          primary_color?: string | null
          seat_limit?: number
          slug: string
          support_email?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          appointment_retention_days?: number
          audit_retention_days?: number
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          primary_color?: string | null
          seat_limit?: number
          slug?: string
          support_email?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      permissions_overrides: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          org_id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          org_id: string
          permission_key: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          org_id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_id: string | null
          created_at: string
          current_org_id: string | null
          date_of_birth: string | null
          department: string | null
          full_name: string | null
          id: string
          license_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          current_org_id?: string | null
          date_of_birth?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          current_org_id?: string | null
          date_of_birth?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_org_id_fkey"
            columns: ["current_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_entries: {
        Row: {
          arrived_at: string
          clinic_id: string | null
          created_at: string
          doctor_id: string | null
          doctor_name: string | null
          eta_min: number | null
          id: string
          organization_id: string | null
          patient_id: string
          position: number
          status: Database["public"]["Enums"]["queue_status"]
          ticket: string
          updated_at: string
        }
        Insert: {
          arrived_at?: string
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          eta_min?: number | null
          id?: string
          organization_id?: string | null
          patient_id: string
          position?: number
          status?: Database["public"]["Enums"]["queue_status"]
          ticket: string
          updated_at?: string
        }
        Update: {
          arrived_at?: string
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          eta_min?: number | null
          id?: string
          organization_id?: string | null
          patient_id?: string
          position?: number
          status?: Database["public"]["Enums"]["queue_status"]
          ticket?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          org_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          seats: number
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          seats?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          seats?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          active_users_count: number
          appointments_count: number
          id: string
          org_id: string
          period_start: string
          sms_count: number
          updated_at: string
        }
        Insert: {
          active_users_count?: number
          appointments_count?: number
          id?: string
          org_id: string
          period_start?: string
          sms_count?: number
          updated_at?: string
        }
        Update: {
          active_users_count?: number
          appointments_count?: number
          id?: string
          org_id?: string
          period_start?: string
          sms_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          event: string
          id: string
          org_id: string
          payload: Json
          response_excerpt: string | null
          status_code: number | null
          succeeded: boolean
          webhook_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          event: string
          id?: string
          org_id: string
          payload?: Json
          response_excerpt?: string | null
          status_code?: number | null
          succeeded?: boolean
          webhook_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          event?: string
          id?: string
          org_id?: string
          payload?: Json
          response_excerpt?: string | null
          status_code?: number | null
          succeeded?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          events: string[]
          id: string
          name: string
          org_id: string
          secret: string
          target_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          name: string
          org_id: string
          secret?: string
          target_url: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          name?: string
          org_id?: string
          secret?: string
          target_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      subscriptions_public: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string | null
          org_id: string | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          seats: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string | null
          org_id?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          seats?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string | null
          org_id?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          seats?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string }
      current_org_id: { Args: never; Returns: string }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          org_id: string
          org_name: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _org_id: string
        }
        Returns: string
      }
      org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
    }
    Enums: {
      app_role: "patient" | "receptionist" | "doctor" | "admin"
      appointment_status:
        | "Pending"
        | "Confirmed"
        | "Waiting"
        | "In Consultation"
        | "Completed"
        | "Cancelled"
        | "No Show"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      notification_category: "appointment" | "queue" | "billing" | "system"
      org_role: "owner" | "admin" | "member"
      plan_tier: "trial" | "starter" | "growth" | "scale"
      queue_status: "Waiting" | "Active" | "Completed" | "Delayed"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
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
    Enums: {
      app_role: ["patient", "receptionist", "doctor", "admin"],
      appointment_status: [
        "Pending",
        "Confirmed",
        "Waiting",
        "In Consultation",
        "Completed",
        "Cancelled",
        "No Show",
      ],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      notification_category: ["appointment", "queue", "billing", "system"],
      org_role: ["owner", "admin", "member"],
      plan_tier: ["trial", "starter", "growth", "scale"],
      queue_status: ["Waiting", "Active", "Completed", "Delayed"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "paused",
      ],
    },
  },
} as const
