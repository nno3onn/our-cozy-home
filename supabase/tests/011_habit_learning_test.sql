begin;
select plan(9);
select has_table('public','habit_learning');
select has_table('public','habit_learning_days');
select has_table('public','habit_learning_participants');
select has_table('public','learned_habits');
select has_function('public','start_habit_learning',array['uuid','uuid','text']);
select has_function('public','record_habit_activity',array['uuid']);
select has_function('public','end_departed_habit_learning');
select ok(exists (
  select 1 from pg_constraint constraint_metadata
  where constraint_metadata.conrelid = 'public.habit_learning_days'::regclass
    and constraint_metadata.contype = 'p'
    and constraint_metadata.conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.habit_learning_days'::regclass and attname = 'learning_id' and not attisdropped),
      (select attnum from pg_attribute where attrelid = 'public.habit_learning_days'::regclass and attname = 'game_date' and not attisdropped)
    ]
), 'one learning day is recorded for each learning and game date');
select ok(exists (
  select 1 from pg_constraint constraint_metadata
  where constraint_metadata.conrelid = 'public.learned_habits'::regclass
    and constraint_metadata.contype = 'p'
    and constraint_metadata.conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.learned_habits'::regclass and attname = 'animal_id' and not attisdropped),
      (select attnum from pg_attribute where attrelid = 'public.learned_habits'::regclass and attname = 'habit_id' and not attisdropped)
    ]
), 'an animal can learn each habit once');
select * from finish();
rollback;
