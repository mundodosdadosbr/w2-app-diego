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
      ai_usage: {
        Row: {
          cache_hit: boolean | null
          cost_cents: number | null
          created_at: string
          id: string
          latency_ms: number | null
          metadata: Json | null
          model: string
          provider: string
          purpose: string
          tokens_in: number
          tokens_out: number
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          cost_cents?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model: string
          provider: string
          purpose: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          cost_cents?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model?: string
          provider?: string
          purpose?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dialog_lines: {
        Row: {
          audio_key: string | null
          created_at: string
          dialog_key: string
          en: string
          id: string
          lesson_id: string
          order_index: number
          pt_br: string | null
          speaker: string
        }
        Insert: {
          audio_key?: string | null
          created_at?: string
          dialog_key: string
          en: string
          id?: string
          lesson_id: string
          order_index: number
          pt_br?: string | null
          speaker: string
        }
        Update: {
          audio_key?: string | null
          created_at?: string
          dialog_key?: string
          en?: string
          id?: string
          lesson_id?: string
          order_index?: number
          pt_br?: string | null
          speaker?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialog_lines_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          exercise_id: string
          grade: number
          id: string
          is_correct: boolean | null
          lesson_version_id: string
          response: Json
          time_ms: number | null
          user_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          exercise_id: string
          grade: number
          id?: string
          is_correct?: boolean | null
          lesson_version_id: string
          response?: Json
          time_ms?: number | null
          user_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          exercise_id?: string
          grade?: number
          id?: string
          is_correct?: boolean | null
          lesson_version_id?: string
          response?: Json
          time_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          expected: Json
          id: string
          lesson_section_id: string
          order_index: number
          payload: Json
          prompt_en: string | null
          prompt_pt_br: string | null
          scoring: Json
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected?: Json
          id?: string
          lesson_section_id: string
          order_index: number
          payload?: Json
          prompt_en?: string | null
          prompt_pt_br?: string | null
          scoring?: Json
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected?: Json
          id?: string
          lesson_section_id?: string
          order_index?: number
          payload?: Json
          prompt_en?: string | null
          prompt_pt_br?: string | null
          scoring?: Json
          type?: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_section_id_fkey"
            columns: ["lesson_section_id"]
            isOneToOne: false
            referencedRelation: "lesson_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_points: {
        Row: {
          created_at: string
          created_by: string | null
          examples: Json
          explanation_en: string | null
          explanation_pt_br: string
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          rule_pattern: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          title_en: string | null
          title_pt_br: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          examples?: Json
          explanation_en?: string | null
          explanation_pt_br: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          rule_pattern?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title_en?: string | null
          title_pt_br: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          examples?: Json
          explanation_en?: string | null
          explanation_pt_br?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          rule_pattern?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title_en?: string | null
          title_pt_br?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_path_progress: {
        Row: {
          current_lesson_id: string | null
          current_unit_id: string | null
          open_mode: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          current_lesson_id?: string | null
          current_unit_id?: string | null
          open_mode?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          current_lesson_id?: string | null
          current_unit_id?: string | null
          open_mode?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_progress_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_progress_current_unit_id_fkey"
            columns: ["current_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_grammar: {
        Row: {
          grammar_point_id: string
          lesson_id: string
          order_index: number
        }
        Insert: {
          grammar_point_id: string
          lesson_id: string
          order_index?: number
        }
        Update: {
          grammar_point_id?: string
          lesson_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_grammar_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_grammar_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_phrases: {
        Row: {
          lesson_id: string
          order_index: number
          phrase_pattern_id: string
        }
        Insert: {
          lesson_id: string
          order_index?: number
          phrase_pattern_id: string
        }
        Update: {
          lesson_id?: string
          order_index?: number
          phrase_pattern_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_phrases_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_phrases_phrase_pattern_id_fkey"
            columns: ["phrase_pattern_id"]
            isOneToOne: false
            referencedRelation: "phrase_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          avg_grade: number | null
          completed_at: string | null
          current_section:
            | Database["public"]["Enums"]["lesson_section_kind"]
            | null
          id: string
          lesson_id: string
          lesson_version_id: string
          sections_completed: Database["public"]["Enums"]["lesson_section_kind"][]
          started_at: string
          status: Database["public"]["Enums"]["progress_status"]
          total_time_ms: number
          unit_version_id: string
          user_id: string
        }
        Insert: {
          avg_grade?: number | null
          completed_at?: string | null
          current_section?:
            | Database["public"]["Enums"]["lesson_section_kind"]
            | null
          id?: string
          lesson_id: string
          lesson_version_id: string
          sections_completed?: Database["public"]["Enums"]["lesson_section_kind"][]
          started_at?: string
          status?: Database["public"]["Enums"]["progress_status"]
          total_time_ms?: number
          unit_version_id: string
          user_id: string
        }
        Update: {
          avg_grade?: number | null
          completed_at?: string | null
          current_section?:
            | Database["public"]["Enums"]["lesson_section_kind"]
            | null
          id?: string
          lesson_id?: string
          lesson_version_id?: string
          sections_completed?: Database["public"]["Enums"]["lesson_section_kind"][]
          started_at?: string
          status?: Database["public"]["Enums"]["progress_status"]
          total_time_ms?: number
          unit_version_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_unit_version_id_fkey"
            columns: ["unit_version_id"]
            isOneToOne: false
            referencedRelation: "unit_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sections: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["lesson_section_kind"]
          lesson_id: string
          order_index: number
          payload: Json
          required: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["lesson_section_kind"]
          lesson_id: string
          order_index: number
          payload?: Json
          required?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["lesson_section_kind"]
          lesson_id?: string
          order_index?: number
          payload?: Json
          required?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_versions: {
        Row: {
          id: string
          lesson_id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          tts_ready: boolean
          version: number
        }
        Insert: {
          id?: string
          lesson_id: string
          published_at?: string
          published_by?: string | null
          snapshot: Json
          tts_ready?: boolean
          version: number
        }
        Update: {
          id?: string
          lesson_id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          tts_ready?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_versions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_vocabulary: {
        Row: {
          lesson_id: string
          order_index: number
          vocabulary_item_id: string
        }
        Insert: {
          lesson_id: string
          order_index?: number
          vocabulary_item_id: string
        }
        Update: {
          lesson_id?: string
          order_index?: number
          vocabulary_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_vocabulary_vocabulary_item_id_fkey"
            columns: ["vocabulary_item_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          ai_generated: boolean
          created_at: string
          created_by: string | null
          estimated_minutes: number
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          published_version_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title_en: string
          title_pt_br: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          created_by?: string | null
          estimated_minutes?: number
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          published_version_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title_en: string
          title_pt_br: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          created_by?: string | null
          estimated_minutes?: number
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index?: number
          published_version_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string
          title_pt_br?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_published_version_fk"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      phrase_patterns: {
        Row: {
          audio_key: string | null
          created_at: string
          created_by: string | null
          en: string
          function_tag: string | null
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          pt_br: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          audio_key?: string | null
          created_at?: string
          created_by?: string | null
          en: string
          function_tag?: string | null
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          pt_br: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          audio_key?: string | null
          created_at?: string
          created_by?: string | null
          en?: string
          function_tag?: string | null
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          pt_br?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          ref_id: string | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          ref_id?: string | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          analytics_opted_in: boolean
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          created_at: string
          deletion_requested_at: string | null
          display_name: string | null
          email_marketing_opted_in: boolean
          id: string
          keep_recordings_indefinitely: boolean
          locale: string
          microphone_denied: boolean
          onboarded_at: string | null
          points_total: number
          privacy_accepted_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
          timezone: string
          updated_at: string
          weekly_goal_minutes: number
        }
        Insert: {
          analytics_opted_in?: boolean
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          email_marketing_opted_in?: boolean
          id: string
          keep_recordings_indefinitely?: boolean
          locale?: string
          microphone_denied?: boolean
          onboarded_at?: string | null
          points_total?: number
          privacy_accepted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          timezone?: string
          updated_at?: string
          weekly_goal_minutes?: number
        }
        Update: {
          analytics_opted_in?: boolean
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          email_marketing_opted_in?: boolean
          id?: string
          keep_recordings_indefinitely?: boolean
          locale?: string
          microphone_denied?: boolean
          onboarded_at?: string | null
          points_total?: number
          privacy_accepted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          timezone?: string
          updated_at?: string
          weekly_goal_minutes?: number
        }
        Relationships: []
      }
      pronunciation_attempts: {
        Row: {
          audio_key: string | null
          avg_confidence: number | null
          created_at: string
          exercise_id: string | null
          expected: string
          id: string
          lesson_version_id: string | null
          low_audio_quality: boolean
          problem_words: Json | null
          pronunciation_target_id: string | null
          retry_number: number
          score: number | null
          transcribed: string | null
          user_id: string
          wer: number | null
          words: Json | null
        }
        Insert: {
          audio_key?: string | null
          avg_confidence?: number | null
          created_at?: string
          exercise_id?: string | null
          expected: string
          id?: string
          lesson_version_id?: string | null
          low_audio_quality?: boolean
          problem_words?: Json | null
          pronunciation_target_id?: string | null
          retry_number?: number
          score?: number | null
          transcribed?: string | null
          user_id: string
          wer?: number | null
          words?: Json | null
        }
        Update: {
          audio_key?: string | null
          avg_confidence?: number | null
          created_at?: string
          exercise_id?: string | null
          expected?: string
          id?: string
          lesson_version_id?: string | null
          low_audio_quality?: boolean
          problem_words?: Json | null
          pronunciation_target_id?: string | null
          retry_number?: number
          score?: number | null
          transcribed?: string | null
          user_id?: string
          wer?: number | null
          words?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pronunciation_attempts_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pronunciation_attempts_pronunciation_target_id_fkey"
            columns: ["pronunciation_target_id"]
            isOneToOne: false
            referencedRelation: "pronunciation_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pronunciation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pronunciation_targets: {
        Row: {
          audio_key_normal: string | null
          audio_key_slow: string | null
          created_at: string
          focus_phonemes: string[]
          id: string
          lesson_id: string
          order_index: number
          text_en: string
        }
        Insert: {
          audio_key_normal?: string | null
          audio_key_slow?: string | null
          created_at?: string
          focus_phonemes?: string[]
          id?: string
          lesson_id: string
          order_index: number
          text_en: string
        }
        Update: {
          audio_key_normal?: string | null
          audio_key_slow?: string | null
          created_at?: string
          focus_phonemes?: string[]
          id?: string
          lesson_id?: string
          order_index?: number
          text_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_targets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          consecutive_passes: number
          created_at: string
          due_at: string
          ease_factor: number
          id: string
          interval_days: number
          item_id: string
          item_type: Database["public"]["Enums"]["review_item_type"]
          last_grade: number | null
          last_reviewed_at: string | null
          origin_lesson_version_id: string | null
          stage: Database["public"]["Enums"]["review_stage"]
          user_id: string
        }
        Insert: {
          consecutive_passes?: number
          created_at?: string
          due_at: string
          ease_factor?: number
          id?: string
          interval_days?: number
          item_id: string
          item_type: Database["public"]["Enums"]["review_item_type"]
          last_grade?: number | null
          last_reviewed_at?: string | null
          origin_lesson_version_id?: string | null
          stage?: Database["public"]["Enums"]["review_stage"]
          user_id: string
        }
        Update: {
          consecutive_passes?: number
          created_at?: string
          due_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          item_id?: string
          item_type?: Database["public"]["Enums"]["review_item_type"]
          last_grade?: number | null
          last_reviewed_at?: string | null
          origin_lesson_version_id?: string | null
          stage?: Database["public"]["Enums"]["review_stage"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_origin_lesson_version_id_fkey"
            columns: ["origin_lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      self_assessment_items: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          id: string
          note: string | null
          self_assessment_id: string
          unit_objective_id: string
        }
        Insert: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          id?: string
          note?: string | null
          self_assessment_id: string
          unit_objective_id: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          id?: string
          note?: string | null
          self_assessment_id?: string
          unit_objective_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_assessment_items_self_assessment_id_fkey"
            columns: ["self_assessment_id"]
            isOneToOne: false
            referencedRelation: "self_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "self_assessment_items_unit_objective_id_fkey"
            columns: ["unit_objective_id"]
            isOneToOne: false
            referencedRelation: "unit_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      self_assessments: {
        Row: {
          id: string
          submitted_at: string
          unit_id: string
          unit_version_id: string
          user_id: string
        }
        Insert: {
          id?: string
          submitted_at?: string
          unit_id: string
          unit_version_id: string
          user_id: string
        }
        Update: {
          id?: string
          submitted_at?: string
          unit_id?: string
          unit_version_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_assessments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "self_assessments_unit_version_id_fkey"
            columns: ["unit_version_id"]
            isOneToOne: false
            referencedRelation: "unit_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "self_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_checkpoints: {
        Row: {
          achieved_at: string
          evidence: Json | null
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          skill: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          evidence?: Json | null
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          skill: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          evidence?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          skill?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_checkpoints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_sessions: {
        Row: {
          avg_user_words: number | null
          ended_at: string | null
          feedback_summary: Json | null
          id: string
          lesson_version_id: string | null
          level: Database["public"]["Enums"]["cefr_level"]
          mode: Database["public"]["Enums"]["speaking_mode"]
          scenario: Json | null
          started_at: string
          turn_count: number
          user_id: string
        }
        Insert: {
          avg_user_words?: number | null
          ended_at?: string | null
          feedback_summary?: Json | null
          id?: string
          lesson_version_id?: string | null
          level: Database["public"]["Enums"]["cefr_level"]
          mode: Database["public"]["Enums"]["speaking_mode"]
          scenario?: Json | null
          started_at?: string
          turn_count?: number
          user_id: string
        }
        Update: {
          avg_user_words?: number | null
          ended_at?: string | null
          feedback_summary?: Json | null
          id?: string
          lesson_version_id?: string | null
          level?: Database["public"]["Enums"]["cefr_level"]
          mode?: Database["public"]["Enums"]["speaking_mode"]
          scenario?: Json | null
          started_at?: string
          turn_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaking_sessions_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaking_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_turns: {
        Row: {
          audio_key: string | null
          cache_hit: boolean | null
          correction: Json | null
          created_at: string
          id: string
          latency_ms: number | null
          session_id: string
          speaker: string
          text_en: string | null
          text_original: string | null
          tokens_in: number | null
          tokens_out: number | null
          turn_index: number
        }
        Insert: {
          audio_key?: string | null
          cache_hit?: boolean | null
          correction?: Json | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          session_id: string
          speaker: string
          text_en?: string | null
          text_original?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          turn_index: number
        }
        Update: {
          audio_key?: string | null
          cache_hit?: boolean | null
          correction?: Json | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          session_id?: string
          speaker?: string
          text_en?: string | null
          text_original?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          turn_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "speaking_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "speaking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string
          current_count: number
          freeze_tokens: number
          last_active_date: string | null
          longest_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          freeze_tokens?: number
          last_active_date?: string | null
          longest_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_count?: number
          freeze_tokens?: number
          last_active_date?: string | null
          longest_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tts_pregen_failures: {
        Row: {
          attempt_number: number
          id: string
          last_attempt_at: string
          last_error: string | null
          lesson_version_id: string
          resolved_at: string | null
          text_hash: string
          text_sample: string
          voice: string | null
        }
        Insert: {
          attempt_number?: number
          id?: string
          last_attempt_at?: string
          last_error?: string | null
          lesson_version_id: string
          resolved_at?: string | null
          text_hash: string
          text_sample: string
          voice?: string | null
        }
        Update: {
          attempt_number?: number
          id?: string
          last_attempt_at?: string
          last_error?: string | null
          lesson_version_id?: string
          resolved_at?: string | null
          text_hash?: string
          text_sample?: string
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tts_pregen_failures_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_objectives: {
        Row: {
          created_at: string
          i_can_en: string | null
          i_can_pt_br: string
          id: string
          linked_lesson_id: string | null
          order_index: number
          skill_tag: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          i_can_en?: string | null
          i_can_pt_br: string
          id?: string
          linked_lesson_id?: string | null
          order_index: number
          skill_tag?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          i_can_en?: string | null
          i_can_pt_br?: string
          id?: string
          linked_lesson_id?: string | null
          order_index?: number
          skill_tag?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_objectives_linked_lesson_fk"
            columns: ["linked_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_objectives_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_progress: {
        Row: {
          completed_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["progress_status"]
          unit_id: string
          unit_version_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["progress_status"]
          unit_id: string
          unit_version_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["progress_status"]
          unit_id?: string
          unit_version_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_progress_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_progress_unit_version_id_fkey"
            columns: ["unit_version_id"]
            isOneToOne: false
            referencedRelation: "unit_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_versions: {
        Row: {
          id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          unit_id: string
          version: number
        }
        Insert: {
          id?: string
          published_at?: string
          published_by?: string | null
          snapshot: Json
          unit_id: string
          version: number
        }
        Update: {
          id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          unit_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "unit_versions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          created_by: string | null
          estimated_minutes: number | null
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          published_version_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          theme: string | null
          title_en: string
          title_pt_br: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estimated_minutes?: number | null
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          published_version_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          theme?: string | null
          title_en: string
          title_pt_br: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estimated_minutes?: number | null
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index?: number
          published_version_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          theme?: string | null
          title_en?: string
          title_pt_br?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_published_version_fk"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "unit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reviews_plan: {
        Row: {
          expires_at: string
          generated_at: string
          message_pt_br: string | null
          plan: Json
          user_id: string
        }
        Insert: {
          expires_at: string
          generated_at?: string
          message_pt_br?: string | null
          plan: Json
          user_id: string
        }
        Update: {
          expires_at?: string
          generated_at?: string
          message_pt_br?: string | null
          plan?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          audio_key: string | null
          created_at: string
          created_by: string | null
          en: string
          example_en: string | null
          example_pt_br: string | null
          id: string
          image_key: string | null
          level: Database["public"]["Enums"]["cefr_level"]
          part_of_speech: string | null
          pt_br: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          audio_key?: string | null
          created_at?: string
          created_by?: string | null
          en: string
          example_en?: string | null
          example_pt_br?: string | null
          id?: string
          image_key?: string | null
          level?: Database["public"]["Enums"]["cefr_level"]
          part_of_speech?: string | null
          pt_br: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          audio_key?: string | null
          created_at?: string
          created_by?: string | null
          en?: string
          example_en?: string | null
          example_pt_br?: string | null
          id?: string
          image_key?: string | null
          level?: Database["public"]["Enums"]["cefr_level"]
          part_of_speech?: string | null
          pt_br?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_review_grade: {
        Args: { p_grade: number; p_review_id: string }
        Returns: {
          consecutive_passes: number
          created_at: string
          due_at: string
          ease_factor: number
          id: string
          interval_days: number
          item_id: string
          item_type: Database["public"]["Enums"]["review_item_type"]
          last_grade: number | null
          last_reviewed_at: string | null
          origin_lesson_version_id: string | null
          stage: Database["public"]["Enums"]["review_stage"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_lesson: {
        Args: { p_lesson_version_id: string; p_user_id: string }
        Returns: {
          avg_grade: number | null
          completed_at: string | null
          current_section:
            | Database["public"]["Enums"]["lesson_section_kind"]
            | null
          id: string
          lesson_id: string
          lesson_version_id: string
          sections_completed: Database["public"]["Enums"]["lesson_section_kind"][]
          started_at: string
          status: Database["public"]["Enums"]["progress_status"]
          total_time_ms: number
          unit_version_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_initial_review: {
        Args: {
          p_item_id: string
          p_item_type: Database["public"]["Enums"]["review_item_type"]
          p_origin_lesson_version_id: string
          p_user_id: string
        }
        Returns: {
          consecutive_passes: number
          created_at: string
          due_at: string
          ease_factor: number
          id: string
          interval_days: number
          item_id: string
          item_type: Database["public"]["Enums"]["review_item_type"]
          last_grade: number | null
          last_reviewed_at: string | null
          origin_lesson_version_id: string | null
          stage: Database["public"]["Enums"]["review_stage"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_recordings_due_for_purge: {
        Args: { p_limit?: number }
        Returns: {
          audio_key: string
          row_id: string
          source_table: string
          user_id: string
        }[]
      }
      is_content_editor: { Args: never; Returns: boolean }
      mark_recording_purged: {
        Args: { p_row_id: string; p_source_table: string }
        Returns: undefined
      }
      publish_lesson: {
        Args: { p_lesson_id: string }
        Returns: {
          id: string
          lesson_id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          tts_ready: boolean
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "lesson_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_unit: {
        Args: { p_unit_id: string }
        Returns: {
          id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          unit_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "unit_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_streak: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          current_count: number
          freeze_tokens: number
          last_active_date: string | null
          longest_count: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_self_assessment: {
        Args: { p_items: Json; p_unit_version_id: string; p_user_id: string }
        Returns: {
          id: string
          submitted_at: string
          unit_id: string
          unit_version_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "self_assessments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_review_on_error: {
        Args: {
          p_item_id: string
          p_item_type: Database["public"]["Enums"]["review_item_type"]
          p_origin_lesson_version_id: string
          p_user_id: string
        }
        Returns: {
          consecutive_passes: number
          created_at: string
          due_at: string
          ease_factor: number
          id: string
          interval_days: number
          item_id: string
          item_type: Database["public"]["Enums"]["review_item_type"]
          last_grade: number | null
          last_reviewed_at: string | null
          origin_lesson_version_id: string | null
          stage: Database["public"]["Enums"]["review_stage"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      cefr_level: "a0" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2"
      confidence_level: "i_can" | "not_sure" | "cant_yet"
      content_status: "draft" | "review" | "published" | "archived"
      exercise_type:
        | "shadow_repeat"
        | "multiple_choice"
        | "fill_blank"
        | "word_order"
        | "match_word_image"
        | "match_en_pt"
        | "short_answer"
        | "build_sentence"
        | "role_play"
        | "shadowing"
        | "pronunciation"
        | "review_quiz"
        | "listen_and_number"
      lesson_section_kind:
        | "intro"
        | "verbs"
        | "new_words"
        | "handy_phrases"
        | "grammar"
        | "in_context"
        | "drill"
        | "speak_now"
        | "pair_practice"
        | "listen_and_act"
        | "fluency"
        | "pronunciation"
        | "recap"
        | "self_check"
      progress_status: "in_progress" | "completed" | "abandoned"
      review_item_type: "vocab" | "phrase" | "grammar" | "chunk"
      review_stage: "d1" | "d3" | "d7" | "d14" | "d30" | "mastered"
      speaking_mode:
        | "short_answer"
        | "open_conversation"
        | "role_play"
        | "fluency"
        | "lesson_pair"
      user_role: "student" | "author" | "reviewer" | "admin"
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
      cefr_level: ["a0", "a1", "a2", "b1", "b2", "c1", "c2"],
      confidence_level: ["i_can", "not_sure", "cant_yet"],
      content_status: ["draft", "review", "published", "archived"],
      exercise_type: [
        "shadow_repeat",
        "multiple_choice",
        "fill_blank",
        "word_order",
        "match_word_image",
        "match_en_pt",
        "short_answer",
        "build_sentence",
        "role_play",
        "shadowing",
        "pronunciation",
        "review_quiz",
        "listen_and_number",
      ],
      lesson_section_kind: [
        "intro",
        "verbs",
        "new_words",
        "handy_phrases",
        "grammar",
        "in_context",
        "drill",
        "speak_now",
        "pair_practice",
        "listen_and_act",
        "fluency",
        "pronunciation",
        "recap",
        "self_check",
      ],
      progress_status: ["in_progress", "completed", "abandoned"],
      review_item_type: ["vocab", "phrase", "grammar", "chunk"],
      review_stage: ["d1", "d3", "d7", "d14", "d30", "mastered"],
      speaking_mode: [
        "short_answer",
        "open_conversation",
        "role_play",
        "fluency",
        "lesson_pair",
      ],
      user_role: ["student", "author", "reviewer", "admin"],
    },
  },
} as const

