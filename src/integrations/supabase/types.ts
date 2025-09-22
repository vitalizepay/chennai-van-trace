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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      device_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_info: Json | null
          expires_at: string
          id: string
          is_active: boolean
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_details: {
        Row: {
          created_at: string
          experience_years: number | null
          id: string
          license_expiry: string | null
          license_number: string
          route_assigned: string | null
          user_id: string
          van_assigned: string | null
        }
        Insert: {
          created_at?: string
          experience_years?: number | null
          id?: string
          license_expiry?: string | null
          license_number: string
          route_assigned?: string | null
          user_id: string
          van_assigned?: string | null
        }
        Update: {
          created_at?: string
          experience_years?: number | null
          id?: string
          license_expiry?: string | null
          license_number?: string
          route_assigned?: string | null
          user_id?: string
          van_assigned?: string | null
        }
        Relationships: []
      }
      otps: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          mobile: string
          otp_code: string
          purpose: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          max_attempts?: number
          mobile: string
          otp_code: string
          purpose?: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          mobile?: string
          otp_code?: string
          purpose?: string
          verified?: boolean
        }
        Relationships: []
      }
      parent_details: {
        Row: {
          address: string | null
          children_count: number
          created_at: string
          emergency_contact: string | null
          id: string
          user_id: string
        }
        Insert: {
          address?: string | null
          children_count?: number
          created_at?: string
          emergency_contact?: string | null
          id?: string
          user_id: string
        }
        Update: {
          address?: string | null
          children_count?: number
          created_at?: string
          emergency_contact?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          mobile: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          mobile?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          mobile?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          location: string
          name: string
          status: string
          total_students: number | null
          total_vans: number | null
          updated_at: string
        }
        Insert: {
          address: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          location: string
          name: string
          status?: string
          total_students?: number | null
          total_vans?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          location?: string
          name?: string
          status?: string
          total_students?: number | null
          total_vans?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          boarded: boolean | null
          created_at: string
          dropped: boolean | null
          emergency_contact: string | null
          full_name: string
          grade: string | null
          id: string
          medical_info: string | null
          parent_id: string | null
          pickup_stop: string
          school_id: string
          status: string
          updated_at: string
          van_id: string | null
        }
        Insert: {
          boarded?: boolean | null
          created_at?: string
          dropped?: boolean | null
          emergency_contact?: string | null
          full_name: string
          grade?: string | null
          id?: string
          medical_info?: string | null
          parent_id?: string | null
          pickup_stop: string
          school_id: string
          status?: string
          updated_at?: string
          van_id?: string | null
        }
        Update: {
          boarded?: boolean | null
          created_at?: string
          dropped?: boolean | null
          emergency_contact?: string | null
          full_name?: string
          grade?: string | null
          id?: string
          medical_info?: string | null
          parent_id?: string | null
          pickup_stop?: string
          school_id?: string
          status?: string
          updated_at?: string
          van_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_van_id_fkey"
            columns: ["van_id"]
            isOneToOne: false
            referencedRelation: "vans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      vans: {
        Row: {
          capacity: number
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_students: number | null
          driver_id: string | null
          id: string
          last_location_update: string | null
          route_name: string | null
          school_id: string
          status: string
          updated_at: string
          van_number: string
        }
        Insert: {
          capacity: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_students?: number | null
          driver_id?: string | null
          id?: string
          last_location_update?: string | null
          route_name?: string | null
          school_id: string
          status?: string
          updated_at?: string
          van_number: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_students?: number | null
          driver_id?: string | null
          id?: string
          last_location_update?: string | null
          route_name?: string | null
          school_id?: string
          status?: string
          updated_at?: string
          van_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_admin_user: {
        Args:
          | { _email: string; _full_name: string; _mobile: string }
          | {
              _email: string
              _full_name: string
              _mobile: string
              _school_id?: string
            }
        Returns: string
      }
      create_super_admin_user: {
        Args: { _email: string; _full_name: string; _mobile: string }
        Returns: string
      }
      generate_otp: {
        Args: { _mobile: string; _purpose?: string }
        Returns: string
      }
      get_user_by_mobile: {
        Args: { _mobile: string }
        Returns: {
          email: string
          full_name: string
          mobile: string
          roles: string[]
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
        }[]
      }
      get_user_for_mobile_login: {
        Args: { _mobile: string }
        Returns: {
          email: string
          full_name: string
          mobile: string
          roles: string[]
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
        }[]
      }
      get_user_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_status"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_user_admin: {
        Args: { _user_email: string }
        Returns: undefined
      }
      verify_otp: {
        Args: { _mobile: string; _otp_code: string; _purpose?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "parent" | "super_admin"
      user_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "driver", "parent", "super_admin"],
      user_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
