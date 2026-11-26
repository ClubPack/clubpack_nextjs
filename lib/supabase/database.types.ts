
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      broadcasts: {
        Row: {
          audience: Json
          author_id: string | null
          body: string
          created_at: string
          id: string
          organization_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["broadcast_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          audience?: Json
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          organization_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["broadcast_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          audience?: Json
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["broadcast_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          event_id: string
          guest_name: string | null
          id: string
          method: Database["public"]["Enums"]["checkin_method"]
          organization_id: string
          rsvp_id: string | null
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          event_id: string
          guest_name?: string | null
          id?: string
          method: Database["public"]["Enums"]["checkin_method"]
          organization_id: string
          rsvp_id?: string | null
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          event_id?: string
          guest_name?: string | null
          id?: string
          method?: Database["public"]["Enums"]["checkin_method"]
          organization_id?: string
          rsvp_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_event_id_organization_id_fkey"
            columns: ["event_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "check_ins_rsvp_id_event_id_fkey"
            columns: ["rsvp_id", "event_id"]
            isOneToOne: false
            referencedRelation: "event_rsvps"
            referencedColumns: ["id", "event_id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          organization_id: string
          position: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          organization_id: string
          position?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          organization_id?: string
          position?: number
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      clubs: {
        Row: {
          allow_guest_rsvp: boolean
          category: string | null
          founded_year: number | null
          join_policy: Database["public"]["Enums"]["join_policy"]
          kind: Database["public"]["Enums"]["org_kind"]
          open_to_sponsors: boolean
          organization_id: string
          require_waiver: boolean
          show_member_count: boolean
          updated_at: string
        }
        Insert: {
          allow_guest_rsvp?: boolean
          category?: string | null
          founded_year?: number | null
          join_policy?: Database["public"]["Enums"]["join_policy"]
          kind?: Database["public"]["Enums"]["org_kind"]
          open_to_sponsors?: boolean
          organization_id: string
          require_waiver?: boolean
          show_member_count?: boolean
          updated_at?: string
        }
        Update: {
          allow_guest_rsvp?: boolean
          category?: string | null
          founded_year?: number | null
          join_policy?: Database["public"]["Enums"]["join_policy"]
          kind?: Database["public"]["Enums"]["org_kind"]
          open_to_sponsors?: boolean
          organization_id?: string
          require_waiver?: boolean
          show_member_count?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_organization_id_kind_fkey"
            columns: ["organization_id", "kind"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      deal_deliverables: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string
          description: string
          due_at: string | null
          event_id: string | null
          id: string
          proof_url: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id: string
          description: string
          due_at?: string | null
          event_id?: string | null
          id?: string
          proof_url?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          description?: string
          due_at?: string | null
          event_id?: string | null
          id?: string
          proof_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_deliverables_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_deliverables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkin_codes: {
        Row: {
          code: string
          event_id: string
          organization_id: string
          rotated_at: string
        }
        Insert: {
          code?: string
          event_id: string
          organization_id: string
          rotated_at?: string
        }
        Update: {
          code?: string
          event_id?: string
          organization_id?: string
          rotated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checkin_codes_event_id_organization_id_fkey"
            columns: ["event_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_organization_id_fkey"
            columns: ["event_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          created_at: string
          created_by: string | null
          defaults: Json
          ends_on: string | null
          id: string
          organization_id: string
          recurrence_rule: string
          starts_on: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          defaults?: Json
          ends_on?: string | null
          id?: string
          organization_id: string
          recurrence_rule: string
          starts_on: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          defaults?: Json
          ends_on?: string | null
          id?: string
          organization_id?: string
          recurrence_rule?: string
          starts_on?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_series_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_series_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          cover_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          latitude: number | null
          location_address: string | null
          location_name: string | null
          longitude: number | null
          organization_id: string
          rsvp_closes_at: string | null
          rsvp_opens_at: string | null
          series_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          capacity?: number | null
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          organization_id: string
          rsvp_closes_at?: string | null
          rsvp_opens_at?: string | null
          series_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          capacity?: number | null
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          organization_id?: string
          rsvp_closes_at?: string | null
          rsvp_opens_at?: string | null
          series_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "events_series_id_organization_id_fkey"
            columns: ["series_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
          organization_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
          organization_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          brand_color: string | null
          city: string | null
          contact_email: string | null
          country_code: string
          cover_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instagram_handle: string | null
          is_public: boolean
          kind: Database["public"]["Enums"]["org_kind"]
          logo_path: string | null
          name: string
          region: string | null
          school: string | null
          slug: string
          tagline: string | null
          timezone: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          archived_at?: string | null
          brand_color?: string | null
          city?: string | null
          contact_email?: string | null
          country_code?: string
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          is_public?: boolean
          kind: Database["public"]["Enums"]["org_kind"]
          logo_path?: string | null
          name: string
          region?: string | null
          school?: string | null
          slug: string
          tagline?: string | null
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          archived_at?: string | null
          brand_color?: string | null
          city?: string | null
          contact_email?: string | null
          country_code?: string
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          is_public?: boolean
          kind?: Database["public"]["Enums"]["org_kind"]
          logo_path?: string | null
          name?: string
          region?: string | null
          school?: string | null
          slug?: string
          tagline?: string | null
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          graduation_year: number | null
          id: string
          phone: string | null
          school: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          graduation_year?: number | null
          id: string
          phone?: string | null
          school?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          phone?: string | null
          school?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          industry: string | null
          kind: Database["public"]["Enums"]["org_kind"]
          organization_id: string
          service_area: string | null
          updated_at: string
        }
        Insert: {
          industry?: string | null
          kind?: Database["public"]["Enums"]["org_kind"]
          organization_id: string
          service_area?: string | null
          updated_at?: string
        }
        Update: {
          industry?: string | null
          kind?: Database["public"]["Enums"]["org_kind"]
          organization_id?: string
          service_area?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_organization_id_kind_fkey"
            columns: ["organization_id", "kind"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      sponsorship_deals: {
        Row: {
          amount_cents: number
          club_id: string
          created_at: string
          currency: string
          decided_at: string | null
          ends_on: string | null
          id: string
          package_id: string | null
          platform_fee_cents: number
          proposed_by: string | null
          proposed_by_org: string
          sponsor_id: string
          starts_on: string | null
          status: Database["public"]["Enums"]["deal_status"]
          terms: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          club_id: string
          created_at?: string
          currency?: string
          decided_at?: string | null
          ends_on?: string | null
          id?: string
          package_id?: string | null
          platform_fee_cents?: number
          proposed_by?: string | null
          proposed_by_org: string
          sponsor_id: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          terms?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          club_id?: string
          created_at?: string
          currency?: string
          decided_at?: string | null
          ends_on?: string | null
          id?: string
          package_id?: string | null
          platform_fee_cents?: number
          proposed_by?: string | null
          proposed_by_org?: string
          sponsor_id?: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          terms?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_deals_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sponsorship_deals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_deals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_deals_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      sponsorship_packages: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"]
          created_at: string
          currency: string
          deliverables: string[]
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          position: number
          price_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          currency?: string
          deliverables?: string[]
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          position?: number
          price_cents: number
          title: string
          updated_at?: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          currency?: string
          deliverables?: string[]
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          position?: number
          price_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      waiver_signatures: {
        Row: {
          id: string
          organization_id: string
          signed_at: string
          signed_name: string
          user_agent: string | null
          user_id: string
          waiver_id: string
        }
        Insert: {
          id?: string
          organization_id: string
          signed_at?: string
          signed_name: string
          user_agent?: string | null
          user_id: string
          waiver_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          signed_at?: string
          signed_name?: string
          user_agent?: string | null
          user_id?: string
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiver_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_waiver_id_organization_id_fkey"
            columns: ["waiver_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "waivers"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      waivers: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string
          title: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          title: string
          version: number
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "waivers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["organization_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      cancel_rsvp: { Args: { p_event: string }; Returns: undefined }
      create_organization: {
        Args: {
          p_kind: Database["public"]["Enums"]["org_kind"]
          p_name: string
          p_slug: string
        }
        Returns: {
          archived_at: string | null
          brand_color: string | null
          city: string | null
          contact_email: string | null
          country_code: string
          cover_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instagram_handle: string | null
          is_public: boolean
          kind: Database["public"]["Enums"]["org_kind"]
          logo_path: string | null
          name: string
          region: string | null
          school: string | null
          slug: string
          tagline: string | null
          timezone: string
          updated_at: string
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_club_member_count: { Args: { p_club: string }; Returns: number }
      get_club_stats: {
        Args: { p_club: string; p_days?: number }
        Returns: {
          active_members: number
          avg_attendance: number
          events_held: number
          total_check_ins: number
          unique_attendees: number
          window_days: number
        }[]
      }
      get_event_availability: {
        Args: { p_events: string[] }
        Returns: {
          capacity: number
          event_id: string
          going: number
          waitlisted: number
        }[]
      }
      guest_rsvp: {
        Args: { p_email: string; p_event: string; p_name: string }
        Returns: Database["public"]["Enums"]["rsvp_status"]
      }
      join_club: {
        Args: { p_club: string }
        Returns: Database["public"]["Enums"]["member_status"]
      }
      rsvp_to_event: {
        Args: { p_event: string }
        Returns: Database["public"]["Enums"]["rsvp_status"]
      }
      self_check_in: {
        Args: { p_code: string; p_event: string }
        Returns: string
      }
    }
    Enums: {
      billing_period: "one_time" | "per_event" | "per_semester" | "per_year"
      broadcast_status: "draft" | "queued" | "sent" | "failed"
      checkin_method: "qr" | "manual" | "walk_in"
      deal_status:
        | "proposed"
        | "accepted"
        | "declined"
        | "active"
        | "completed"
        | "cancelled"
      event_status: "scheduled" | "cancelled"
      event_visibility: "public" | "members"
      join_policy: "open" | "approval" | "invite_only"
      member_role: "owner" | "admin" | "staff" | "member"
      member_status: "pending" | "active" | "removed"
      org_kind: "club" | "sponsor"
      rsvp_status: "going" | "waitlisted" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      billing_period: ["one_time", "per_event", "per_semester", "per_year"],
      broadcast_status: ["draft", "queued", "sent", "failed"],
      checkin_method: ["qr", "manual", "walk_in"],
      deal_status: [
        "proposed",
        "accepted",
        "declined",
        "active",
        "completed",
        "cancelled",
      ],
      event_status: ["scheduled", "cancelled"],
      event_visibility: ["public", "members"],
      join_policy: ["open", "approval", "invite_only"],
      member_role: ["owner", "admin", "staff", "member"],
      member_status: ["pending", "active", "removed"],
      org_kind: ["club", "sponsor"],
      rsvp_status: ["going", "waitlisted", "cancelled"],
    },
  },
} as const
