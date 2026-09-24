do $$ begin
  create type public.memory_status as enum ('private_draft', 'shared', 'completed');
exception when duplicate_object then null;
end $$;

create table public.memories (
  id uuid primary key default extensions.gen_random_uuid(),
  house_id uuid references public.houses(id) on delete restrict,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  body text not null default '',
  occurred_on date not null,
  status public.memory_status not null default 'private_draft',
  shared_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status = 'private_draft' and house_id is null and shared_at is null) or (status in ('shared', 'completed') and house_id is not null and shared_at is not null))
);

create table public.memory_viewers (
  memory_id uuid not null references public.memories(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  membership_id uuid not null references public.house_memberships(id) on delete restrict,
  can_contribute boolean not null default true,
  granted_at timestamptz not null default timezone('utc', now()),
  access_ended_at timestamptz,
  archive_retained boolean not null default false,
  primary key (memory_id, profile_id)
);
create index memory_viewers_profile_idx on public.memory_viewers(profile_id, memory_id);
create index memories_house_shared_idx on public.memories(house_id, shared_at desc) where status in ('shared', 'completed');

alter table public.memories enable row level security;
alter table public.memory_viewers enable row level security;

create policy "memories_select_author_or_active_viewer" on public.memories for select to authenticated using (
  author_profile_id = auth.uid() or exists (
    select 1 from public.memory_viewers mv
    where mv.memory_id = memories.id and mv.profile_id = auth.uid() and mv.access_ended_at is null
  )
);
create policy "memory_viewers_select_own" on public.memory_viewers for select to authenticated using (profile_id = auth.uid());
revoke insert, update, delete on public.memories, public.memory_viewers from anon, authenticated;

create or replace function public.create_memory_draft(p_title text, p_body text, p_occurred_on date)
returns uuid language plpgsql security definer set search_path = public
as $$ declare uid uuid := auth.uid(); memory_id uuid;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if btrim(coalesce(p_title, '')) = '' then raise exception 'memory_title_required' using errcode = 'P0001'; end if;
  insert into public.memories(author_profile_id, title, body, occurred_on)
  values (uid, btrim(p_title), coalesce(p_body, ''), p_occurred_on)
  returning id into memory_id;
  return memory_id;
end; $$;

create or replace function public.update_memory_draft(p_memory_id uuid, p_title text, p_body text, p_occurred_on date)
returns uuid language plpgsql security definer set search_path = public
as $$ declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if btrim(coalesce(p_title, '')) = '' then raise exception 'memory_title_required' using errcode = 'P0001'; end if;
  update public.memories set title=btrim(p_title), body=coalesce(p_body,''), occurred_on=p_occurred_on
  where id=p_memory_id and author_profile_id=uid and status='private_draft';
  if not found then raise exception 'memory_draft_not_found' using errcode = '42501'; end if;
  return p_memory_id;
end; $$;

create or replace function public.share_memory_draft(p_memory_id uuid)
returns table(memory_id uuid, house_id uuid, viewer_count integer, result text)
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); active_house uuid; existing public.memories%rowtype; viewers integer;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select hm.house_id into active_house from public.house_memberships hm where hm.profile_id=uid and hm.status='active';
  if active_house is null then raise exception 'not_in_house' using errcode = '42501'; end if;
  perform 1 from public.houses h where h.id=active_house and h.status='active' for update;
  if not found then raise exception 'not_in_house' using errcode = '42501'; end if;
  select * into existing from public.memories m where m.id=p_memory_id and m.author_profile_id=uid for update;
  if not found then raise exception 'memory_draft_not_found' using errcode = '42501'; end if;
  if existing.status = 'private_draft' then
    update public.memories set house_id=active_house, status='shared', shared_at=timezone('utc',now()) where id=existing.id;
    insert into public.memory_viewers(memory_id, profile_id, membership_id)
    select existing.id, hm.profile_id, hm.id from public.house_memberships hm
    where hm.house_id=active_house and hm.status='active'
    on conflict (memory_id, profile_id) do nothing;
  elsif existing.house_id <> active_house then
    raise exception 'memory_house_mismatch' using errcode = '42501';
  end if;
  select count(*)::integer into viewers from public.memory_viewers where memory_id=existing.id;
  return query select existing.id, active_house, viewers, case when existing.status = 'private_draft' then 'shared' else 'already_shared' end;
end; $$;

revoke all on function public.create_memory_draft(text,text,date), public.update_memory_draft(uuid,text,text,date), public.share_memory_draft(uuid) from public;
grant execute on function public.create_memory_draft(text,text,date), public.update_memory_draft(uuid,text,text,date), public.share_memory_draft(uuid) to authenticated;
