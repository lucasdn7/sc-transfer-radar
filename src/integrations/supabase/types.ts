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
      activity_log: {
        Row: {
          action_description: string
          created_at: string
          id: number
          ip_address: string | null
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          action_description: string
          created_at?: string
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          action_description?: string
          created_at?: string
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_category_id: number
          file_mime_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: number
          is_public: boolean
          title: string
          updated_at: string
          uploaded_by_user_id: number | null
          validity_date: string | null
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category_id: number
          file_mime_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: number
          is_public?: boolean
          title: string
          updated_at?: string
          uploaded_by_user_id?: number | null
          validity_date?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category_id?: number
          file_mime_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: number
          is_public?: boolean
          title?: string
          updated_at?: string
          uploaded_by_user_id?: number | null
          validity_date?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          id: number
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: number
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: number
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          classification: string | null
          cnpj: string
          created_at: string
          email: string | null
          id: number
          mayor_name: string | null
          name: string
          phone: string | null
          population: number | null
          region: string | null
          regional_nucleus_id: number | null
          secretary_name: string | null
          updated_at: string
        }
        Insert: {
          classification?: string | null
          cnpj: string
          created_at?: string
          email?: string | null
          id?: number
          mayor_name?: string | null
          name: string
          phone?: string | null
          population?: number | null
          region?: string | null
          regional_nucleus_id?: number | null
          secretary_name?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string | null
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: number
          mayor_name?: string | null
          name?: string
          phone?: string | null
          population?: number | null
          region?: string | null
          regional_nucleus_id?: number | null
          secretary_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_regional_nucleus_id_fkey"
            columns: ["regional_nucleus_id"]
            isOneToOne: false
            referencedRelation: "regional_nuclei"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: number
          is_active: boolean
          subscription_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          is_active?: boolean
          subscription_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          is_active?: boolean
          subscription_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_public: boolean
          is_read: boolean
          message: string
          recipient_user_id: number | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: number
          is_public?: boolean
          is_read?: boolean
          message: string
          recipient_user_id?: number | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: number
          is_public?: boolean
          is_read?: boolean
          message?: string
          recipient_user_id?: number | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      process_attachments: {
        Row: {
          created_at: string
          document_id: number
          id: number
          process_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: number
          id?: number
          process_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: number
          id?: number
          process_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_comments: {
        Row: {
          comment: string
          created_at: string
          id: number
          process_id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          comment: string
          created_at?: string
          id?: number
          process_id: number
          updated_at?: string
          user_id: number
        }
        Update: {
          comment?: string
          created_at?: string
          id?: number
          process_id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_comments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      process_history: {
        Row: {
          change_description: string
          created_at: string
          id: number
          process_id: number
          user_id: number | null
        }
        Insert: {
          change_description: string
          created_at?: string
          id?: number
          process_id: number
          user_id?: number | null
        }
        Update: {
          change_description?: string
          created_at?: string
          id?: number
          process_id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_history_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      process_parcels: {
        Row: {
          created_at: string
          id: number
          parcel_number: number
          payment_date: string | null
          process_id: number
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: number
          parcel_number: number
          payment_date?: string | null
          process_id: number
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: number
          parcel_number?: number
          payment_date?: string | null
          process_id?: number
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_parcels_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string
          current_status: Database["public"]["Enums"]["process_status"]
          id: number
          last_tramitacao: string | null
          latitude: number | null
          licitado_value: number | null
          longitude: number | null
          municipality_id: number
          object: string
          portaria_number: string | null
          process_number: string
          regional_nucleus_id: number | null
          total_concedente_value: number
          total_portaria_value: number
          total_proponente_value: number
          updated_at: string
          vigencia_date: string
        }
        Insert: {
          created_at?: string
          current_status: Database["public"]["Enums"]["process_status"]
          id?: number
          last_tramitacao?: string | null
          latitude?: number | null
          licitado_value?: number | null
          longitude?: number | null
          municipality_id: number
          object: string
          portaria_number?: string | null
          process_number: string
          regional_nucleus_id?: number | null
          total_concedente_value: number
          total_portaria_value: number
          total_proponente_value: number
          updated_at?: string
          vigencia_date: string
        }
        Update: {
          created_at?: string
          current_status?: Database["public"]["Enums"]["process_status"]
          id?: number
          last_tramitacao?: string | null
          latitude?: number | null
          licitado_value?: number | null
          longitude?: number | null
          municipality_id?: number
          object?: string
          portaria_number?: string | null
          process_number?: string
          regional_nucleus_id?: number | null
          total_concedente_value?: number
          total_portaria_value?: number
          total_proponente_value?: number
          updated_at?: string
          vigencia_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_regional_nucleus_id_fkey"
            columns: ["regional_nucleus_id"]
            isOneToOne: false
            referencedRelation: "regional_nuclei"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: number
          message: string
          process_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: number
          message: string
          process_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: number
          message?: string
          process_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_alerts_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_nuclei: {
        Row: {
          acronym: string
          created_at: string
          email: string | null
          geographic_region: string | null
          id: number
          name: string
          observations: string | null
          phone: string | null
          technical_responsible_name: string | null
          updated_at: string
        }
        Insert: {
          acronym: string
          created_at?: string
          email?: string | null
          geographic_region?: string | null
          id?: number
          name: string
          observations?: string | null
          phone?: string | null
          technical_responsible_name?: string | null
          updated_at?: string
        }
        Update: {
          acronym?: string
          created_at?: string
          email?: string | null
          geographic_region?: string | null
          id?: number
          name?: string
          observations?: string | null
          phone?: string | null
          technical_responsible_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: number
          role_id: number
        }
        Insert: {
          created_at?: string
          permission_id: number
          role_id: number
        }
        Update: {
          created_at?: string
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: number
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          role_id: number
          user_id: number
        }
        Update: {
          created_at?: string
          role_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: number
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: number
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: number
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_expiration_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      has_role: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_type: "critical" | "important" | "informative"
      process_status:
        | "created"
        | "in_analysis"
        | "approved"
        | "in_execution"
        | "finished"
        | "cancelled"
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
    Enums: {
      notification_type: ["critical", "important", "informative"],
      process_status: [
        "created",
        "in_analysis",
        "approved",
        "in_execution",
        "finished",
        "cancelled",
      ],
    },
  },
} as const
