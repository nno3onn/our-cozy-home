\ir seed/001_item_definitions.sql

begin;

insert into public.app_settings (key, value)
values
  ('house_capacity', '4'::jsonb),
  ('attendance_daily_reward', '100'::jsonb)
on conflict (key) do update
set value = excluded.value;

commit;
