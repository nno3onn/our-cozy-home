-- Additive enum migration: existing companion choices and rows are unchanged.
alter type public.animal_species add value if not exists 'dog';
