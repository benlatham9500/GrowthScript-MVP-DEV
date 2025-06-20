export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_history: {
        Row: {
          chat_name: string
          client_id: string
          created_at: string | null
          id: string
          messages: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_name: string
          client_id: string
          created_at?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_name?: string
          client_id?: string
          created_at?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          audience: string | null
          brand_tone_notes: Json | null
          client_name: string
          created_at: string
          id: string
          industry: string | null
          product_types: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          brand_tone_notes?: Json | null
          client_name: string
          created_at?: string
          id?: string
          industry?: string | null
          product_types?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          brand_tone_notes?: Json | null
          client_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          product_types?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      framework_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          framework_id: string
          id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          framework_id: string
          id?: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          framework_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "framework_embeddings_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: true
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      frameworks: {
        Row: {
          author: string | null
          category: string | null
          created_at: string
          example: string | null
          id: string
          keywords: Json | null
          related_frameworks: Json | null
          summary: string | null
          tags: Json | null
          title: string
          updated_at: string
          use_when: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string
          example?: string | null
          id?: string
          keywords?: Json | null
          related_frameworks?: Json | null
          summary?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
          use_when?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string
          example?: string | null
          id?: string
          keywords?: Json | null
          related_frameworks?: Json | null
          summary?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
          use_when?: string | null
        }
        Relationships: []
      }
      memory: {
        Row: {
          client_id: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json | null
        }
        Insert: {
          client_id: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: Json | null
        }
        Update: {
          client_id?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["_id"]
          },
        ]
      }
      project_profile: {
        Row: {
          client_id: string
          created_at: string
          embedding: string | null
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_embeddings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          _id: string
          client_limit: number | null
          created_at: string
          email: string
          password: string | null
          plan: string | null
          updated_at: string
        }
        Insert: {
          _id?: string
          client_limit?: number | null
          created_at?: string
          email: string
          password?: string | null
          plan?: string | null
          updated_at?: string
        }
        Update: {
          _id?: string
          client_limit?: number | null
          created_at?: string
          email?: string
          password?: string | null
          plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
