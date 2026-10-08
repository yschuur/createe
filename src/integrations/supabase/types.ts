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
      blank_stock: {
        Row: {
          color: string
          model: string
          quantity: number
          size: string
          updated_at: string
        }
        Insert: {
          color: string
          model: string
          quantity?: number
          size: string
          updated_at?: string
        }
        Update: {
          color?: string
          model?: string
          quantity?: number
          size?: string
          updated_at?: string
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          published: boolean
          slug: string
          sort_order: number
          sport_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          published?: boolean
          slug: string
          sort_order?: number
          sport_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          published?: boolean
          slug?: string
          sort_order?: number
          sport_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          order_number: string
          phone: string
          replies: Json
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          order_number?: string
          phone?: string
          replies?: Json
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          order_number?: string
          phone?: string
          replies?: Json
        }
        Relationships: []
      }
      design_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          occasion: string | null
          phone: string | null
          quantity: number | null
          replies: Json
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          occasion?: string | null
          phone?: string | null
          quantity?: number | null
          replies?: Json
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          occasion?: string | null
          phone?: string | null
          quantity?: number | null
          replies?: Json
          status?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          min_order_amount: number | null
          newsletter: boolean
          starts_at: string | null
          times_used: number
          type: string
          updated_at: string
          usage_limit: number | null
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          min_order_amount?: number | null
          newsletter?: boolean
          starts_at?: string | null
          times_used?: number
          type?: string
          updated_at?: string
          usage_limit?: number | null
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          min_order_amount?: number | null
          newsletter?: boolean
          starts_at?: string | null
          times_used?: number
          type?: string
          updated_at?: string
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      image_migration_map: {
        Row: {
          path: string
          src: string
          url: string
        }
        Insert: {
          path: string
          src: string
          url: string
        }
        Update: {
          path?: string
          src?: string
          url?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string
          created_by: string | null
          errors: Json
          id: string
          source: string | null
          summary: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          id?: string
          source?: string | null
          summary?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          id?: string
          source?: string | null
          summary?: Json
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          name: string | null
          size_bytes: number | null
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          name?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          name?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          url?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id: string | null
          variant_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id?: string | null
          variant_label?: string
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_note: string
          created_at: string
          currency: string
          email: string | null
          environment: string
          events: Json
          id: string
          name: string | null
          order_number: string
          phone: string | null
          shipping_address: Json | null
          shipping_total: number
          status: string
          stripe_session_id: string | null
          total: number
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string
          created_at?: string
          currency?: string
          email?: string | null
          environment?: string
          events?: Json
          id?: string
          name?: string | null
          order_number: string
          phone?: string | null
          shipping_address?: Json | null
          shipping_total?: number
          status?: string
          stripe_session_id?: string | null
          total?: number
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string
          created_at?: string
          currency?: string
          email?: string | null
          environment?: string
          events?: Json
          id?: string
          name?: string | null
          order_number?: string
          phone?: string | null
          shipping_address?: Json | null
          shipping_total?: number
          status?: string
          stripe_session_id?: string | null
          total?: number
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          source_url: string | null
          storage_path: string | null
          url: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          source_url?: string | null
          storage_path?: string | null
          url: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          source_url?: string | null
          storage_path?: string | null
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          allow_backorder: boolean
          barcode: string | null
          color: string | null
          compare_at_price: number | null
          created_at: string
          id: string
          inventory_quantity: number
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          option3_name: string | null
          option3_value: string | null
          original_inventory_qty: number | null
          price: number
          product_id: string
          size: string | null
          sku: string | null
          sort_order: number
          track_inventory: boolean
          updated_at: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          active?: boolean
          allow_backorder?: boolean
          barcode?: string | null
          color?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          inventory_quantity?: number
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          original_inventory_qty?: number | null
          price?: number
          product_id: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          track_inventory?: boolean
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          active?: boolean
          allow_backorder?: boolean
          barcode?: string | null
          color?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          inventory_quantity?: number
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          original_inventory_qty?: number | null
          price?: number
          product_id?: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          track_inventory?: boolean
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          blank_model: string | null
          created_at: string
          description_html: string | null
          fabric: string | null
          featured: boolean
          fit: string | null
          id: string
          is_service: boolean
          metadata: Json
          name: string
          product_category: string | null
          product_type: string | null
          published: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          sport_id: string | null
          sports: string[]
          status: string
          tags: string[]
          target_gender: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          blank_model?: string | null
          created_at?: string
          description_html?: string | null
          fabric?: string | null
          featured?: boolean
          fit?: string | null
          id?: string
          is_service?: boolean
          metadata?: Json
          name: string
          product_category?: string | null
          product_type?: string | null
          published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          sport_id?: string | null
          sports?: string[]
          status?: string
          tags?: string[]
          target_gender?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          blank_model?: string | null
          created_at?: string
          description_html?: string | null
          fabric?: string | null
          featured?: boolean
          fit?: string | null
          id?: string
          is_service?: boolean
          metadata?: Json
          name?: string
          product_category?: string | null
          product_type?: string | null
          published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          sport_id?: string | null
          sports?: string[]
          status?: string
          tags?: string[]
          target_gender?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sports: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_variant_stock: {
        Args: { _qty: number; _variant: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
