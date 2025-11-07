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
      events: {
        Row: {
          created_at: string
          days: number
          id: string
          location: string
          purpose: string
          start_date: string
          updated_at: string
          watch_model: Json | null
        }
        Insert: {
          created_at?: string
          days?: number
          id?: string
          location: string
          purpose: string
          start_date: string
          updated_at?: string
          watch_model?: Json | null
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          location?: string
          purpose?: string
          start_date?: string
          updated_at?: string
          watch_model?: Json | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          days: number
          id: string
          location: string
          purpose: string
          start_date: string
          updated_at: string
          watch_model: Json | null
        }
        Insert: {
          created_at?: string
          days?: number
          id?: string
          location: string
          purpose: string
          start_date: string
          updated_at?: string
          watch_model?: Json | null
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          location?: string
          purpose?: string
          start_date?: string
          updated_at?: string
          watch_model?: Json | null
        }
        Relationships: []
      }
      watch_specs: {
        Row: {
          band: string | null
          case_material: string | null
          case_size: string | null
          caseback: string | null
          created_at: string
          crystal: string | null
          id: string
          lug_to_lug: string | null
          movement: string | null
          power_reserve: string | null
          price: number
          updated_at: string
          watch_id: string
          water_resistance: string | null
        }
        Insert: {
          band?: string | null
          case_material?: string | null
          case_size?: string | null
          caseback?: string | null
          created_at?: string
          crystal?: string | null
          id?: string
          lug_to_lug?: string | null
          movement?: string | null
          power_reserve?: string | null
          price?: number
          updated_at?: string
          watch_id: string
          water_resistance?: string | null
        }
        Update: {
          band?: string | null
          case_material?: string | null
          case_size?: string | null
          caseback?: string | null
          created_at?: string
          crystal?: string | null
          id?: string
          lug_to_lug?: string | null
          movement?: string | null
          power_reserve?: string | null
          price?: number
          updated_at?: string
          watch_id?: string
          water_resistance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_specs_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "watches"
            referencedColumns: ["id"]
          },
        ]
      }
      watches: {
        Row: {
          brand: string
          cost: number
          created_at: string
          dial_color: string
          id: string
          model: string
          type: string
          updated_at: string
        }
        Insert: {
          brand: string
          cost?: number
          created_at?: string
          dial_color: string
          id?: string
          model: string
          type: string
          updated_at?: string
        }
        Update: {
          brand?: string
          cost?: number
          created_at?: string
          dial_color?: string
          id?: string
          model?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      water_usage: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          depth_meters: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          updated_at: string
          watch_id: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string
          depth_meters?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          watch_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          depth_meters?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          watch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_usage_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "watches"
            referencedColumns: ["id"]
          },
        ]
      }
      wear_entries: {
        Row: {
          created_at: string
          days: number
          id: string
          notes: string | null
          updated_at: string
          watch_id: string
          wear_date: string
        }
        Insert: {
          created_at?: string
          days?: number
          id?: string
          notes?: string | null
          updated_at?: string
          watch_id: string
          wear_date: string
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          notes?: string | null
          updated_at?: string
          watch_id?: string
          wear_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "wear_entries_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "watches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
