/**
 * Supabase CLI output boundary.
 *
 * Replace this file with:
 * `supabase gen types typescript --local > src/types/database.generated.ts`
 * after the first migration is available. Screens must consume domain types instead.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
