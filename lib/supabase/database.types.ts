/**
 * Hand-authored to match supabase/migrations exactly, in the shape
 * `supabase gen types typescript` produces (so `createClient<Database>()`
 * typing works identically either way).
 *
 * This sandbox has no Docker daemon, so the local Supabase CLI stack
 * (`supabase gen types typescript --local`) cannot run here — see
 * ARCHITECTURE.md / tests/integration/setup/auth-stub.sql for why. Once a
 * real Supabase project exists, regenerate this file from it instead of
 * hand-editing:
 *
 *   supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
 *
 * and keep it in sync with supabase/migrations from then on.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type WavelengthState = "DRAFT" | "WAITING" | "IN_PROGRESS" | "COMPLETED";

export type WavelengthCategory =
  | "relationship"
  | "lifestyle"
  | "money"
  | "adventures_travel"
  | "future"
  | "values_priorities";

export type QuestionType = "choice" | "scale";

export type ParticipantRole = "A" | "B";

export interface Database {
  public: {
    Tables: {
      wavelengths: {
        Row: {
          id: string;
          share_token: string;
          state: WavelengthState;
          participant_a_id: string;
          participant_b_id: string | null;
          participant_a_alias: string | null;
          participant_b_alias: string | null;
          created_at: string;
          waiting_at: string | null;
          in_progress_at: string | null;
          completed_at: string | null;
        };
        // A only ever creates its own DRAFT row directly (an INSERT, not a
        // state transition). Every later mutation goes through the three
        // RPCs in Functions below — there is no client-facing Update type.
        // No question count or category is declared upfront (progressive
        // creation, resolved decision) — this insert is just the row's owner.
        Insert: {
          id?: string;
          share_token?: string;
          state?: "DRAFT";
          participant_a_id: string;
          participant_b_id?: null;
          participant_a_alias?: null;
          participant_b_alias?: null;
          created_at?: string;
          waiting_at?: null;
          in_progress_at?: null;
          completed_at?: null;
        };
        Update: never;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          wavelength_id: string;
          category: WavelengthCategory;
          type: QuestionType;
          text: string;
          options: string[] | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wavelength_id: string;
          category: WavelengthCategory;
          type: QuestionType;
          text: string;
          options?: string[] | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          category: WavelengthCategory;
          type: QuestionType;
          text: string;
          options: string[] | null;
          order_index: number;
        }>;
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          wavelength_id: string;
          question_id: string;
          participant: ParticipantRole;
          value: number;
          answered_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wavelength_id: string;
          question_id: string;
          participant: ParticipantRole;
          value: number;
          answered_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          value: number;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_wavelength_preview: {
        Args: { p_token: string };
        Returns: {
          state: WavelengthState;
          participant_a_alias: string | null;
          is_taken: boolean;
        }[];
      };
      finalize_draft: {
        Args: { p_id: string; p_alias: string };
        Returns: void;
      };
      claim_participant_b: {
        Args: { p_token: string; p_alias: string };
        Returns: string;
      };
      submit_final_b: {
        Args: { p_id: string };
        Returns: void;
      };
      reorder_questions: {
        Args: { p_wavelength_id: string; p_question_ids: string[] };
        Returns: void;
      };
    };
    Enums: {
      wavelength_state: WavelengthState;
      wavelength_category: WavelengthCategory;
      question_type: QuestionType;
      participant_role: ParticipantRole;
    };
  };
}
