export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      affiliate_links: {
        Row: {
          affiliate_destination: string;
          category: string;
          created_at: string;
          destination: string;
          disclosure: string;
          enabled: boolean;
          id: string;
          name: string;
          post_ids: string[];
        };
        Insert: {
          affiliate_destination?: string;
          category?: string;
          created_at?: string;
          destination: string;
          disclosure?: string;
          enabled?: boolean;
          id?: string;
          name: string;
          post_ids?: string[];
        };
        Update: {
          affiliate_destination?: string;
          category?: string;
          created_at?: string;
          destination?: string;
          disclosure?: string;
          enabled?: boolean;
          id?: string;
          name?: string;
          post_ids?: string[];
        };
        Relationships: [];
      };
      case_inventory: {
        Row: {
          actual_fix: string;
          canonical_url: string;
          commands: string;
          confidence: string;
          created_at: string;
          device: string;
          drivers: string;
          duplicates: string[];
          error_message: string;
          evidence: string;
          failed_attempts: string;
          id: string;
          os: string;
          post_id: string | null;
          root_cause: string;
          screenshots: string;
          settings_changes: string;
          source_date: string | null;
          source_ref: string;
          status: string;
          symptoms: string;
          title: string;
          verification: string;
        };
        Insert: {
          actual_fix?: string;
          canonical_url?: string;
          commands?: string;
          confidence?: string;
          created_at?: string;
          device?: string;
          drivers?: string;
          duplicates?: string[];
          error_message?: string;
          evidence?: string;
          failed_attempts?: string;
          id?: string;
          os?: string;
          post_id?: string | null;
          root_cause?: string;
          screenshots?: string;
          settings_changes?: string;
          source_date?: string | null;
          source_ref?: string;
          status?: string;
          symptoms?: string;
          title: string;
          verification?: string;
        };
        Update: {
          actual_fix?: string;
          canonical_url?: string;
          commands?: string;
          confidence?: string;
          created_at?: string;
          device?: string;
          drivers?: string;
          duplicates?: string[];
          error_message?: string;
          evidence?: string;
          failed_attempts?: string;
          id?: string;
          os?: string;
          post_id?: string | null;
          root_cause?: string;
          screenshots?: string;
          settings_changes?: string;
          source_date?: string | null;
          source_ref?: string;
          status?: string;
          symptoms?: string;
          title?: string;
          verification?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_inventory_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_admin: boolean;
          name: string;
          parent_id: string | null;
          post_id: string;
          status: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          is_admin?: boolean;
          name: string;
          parent_id?: string | null;
          post_id: string;
          status?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_admin?: boolean;
          name?: string;
          parent_id?: string | null;
          post_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          id: number;
          kind: string;
          post_id: string | null;
          query: string;
          result_count: number | null;
          target_id: string | null;
          visitor_id: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          kind: string;
          post_id?: string | null;
          query?: string;
          result_count?: number | null;
          target_id?: string | null;
          visitor_id: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          kind?: string;
          post_id?: string | null;
          query?: string;
          result_count?: number | null;
          target_id?: string | null;
          visitor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      laptops: {
        Row: {
          available: boolean;
          condition: string;
          cpu: string;
          created_at: string;
          currency: string;
          description: string;
          display: string;
          id: string;
          images: Json;
          model: string;
          price: number | null;
          ram: string;
          storage: string;
        };
        Insert: {
          available?: boolean;
          condition?: string;
          cpu?: string;
          created_at?: string;
          currency?: string;
          description?: string;
          display?: string;
          id?: string;
          images?: Json;
          model: string;
          price?: number | null;
          ram?: string;
          storage?: string;
        };
        Update: {
          available?: boolean;
          condition?: string;
          cpu?: string;
          created_at?: string;
          currency?: string;
          description?: string;
          display?: string;
          id?: string;
          images?: Json;
          model?: string;
          price?: number | null;
          ram?: string;
          storage?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          created_at: string;
          post_id: string;
          visitor_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          visitor_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          visitor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          alt: string;
          created_at: string;
          height: number;
          id: string;
          original_path: string;
          path: string;
          width: number;
        };
        Insert: {
          alt?: string;
          created_at?: string;
          height: number;
          id?: string;
          original_path: string;
          path: string;
          width: number;
        };
        Update: {
          alt?: string;
          created_at?: string;
          height?: number;
          id?: string;
          original_path?: string;
          path?: string;
          width?: number;
        };
        Relationships: [];
      };
      page_views: {
        Row: {
          created_at: string;
          day: string;
          post_id: string;
          source: string;
          visitor_id: string;
        };
        Insert: {
          created_at?: string;
          day?: string;
          post_id: string;
          source?: string;
          visitor_id: string;
        };
        Update: {
          created_at?: string;
          day?: string;
          post_id?: string;
          source?: string;
          visitor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_views_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_revisions: {
        Row: {
          body: Json;
          created_at: string;
          id: number;
          post_id: string;
        };
        Insert: {
          body: Json;
          created_at?: string;
          id?: never;
          post_id: string;
        };
        Update: {
          body?: Json;
          created_at?: string;
          id?: never;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_revisions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          alternatives: string;
          category: string;
          cause: string;
          commands: string;
          comment_count: number;
          created_at: string;
          device: string;
          error_message: string;
          excerpt: string;
          faq: Json;
          id: string;
          likes: number;
          manufacturer: string;
          os: string;
          published_at: string | null;
          related_ids: string[];
          screenshots: Json;
          search_document: unknown;
          seo_description: string;
          seo_title: string;
          slug: string;
          status: string;
          steps: string;
          symptoms: string;
          tags: string[];
          title: string;
          updated_at: string;
          verification: string;
          verified: boolean;
          views: number;
          warnings: string;
        };
        Insert: {
          alternatives?: string;
          category?: string;
          cause?: string;
          commands?: string;
          comment_count?: number;
          created_at?: string;
          device?: string;
          error_message?: string;
          excerpt?: string;
          faq?: Json;
          id?: string;
          likes?: number;
          manufacturer?: string;
          os?: string;
          published_at?: string | null;
          related_ids?: string[];
          screenshots?: Json;
          search_document?: unknown;
          seo_description?: string;
          seo_title?: string;
          slug: string;
          status?: string;
          steps?: string;
          symptoms?: string;
          tags?: string[];
          title: string;
          updated_at?: string;
          verification?: string;
          verified?: boolean;
          views?: number;
          warnings?: string;
        };
        Update: {
          alternatives?: string;
          category?: string;
          cause?: string;
          commands?: string;
          comment_count?: number;
          created_at?: string;
          device?: string;
          error_message?: string;
          excerpt?: string;
          faq?: Json;
          id?: string;
          likes?: number;
          manufacturer?: string;
          os?: string;
          published_at?: string | null;
          related_ids?: string[];
          screenshots?: Json;
          search_document?: unknown;
          seo_description?: string;
          seo_title?: string;
          slug?: string;
          status?: string;
          steps?: string;
          symptoms?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
          verification?: string;
          verified?: boolean;
          views?: number;
          warnings?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          expires_at: string;
          hits: number;
          key: string;
        };
        Insert: {
          expires_at: string;
          hits?: number;
          key: string;
        };
        Update: {
          expires_at?: string;
          hits?: number;
          key?: string;
        };
        Relationships: [];
      };
      redirects: {
        Row: {
          old_slug: string;
          post_id: string;
        };
        Insert: {
          old_slug: string;
          post_id: string;
        };
        Update: {
          old_slug?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redirects_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: number;
          value: Json;
        };
        Insert: {
          id: number;
          value?: Json;
        };
        Update: {
          id?: number;
          value?: Json;
        };
        Relationships: [];
      };
      solution_requests: {
        Row: {
          consent: boolean;
          contact: string;
          created_at: string;
          description: string;
          device: string;
          error_message: string;
          id: string;
          os: string;
          post_id: string | null;
          screenshot_paths: string[];
          status: string;
          title: string;
          tried: string;
        };
        Insert: {
          consent: boolean;
          contact?: string;
          created_at?: string;
          description: string;
          device?: string;
          error_message?: string;
          id?: string;
          os?: string;
          post_id?: string | null;
          screenshot_paths?: string[];
          status?: string;
          title: string;
          tried?: string;
        };
        Update: {
          consent?: boolean;
          contact?: string;
          created_at?: string;
          description?: string;
          device?: string;
          error_message?: string;
          id?: string;
          os?: string;
          post_id?: string | null;
          screenshot_paths?: string[];
          status?: string;
          title?: string;
          tried?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solution_requests_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_events: { Args: never; Returns: undefined };
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window: number };
        Returns: boolean;
      };
      convert_request: {
        Args: { p_id: string; p_slug: string };
        Returns: string;
      };
      dashboard_stats: { Args: never; Returns: Json };
      engagement_total: { Args: never; Returns: number };
      is_admin: { Args: never; Returns: boolean };
      record_view: {
        Args: { p_post: string; p_source: string; p_visitor: string };
        Returns: undefined;
      };
      search_tags: { Args: { v: string[] }; Returns: string };
      set_like: {
        Args: { p_active: boolean; p_post: string; p_visitor: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
