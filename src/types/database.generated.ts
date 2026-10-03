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
      account_deletion_requests: {
        Row: {
          completed_at: string | null
          prepared_at: string
          profile_id: string
          request_key: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          prepared_at?: string
          profile_id: string
          request_key: string
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          prepared_at?: string
          profile_id?: string
          request_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          profile_id: string
          species: Database["public"]["Enums"]["animal_species"]
          state: Database["public"]["Enums"]["animal_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          profile_id: string
          species: Database["public"]["Enums"]["animal_species"]
          state?: Database["public"]["Enums"]["animal_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          profile_id?: string
          species?: Database["public"]["Enums"]["animal_species"]
          state?: Database["public"]["Enums"]["animal_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      attendance_rewards: {
        Row: {
          game_date: string
          profile_id: string
          transaction_id: string
        }
        Insert: {
          game_date: string
          profile_id: string
          transaction_id: string
        }
        Update: {
          game_date?: string
          profile_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_rewards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_rewards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          profile_id: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          profile_id: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          profile_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_wallets: {
        Row: {
          balance: number
          profile_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          profile_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_definitions: {
        Row: {
          active: boolean
          id: string
          name_ko: string
        }
        Insert: {
          active?: boolean
          id: string
          name_ko: string
        }
        Update: {
          active?: boolean
          id?: string
          name_ko?: string
        }
        Relationships: []
      }
      habit_learning: {
        Row: {
          ended_at: string | null
          habit_id: string
          id: string
          learner_animal_id: string
          started_at: string
          status: string
          teacher_animal_id: string
        }
        Insert: {
          ended_at?: string | null
          habit_id: string
          id?: string
          learner_animal_id: string
          started_at?: string
          status?: string
          teacher_animal_id: string
        }
        Update: {
          ended_at?: string | null
          habit_id?: string
          id?: string
          learner_animal_id?: string
          started_at?: string
          status?: string
          teacher_animal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_learning_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_learning_learner_animal_id_fkey"
            columns: ["learner_animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_learning_teacher_animal_id_fkey"
            columns: ["teacher_animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_learning_days: {
        Row: {
          game_date: string
          learning_id: string
        }
        Insert: {
          game_date: string
          learning_id: string
        }
        Update: {
          game_date?: string
          learning_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_learning_days_learning_id_fkey"
            columns: ["learning_id"]
            isOneToOne: false
            referencedRelation: "habit_learning"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_learning_participants: {
        Row: {
          game_date: string
          learning_id: string
          profile_id: string
        }
        Insert: {
          game_date: string
          learning_id: string
          profile_id: string
        }
        Update: {
          game_date?: string
          learning_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_learning_participants_learning_id_fkey"
            columns: ["learning_id"]
            isOneToOne: false
            referencedRelation: "habit_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_learning_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      house_create_requests: {
        Row: {
          created_at: string
          house_id: string
          id: string
          membership_id: string
          profile_id: string
          request_key: string
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          membership_id: string
          profile_id: string
          request_key: string
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          membership_id?: string
          profile_id?: string
          request_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_create_requests_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_create_requests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "house_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_create_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      house_invites: {
        Row: {
          created_at: string
          created_by_profile_id: string
          ended_at: string | null
          expires_at: string
          house_id: string
          id: string
          invite_code: string
          status: Database["public"]["Enums"]["house_invite_status"]
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by_profile_id: string
          ended_at?: string | null
          expires_at: string
          house_id: string
          id?: string
          invite_code: string
          status?: Database["public"]["Enums"]["house_invite_status"]
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string
          ended_at?: string | null
          expires_at?: string
          house_id?: string
          id?: string
          invite_code?: string
          status?: Database["public"]["Enums"]["house_invite_status"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_invites_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_invites_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      house_memberships: {
        Row: {
          created_at: string
          house_id: string
          id: string
          joined_at: string
          left_at: string | null
          profile_id: string
          role: Database["public"]["Enums"]["house_member_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          profile_id: string
          role?: Database["public"]["Enums"]["house_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          profile_id?: string
          role?: Database["public"]["Enums"]["house_member_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_memberships_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          admin_profile_id: string | null
          archived_at: string | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["house_status"]
          updated_at: string
        }
        Insert: {
          admin_profile_id?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["house_status"]
          updated_at?: string
        }
        Update: {
          admin_profile_id?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["house_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "houses_admin_profile_id_fkey"
            columns: ["admin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_acceptance_requests: {
        Row: {
          created_at: string
          house_id: string
          id: string
          invite_id: string
          membership_id: string
          profile_id: string
          request_key: string
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          invite_id: string
          membership_id: string
          profile_id: string
          request_key: string
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          invite_id?: string
          membership_id?: string
          profile_id?: string
          request_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_acceptance_requests_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_acceptance_requests_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "house_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_acceptance_requests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "house_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_acceptance_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_acceptances: {
        Row: {
          accepted_at: string
          id: string
          invite_id: string
          membership_id: string
          profile_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          invite_id: string
          membership_id: string
          profile_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          invite_id?: string
          membership_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_acceptances_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "house_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_acceptances_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "house_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_acceptances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_definitions: {
        Row: {
          active: boolean
          allowed_slot_ids: Json
          anchor: Json
          asset_status: string
          category: string
          consumable: boolean
          id: string
          interaction: string
          layer_bias: number
          name_ko: string
          preview_color: string
          price: number
          room_asset_key: string
          silhouette: string
          size: Json
          source: string
          theme: string
          thumbnail_key: string
        }
        Insert: {
          active?: boolean
          allowed_slot_ids: Json
          anchor: Json
          asset_status: string
          category: string
          consumable: boolean
          id: string
          interaction: string
          layer_bias: number
          name_ko: string
          preview_color: string
          price: number
          room_asset_key: string
          silhouette: string
          size: Json
          source: string
          theme: string
          thumbnail_key: string
        }
        Update: {
          active?: boolean
          allowed_slot_ids?: Json
          anchor?: Json
          asset_status?: string
          category?: string
          consumable?: boolean
          id?: string
          interaction?: string
          layer_bias?: number
          name_ko?: string
          preview_color?: string
          price?: number
          room_asset_key?: string
          silhouette?: string
          size?: Json
          source?: string
          theme?: string
          thumbnail_key?: string
        }
        Relationships: []
      }
      learned_habits: {
        Row: {
          animal_id: string
          habit_id: string
          learned_at: string
          teacher_animal_id: string
        }
        Insert: {
          animal_id: string
          habit_id: string
          learned_at?: string
          teacher_animal_id: string
        }
        Update: {
          animal_id?: string
          habit_id?: string
          learned_at?: string
          teacher_animal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learned_habits_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learned_habits_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learned_habits_teacher_animal_id_fkey"
            columns: ["teacher_animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          author_profile_id: string
          body: string
          created_at: string
          generated_item_id: string | null
          house_id: string | null
          id: string
          occurred_on: string
          shared_at: string | null
          status: Database["public"]["Enums"]["memory_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          body?: string
          created_at?: string
          generated_item_id?: string | null
          house_id?: string | null
          id?: string
          occurred_on: string
          shared_at?: string | null
          status?: Database["public"]["Enums"]["memory_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          body?: string
          created_at?: string
          generated_item_id?: string | null
          house_id?: string | null
          id?: string
          occurred_on?: string
          shared_at?: string | null
          status?: Database["public"]["Enums"]["memory_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_generated_item_id_fkey"
            columns: ["generated_item_id"]
            isOneToOne: false
            referencedRelation: "item_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_completion_events: {
        Row: {
          completed_at: string
          memory_id: string
          owned_item_id: string
        }
        Insert: {
          completed_at?: string
          memory_id: string
          owned_item_id: string
        }
        Update: {
          completed_at?: string
          memory_id?: string
          owned_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_completion_events_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: true
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_completion_events_owned_item_id_fkey"
            columns: ["owned_item_id"]
            isOneToOne: true
            referencedRelation: "owned_items"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_contribution_revisions: {
        Row: {
          body: string
          contribution_id: string
          deleted_at: string | null
          id: string
          published_at: string
        }
        Insert: {
          body: string
          contribution_id: string
          deleted_at?: string | null
          id?: string
          published_at?: string
        }
        Update: {
          body?: string
          contribution_id?: string
          deleted_at?: string | null
          id?: string
          published_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_contribution_revisions_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "memory_contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_contributions: {
        Row: {
          author_profile_id: string
          created_at: string
          deleted_at: string | null
          id: string
          memory_id: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          memory_id: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          memory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_contributions_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_contributions_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_photos: {
        Row: {
          contribution_id: string
          created_at: string
          deleted_at: string | null
          id: string
          mime_type: string | null
          status: string
          storage_path: string
          upload_request_key: string | null
        }
        Insert: {
          contribution_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string | null
          status?: string
          storage_path: string
          upload_request_key?: string | null
        }
        Update: {
          contribution_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string | null
          status?: string
          storage_path?: string
          upload_request_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_photos_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "memory_contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_viewers: {
        Row: {
          access_ended_at: string | null
          archive_retained: boolean
          can_contribute: boolean
          granted_at: string
          membership_id: string
          memory_id: string
          profile_id: string
        }
        Insert: {
          access_ended_at?: string | null
          archive_retained?: boolean
          can_contribute?: boolean
          granted_at?: string
          membership_id: string
          memory_id: string
          profile_id: string
        }
        Update: {
          access_ended_at?: string | null
          archive_retained?: boolean
          can_contribute?: boolean
          granted_at?: string
          membership_id?: string
          memory_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_viewers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "house_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_viewers_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_viewers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          created_at: string
          event_id: string
          id: string
          recipient_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          recipient_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          recipient_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_targets: {
        Row: {
          attempt_count: number
          created_at: string
          delivery_id: string
          expo_ticket_id: string | null
          id: string
          last_error: string | null
          lease_expires_at: string | null
          next_attempt_at: string
          push_token_id: string
          receipt_check_after: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivery_id: string
          expo_ticket_id?: string | null
          id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          next_attempt_at?: string
          push_token_id: string
          receipt_check_after?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivery_id?: string
          expo_ticket_id?: string | null
          id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          next_attempt_at?: string
          push_token_id?: string
          receipt_check_after?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_targets_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "notification_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_targets_push_token_id_fkey"
            columns: ["push_token_id"]
            isOneToOne: false
            referencedRelation: "push_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          event_key: string
          event_type: string
          habit_learning_id: string | null
          house_id: string
          id: string
          memory_id: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          event_key: string
          event_type: string
          habit_learning_id?: string | null
          house_id: string
          id?: string
          memory_id?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          event_key?: string
          event_type?: string
          habit_learning_id?: string | null
          house_id?: string
          id?: string
          memory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_habit_learning_id_fkey"
            columns: ["habit_learning_id"]
            isOneToOne: false
            referencedRelation: "habit_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          profile_id: string
          push_enabled: boolean
          updated_at: string
        }
        Insert: {
          profile_id: string
          push_enabled?: boolean
          updated_at?: string
        }
        Update: {
          profile_id?: string
          push_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owned_items: {
        Row: {
          created_at: string
          id: string
          item_definition_id: string
          kind: string
          memory_id: string | null
          profile_id: string
          quantity: number
          recovered_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_definition_id: string
          kind: string
          memory_id?: string | null
          profile_id: string
          quantity?: number
          recovered_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_definition_id?: string
          kind?: string
          memory_id?: string | null
          profile_id?: string
          quantity?: number
          recovered_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owned_items_item_definition_id_fkey"
            columns: ["item_definition_id"]
            isOneToOne: false
            referencedRelation: "item_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owned_items_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owned_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          point_color: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          point_color: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          point_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          balance: number
          created_at: string
          item_definition_id: string
          owned_item_id: string
          profile_id: string
          quantity: number
          request_key: string
          transaction_id: string
        }
        Insert: {
          balance: number
          created_at?: string
          item_definition_id: string
          owned_item_id: string
          profile_id: string
          quantity: number
          request_key: string
          transaction_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          item_definition_id?: string
          owned_item_id?: string
          profile_id?: string
          quantity?: number
          request_key?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_item_definition_id_fkey"
            columns: ["item_definition_id"]
            isOneToOne: false
            referencedRelation: "item_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_owned_item_id_fkey"
            columns: ["owned_item_id"]
            isOneToOne: false
            referencedRelation: "owned_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "coin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          active: boolean
          id: string
          platform: string
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          id?: string
          platform: string
          profile_id: string
          token: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          id?: string
          platform?: string
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_placements: {
        Row: {
          created_at: string
          house_id: string
          id: string
          owned_item_id: string
          slot_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          owned_item_id: string
          slot_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          owned_item_id?: string
          slot_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_placements_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_placements_owned_item_id_fkey"
            columns: ["owned_item_id"]
            isOneToOne: true
            referencedRelation: "owned_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_placements_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "room_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      room_slots: {
        Row: {
          created_at: string
          id: string
          name_ko: string
          updated_at: string
          zone: string
        }
        Insert: {
          created_at?: string
          id: string
          name_ko: string
          updated_at?: string
          zone: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ko?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_house_invite: {
        Args: { p_request_key: string; p_token: string }
        Returns: {
          house_id: string
          house_name: string
          membership_id: string
          result: string
        }[]
      }
      add_memory_contribution: {
        Args: { p_body: string; p_memory_id: string }
        Returns: string
      }
      assert_active_profile: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      cancel_house_invite: { Args: never; Returns: undefined }
      claim_attendance_reward: {
        Args: never
        Returns: {
          balance: number
          game_date: string
          granted: boolean
        }[]
      }
      claim_notification_delivery_targets: {
        Args: { p_lease_seconds?: number; p_limit?: number }
        Returns: {
          delivery_id: string
          event_id: string
          event_type: string
          expo_token: string
          habit_learning_id: string
          house_id: string
          memory_id: string
          target_id: string
        }[]
      }
      claim_notification_receipts: {
        Args: { p_lease_seconds?: number; p_limit?: number }
        Returns: {
          expo_ticket_id: string
          target_id: string
        }[]
      }
      complete_memory_if_ready: {
        Args: { p_memory_id: string }
        Returns: string
      }
      complete_memory_photo_upload: {
        Args: { p_photo_id: string }
        Returns: string
      }
      complete_onboarding: {
        Args: {
          p_animal_name: string
          p_display_name: string
          p_point_color: string
          p_species: Database["public"]["Enums"]["animal_species"]
        }
        Returns: {
          animal_id: string
          profile_id: string
        }[]
      }
      create_house: {
        Args: { p_name: string; p_request_key: string }
        Returns: {
          house_id: string
          membership_id: string
        }[]
      }
      create_house_invite: {
        Args: { p_reissue?: boolean }
        Returns: {
          expires_at: string
          invite_code: string
          invite_token: string
        }[]
      }
      create_memory_draft: {
        Args: { p_body: string; p_occurred_on: string; p_title: string }
        Returns: string
      }
      deactivate_my_push_tokens: { Args: never; Returns: undefined }
      delete_memory_contribution: {
        Args: { p_contribution_id: string }
        Returns: string
      }
      delete_memory_photo: { Args: { p_photo_id: string }; Returns: string }
      enqueue_notification_event: {
        Args: {
          p_actor_profile_id?: string
          p_event_key: string
          p_event_type: string
          p_habit_learning_id?: string
          p_house_id: string
          p_memory_id?: string
        }
        Returns: string
      }
      get_account_deletion_status: {
        Args: never
        Returns: {
          status: string
        }[]
      }
      get_memory_contribution_detail: {
        Args: { p_memory_id: string }
        Returns: {
          author_profile_id: string
          body: string
          contribution_id: string
          display_name: string
          published_at: string
        }[]
      }
      get_memory_photo_metadata: {
        Args: { p_memory_id: string }
        Returns: {
          contribution_id: string
          created_at: string
          photo_id: string
          storage_path: string
        }[]
      }
      get_own_memory_contribution: {
        Args: { p_memory_id: string }
        Returns: string
      }
      get_purchase_result: {
        Args: { p_request_key: string }
        Returns: {
          balance: number
          item_definition_id: string
          owned_item_id: string
          quantity: number
          result: string
        }[]
      }
      is_active_house_admin: { Args: { p_house_id: string }; Returns: boolean }
      is_active_house_member: { Args: { p_house_id: string }; Returns: boolean }
      is_active_house_placed_item: {
        Args: { p_owned_item_id: string }
        Returns: boolean
      }
      leave_house: {
        Args: never
        Returns: {
          house_archived: boolean
          house_id: string
          result: string
          successor_profile_id: string
        }[]
      }
      list_memory_summaries: {
        Args: { p_scope: string }
        Returns: {
          contribution_count: number
          furniture_owned_item_id: string
          id: string
          occurred_on: string
          participant_names: string[]
          preview: string
          title: string
        }[]
      }
      mark_account_deletion_completed: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      notification_recipient_is_eligible: {
        Args: { p_event_id: string; p_profile_id: string }
        Returns: boolean
      }
      perform_animal_action: {
        Args: {
          p_action: Database["public"]["Enums"]["animal_state"]
          p_animal_id: string
        }
        Returns: {
          created_at: string
          deleted_at: string
          id: string
          name: string
          profile_id: string
          species: Database["public"]["Enums"]["animal_species"]
          state: Database["public"]["Enums"]["animal_state"]
          updated_at: string
        }[]
      }
      place_owned_item: {
        Args: {
          p_expected_version: number
          p_owned_item_id: string
          p_slot_id: string
        }
        Returns: {
          owned_item_id: string
          placement_id: string
          slot_id: string
          version: number
        }[]
      }
      prepare_memory_photo_upload: {
        Args: {
          p_contribution_id: string
          p_mime_type: string
          p_request_key: string
        }
        Returns: {
          photo_id: string
          storage_path: string
        }[]
      }
      preview_house_invite: {
        Args: { p_token: string }
        Returns: {
          current_member_count: number
          house_name: string
          inviter_name: string
          state: string
        }[]
      }
      purchase_item: {
        Args: { p_item_definition_id: string; p_request_key: string }
        Returns: {
          balance: number
          item_definition_id: string
          owned_item_id: string
          quantity: number
          result: string
        }[]
      }
      record_habit_activity: {
        Args: { p_learning_id: string }
        Returns: {
          days: number
          status: string
        }[]
      }
      record_notification_receipt_result: {
        Args: { p_error?: string; p_result: string; p_target_id: string }
        Returns: undefined
      }
      record_notification_ticket_result: {
        Args: {
          p_error?: string
          p_result: string
          p_target_id: string
          p_ticket_id?: string
        }
        Returns: undefined
      }
      refresh_notification_delivery_status: {
        Args: { p_delivery_id: string }
        Returns: undefined
      }
      request_account_deletion: {
        Args: { p_request_key: string }
        Returns: {
          profile_id: string
          status: string
        }[]
      }
      revise_memory_contribution: {
        Args: { p_body: string; p_contribution_id: string }
        Returns: string
      }
      set_my_push_enabled: {
        Args: { p_push_enabled: boolean }
        Returns: undefined
      }
      share_memory_draft: {
        Args: { p_memory_id: string }
        Returns: {
          house_id: string
          memory_id: string
          result: string
          viewer_count: number
        }[]
      }
      start_habit_learning: {
        Args: { p_habit_id: string; p_learner: string; p_teacher: string }
        Returns: string
      }
      update_memory_draft: {
        Args: {
          p_body: string
          p_memory_id: string
          p_occurred_on: string
          p_title: string
        }
        Returns: string
      }
      upsert_push_token: {
        Args: { p_platform: string; p_token: string }
        Returns: string
      }
    }
    Enums: {
      animal_species: "rabbit" | "bear" | "cat" | "dog"
      animal_state: "idle" | "eating" | "resting" | "playing" | "reacting"
      house_invite_status:
        | "active"
        | "cancelled"
        | "expired"
        | "full"
        | "reissued"
      house_member_role: "admin" | "member"
      house_status: "active" | "archived"
      membership_status: "active" | "left"
      memory_status: "private_draft" | "shared" | "completed"
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
      animal_species: ["rabbit", "bear", "cat", "dog"],
      animal_state: ["idle", "eating", "resting", "playing", "reacting"],
      house_invite_status: [
        "active",
        "cancelled",
        "expired",
        "full",
        "reissued",
      ],
      house_member_role: ["admin", "member"],
      house_status: ["active", "archived"],
      membership_status: ["active", "left"],
      memory_status: ["private_draft", "shared", "completed"],
    },
  },
} as const
