create table public.room_slots (
  id text primary key,
  name_ko text not null,
  zone text not null check (zone in ('wall', 'floor', 'animal', 'shelf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.room_slots enable row level security;

create policy "room_slots_select_authenticated"
on public.room_slots
for select
to authenticated
using (true);

revoke insert, update, delete on public.room_slots from anon, authenticated;
