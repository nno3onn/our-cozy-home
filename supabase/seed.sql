-- Domain seed data starts in the next migration Issue.
-- Keeping this transaction intentionally empty makes `supabase db reset`
-- repeatable before domain tables exist.
begin;
commit;
