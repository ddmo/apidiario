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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      apiaries: {
        Row: {
          address: string | null
          archived_at: string | null
          bda_codice_aziendale: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          main_photo_path: string | null
          name: string
          notes: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          bda_codice_aziendale?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_photo_path?: string | null
          name: string
          notes?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          bda_codice_aziendale?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_photo_path?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apiaries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apiary_access: {
        Row: {
          apiary_id: string
          granted_at: string
          granted_by: string
          role: Database["public"]["Enums"]["access_role"]
          user_id: string
        }
        Insert: {
          apiary_id: string
          granted_at?: string
          granted_by: string
          role: Database["public"]["Enums"]["access_role"]
          user_id: string
        }
        Update: {
          apiary_id?: string
          granted_at?: string
          granted_by?: string
          role?: Database["public"]["Enums"]["access_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apiary_access_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apiary_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apiary_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_admins: {
        Row: {
          created_at: string
          created_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          user_id?: string
        }
        Relationships: []
      }
      harvests: {
        Row: {
          apiary_id: string
          batch_code: string | null
          created_at: string
          harvested_on: string
          honey_type: string
          humidity_pct: number | null
          id: string
          notes: string | null
          recorded_by: string
          total_kg: number
          updated_at: string
        }
        Insert: {
          apiary_id: string
          batch_code?: string | null
          created_at?: string
          harvested_on: string
          honey_type: string
          humidity_pct?: number | null
          id?: string
          notes?: string | null
          recorded_by: string
          total_kg: number
          updated_at?: string
        }
        Update: {
          apiary_id?: string
          batch_code?: string | null
          created_at?: string
          harvested_on?: string
          honey_type?: string
          humidity_pct?: number | null
          id?: string
          notes?: string | null
          recorded_by?: string
          total_kg?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvests_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvests_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hives: {
        Row: {
          apiary_id: string
          archived_at: string | null
          bee_race: Database["public"]["Enums"]["bee_race"]
          created_at: string
          has_apiscampo: boolean
          has_pollen_trap: boolean
          has_propolis_net: boolean
          hive_type: Database["public"]["Enums"]["hive_type"]
          id: string
          identifier: string
          installed_on: string | null
          melari_count: number
          nido_frame_count: number
          notes: string | null
          origin_notes: string | null
          status: Database["public"]["Enums"]["hive_status"]
          updated_at: string
        }
        Insert: {
          apiary_id: string
          archived_at?: string | null
          bee_race?: Database["public"]["Enums"]["bee_race"]
          created_at?: string
          has_apiscampo?: boolean
          has_pollen_trap?: boolean
          has_propolis_net?: boolean
          hive_type?: Database["public"]["Enums"]["hive_type"]
          id?: string
          identifier: string
          installed_on?: string | null
          melari_count?: number
          nido_frame_count?: number
          notes?: string | null
          origin_notes?: string | null
          status?: Database["public"]["Enums"]["hive_status"]
          updated_at?: string
        }
        Update: {
          apiary_id?: string
          archived_at?: string | null
          bee_race?: Database["public"]["Enums"]["bee_race"]
          created_at?: string
          has_apiscampo?: boolean
          has_pollen_trap?: boolean
          has_propolis_net?: boolean
          hive_type?: Database["public"]["Enums"]["hive_type"]
          id?: string
          identifier?: string
          installed_on?: string | null
          melari_count?: number
          nido_frame_count?: number
          notes?: string | null
          origin_notes?: string | null
          status?: Database["public"]["Enums"]["hive_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hives_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_voice_notes: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          inspection_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          id?: string
          inspection_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          inspection_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_voice_notes_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          behavior: Database["public"]["Enums"]["behavior_type"] | null
          brood_capped: boolean | null
          brood_eggs: boolean | null
          brood_frame_count: number | null
          brood_larvae: boolean | null
          created_at: string
          hive_id: string
          honey_frame_count: number | null
          id: string
          interventions: string[]
          notes: string | null
          pathologies: Database["public"]["Enums"]["pathology"][] | null
          performed_at: string
          performed_by: string
          pollen_frame_count: number | null
          pollen_importation: boolean | null
          population: Database["public"]["Enums"]["population_strength"] | null
          queen_cells: Database["public"]["Enums"]["queen_cells_type"] | null
          queen_seen: Database["public"]["Enums"]["queen_seen_state"]
          temperature_c: number | null
          updated_at: string
          varroa_count: number | null
          varroa_count_method:
            | Database["public"]["Enums"]["varroa_count_method"]
            | null
          weather_summary: string | null
        }
        Insert: {
          behavior?: Database["public"]["Enums"]["behavior_type"] | null
          brood_capped?: boolean | null
          brood_eggs?: boolean | null
          brood_frame_count?: number | null
          brood_larvae?: boolean | null
          created_at?: string
          hive_id: string
          honey_frame_count?: number | null
          id?: string
          interventions?: string[]
          notes?: string | null
          pathologies?: Database["public"]["Enums"]["pathology"][] | null
          performed_at?: string
          performed_by: string
          pollen_frame_count?: number | null
          pollen_importation?: boolean | null
          population?: Database["public"]["Enums"]["population_strength"] | null
          queen_cells?: Database["public"]["Enums"]["queen_cells_type"] | null
          queen_seen?: Database["public"]["Enums"]["queen_seen_state"]
          temperature_c?: number | null
          updated_at?: string
          varroa_count?: number | null
          varroa_count_method?:
            | Database["public"]["Enums"]["varroa_count_method"]
            | null
          weather_summary?: string | null
        }
        Update: {
          behavior?: Database["public"]["Enums"]["behavior_type"] | null
          brood_capped?: boolean | null
          brood_eggs?: boolean | null
          brood_frame_count?: number | null
          brood_larvae?: boolean | null
          created_at?: string
          hive_id?: string
          honey_frame_count?: number | null
          id?: string
          interventions?: string[]
          notes?: string | null
          pathologies?: Database["public"]["Enums"]["pathology"][] | null
          performed_at?: string
          performed_by?: string
          pollen_frame_count?: number | null
          pollen_importation?: boolean | null
          population?: Database["public"]["Enums"]["population_strength"] | null
          queen_cells?: Database["public"]["Enums"]["queen_cells_type"] | null
          queen_seen?: Database["public"]["Enums"]["queen_seen_state"]
          temperature_c?: number | null
          updated_at?: string
          varroa_count?: number | null
          varroa_count_method?:
            | Database["public"]["Enums"]["varroa_count_method"]
            | null
          weather_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          apiary_id: string | null
          caption: string | null
          created_at: string
          duration_seconds: number | null
          height: number | null
          hive_id: string | null
          id: string
          inspection_id: string | null
          kind: Database["public"]["Enums"]["media_kind"]
          size_bytes: number | null
          storage_path: string
          thumbnail_path: string | null
          uploaded_by: string
          width: number | null
        }
        Insert: {
          apiary_id?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          hive_id?: string | null
          id?: string
          inspection_id?: string | null
          kind: Database["public"]["Enums"]["media_kind"]
          size_bytes?: number | null
          storage_path: string
          thumbnail_path?: string | null
          uploaded_by: string
          width?: number | null
        }
        Update: {
          apiary_id?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          hive_id?: string | null
          id?: string
          inspection_id?: string | null
          kind?: Database["public"]["Enums"]["media_kind"]
          size_bytes?: number | null
          storage_path?: string
          thumbnail_path?: string | null
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phenology_species: {
        Row: {
          bloom_period_text: string | null
          common_name_it: string
          gdd_bloom_end: number
          gdd_bloom_peak: number
          gdd_bloom_start: number
          honey_relevance: number | null
          id: string
          notes_it: string | null
          produces_honey: boolean | null
          produces_pollen: boolean | null
          scientific_name: string
        }
        Insert: {
          bloom_period_text?: string | null
          common_name_it: string
          gdd_bloom_end: number
          gdd_bloom_peak: number
          gdd_bloom_start: number
          honey_relevance?: number | null
          id: string
          notes_it?: string | null
          produces_honey?: boolean | null
          produces_pollen?: boolean | null
          scientific_name: string
        }
        Update: {
          bloom_period_text?: string | null
          common_name_it?: string
          gdd_bloom_end?: number
          gdd_bloom_peak?: number
          gdd_bloom_start?: number
          honey_relevance?: number | null
          id?: string
          notes_it?: string | null
          produces_honey?: boolean | null
          produces_pollen?: boolean | null
          scientific_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      queens: {
        Row: {
          birth_year: number | null
          created_at: string
          end_date: string | null
          end_reason: string | null
          hive_id: string
          id: string
          marking_color: Database["public"]["Enums"]["queen_marking_color"]
          notes: string | null
          origin: Database["public"]["Enums"]["queen_origin"]
          start_date: string
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          end_date?: string | null
          end_reason?: string | null
          hive_id: string
          id?: string
          marking_color?: Database["public"]["Enums"]["queen_marking_color"]
          notes?: string | null
          origin?: Database["public"]["Enums"]["queen_origin"]
          start_date?: string
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          end_date?: string | null
          end_reason?: string | null
          hive_id?: string
          id?: string
          marking_color?: Database["public"]["Enums"]["queen_marking_color"]
          notes?: string | null
          origin?: Database["public"]["Enums"]["queen_origin"]
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queens_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          apiary_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string
          hive_id: string | null
          id: string
          push_enabled: boolean
          recurrence: Database["public"]["Enums"]["reminder_recurrence"]
          scope: Database["public"]["Enums"]["reminder_scope"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apiary_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at: string
          hive_id?: string | null
          id?: string
          push_enabled?: boolean
          recurrence?: Database["public"]["Enums"]["reminder_recurrence"]
          scope: Database["public"]["Enums"]["reminder_scope"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apiary_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          hive_id?: string | null
          id?: string
          push_enabled?: boolean
          recurrence?: Database["public"]["Enums"]["reminder_recurrence"]
          scope?: Database["public"]["Enums"]["reminder_scope"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_hives: {
        Row: {
          hive_id: string
          treatment_id: string
        }
        Insert: {
          hive_id: string
          treatment_id: string
        }
        Update: {
          hive_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_hives_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_hives_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          apiary_id: string
          applies_to_all_hives: boolean
          blocks_melari: boolean
          cost_eur: number | null
          created_at: string
          dosage_notes: string | null
          end_date: string | null
          id: string
          notes: string | null
          performed_by: string
          product_name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          apiary_id: string
          applies_to_all_hives?: boolean
          blocks_melari?: boolean
          cost_eur?: number | null
          created_at?: string
          dosage_notes?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          performed_by: string
          product_name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          apiary_id?: string
          applies_to_all_hives?: boolean
          blocks_melari?: boolean
          cost_eur?: number | null
          created_at?: string
          dosage_notes?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          performed_by?: string
          product_name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_hive_with_queen: {
        Args: {
          p_apiary_id: string
          p_bee_race: Database["public"]["Enums"]["bee_race"]
          p_hive_type: Database["public"]["Enums"]["hive_type"]
          p_id: string
          p_identifier: string
          p_installed_on: string
          p_nido_frame_count: number
          p_notes: string
          p_origin_notes: string
        }
        Returns: undefined
      }
      is_app_admin: { Args: never; Returns: boolean }
      storage_can_delete_apiary_media: {
        Args: { object_name: string }
        Returns: boolean
      }
      storage_can_read_apiary_media: {
        Args: { object_name: string }
        Returns: boolean
      }
      storage_can_write_apiary_media: {
        Args: { object_name: string }
        Returns: boolean
      }
      storage_get_apiary_id: { Args: { object_name: string }; Returns: string }
      user_can_read_apiary: { Args: { p_apiary_id: string }; Returns: boolean }
      user_can_read_hive: { Args: { p_hive_id: string }; Returns: boolean }
      user_can_write_apiary: { Args: { p_apiary_id: string }; Returns: boolean }
      user_can_write_hive: { Args: { p_hive_id: string }; Returns: boolean }
      user_owns_apiary: { Args: { p_apiary_id: string }; Returns: boolean }
    }
    Enums: {
      access_role: "reader" | "editor"
      bee_race:
        | "ligustica"
        | "buckfast"
        | "carnica"
        | "sicula"
        | "ibrida"
        | "sconosciuta"
      behavior_type: "calmo" | "nervoso" | "aggressivo"
      hive_status:
        | "attiva"
        | "sciamata"
        | "morta"
        | "riunita"
        | "venduta"
        | "ceduta"
      hive_type: "dadant_blatt" | "langstroth" | "top_bar" | "altro"
      media_kind: "photo" | "video"
      pathology:
        | "varroa"
        | "peste_americana"
        | "peste_europea"
        | "covata_calcificata"
        | "nosema"
        | "virus"
        | "altro"
      population_strength: "debole" | "media" | "forte"
      queen_cells_type: "nessuna" | "scorta" | "sciamatura" | "sostituzione"
      queen_marking_color:
        | "bianco"
        | "giallo"
        | "rosso"
        | "verde"
        | "blu"
        | "non_marcata"
      queen_origin:
        | "figlia"
        | "introdotta"
        | "sciamatura"
        | "sostituzione_spontanea"
        | "sconosciuta"
      queen_seen_state: "vista" | "non_vista" | "non_cercata"
      reminder_recurrence: "none" | "weekly" | "monthly" | "yearly"
      reminder_scope: "global" | "apiary" | "hive"
      varroa_count_method:
        | "caduta_naturale"
        | "lavaggio_alcol"
        | "zucchero_velo"
        | "altro"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_role: ["reader", "editor"],
      bee_race: [
        "ligustica",
        "buckfast",
        "carnica",
        "sicula",
        "ibrida",
        "sconosciuta",
      ],
      behavior_type: ["calmo", "nervoso", "aggressivo"],
      hive_status: [
        "attiva",
        "sciamata",
        "morta",
        "riunita",
        "venduta",
        "ceduta",
      ],
      hive_type: ["dadant_blatt", "langstroth", "top_bar", "altro"],
      media_kind: ["photo", "video"],
      pathology: [
        "varroa",
        "peste_americana",
        "peste_europea",
        "covata_calcificata",
        "nosema",
        "virus",
        "altro",
      ],
      population_strength: ["debole", "media", "forte"],
      queen_cells_type: ["nessuna", "scorta", "sciamatura", "sostituzione"],
      queen_marking_color: [
        "bianco",
        "giallo",
        "rosso",
        "verde",
        "blu",
        "non_marcata",
      ],
      queen_origin: [
        "figlia",
        "introdotta",
        "sciamatura",
        "sostituzione_spontanea",
        "sconosciuta",
      ],
      queen_seen_state: ["vista", "non_vista", "non_cercata"],
      reminder_recurrence: ["none", "weekly", "monthly", "yearly"],
      reminder_scope: ["global", "apiary", "hive"],
      varroa_count_method: [
        "caduta_naturale",
        "lavaggio_alcol",
        "zucchero_velo",
        "altro",
      ],
    },
  },
} as const
