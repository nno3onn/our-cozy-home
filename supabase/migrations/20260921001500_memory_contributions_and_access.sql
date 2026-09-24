create table public.memory_contributions (
  id uuid primary key default extensions.gen_random_uuid(), memory_id uuid not null references public.memories(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete restrict, deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique(memory_id, author_profile_id)
);
create table public.memory_contribution_revisions (
  id uuid primary key default extensions.gen_random_uuid(), contribution_id uuid not null references public.memory_contributions(id) on delete cascade,
  body text not null, published_at timestamptz not null default timezone('utc', now()), deleted_at timestamptz
);
create index memory_contribution_revisions_access_idx on public.memory_contribution_revisions(contribution_id, published_at);
create table public.memory_photos (
  id uuid primary key default extensions.gen_random_uuid(), contribution_id uuid not null references public.memory_contributions(id) on delete cascade,
  storage_path text not null unique, created_at timestamptz not null default timezone('utc', now()), deleted_at timestamptz
);
create index memory_photos_access_idx on public.memory_photos(contribution_id, created_at);
alter table public.memory_contributions enable row level security;
alter table public.memory_contribution_revisions enable row level security;
alter table public.memory_photos enable row level security;
revoke all on public.memory_contributions, public.memory_contribution_revisions, public.memory_photos from anon, authenticated;

-- A shared draft's original author is its first contributor. Backfill is safe
-- for environments that created shared memories before this migration.
insert into public.memory_contributions(memory_id, author_profile_id)
select m.id, m.author_profile_id from public.memories m
where m.status in ('shared', 'completed')
on conflict (memory_id, author_profile_id) do nothing;
insert into public.memory_contribution_revisions(contribution_id, body, published_at)
select mc.id, m.body, coalesce(m.shared_at, m.created_at)
from public.memory_contributions mc join public.memories m on m.id=mc.memory_id
where m.status in ('shared', 'completed')
  and not exists (select 1 from public.memory_contribution_revisions r where r.contribution_id=mc.id);

create or replace function public.share_memory_draft(p_memory_id uuid)
returns table(memory_id uuid, house_id uuid, viewer_count integer, result text)
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); active_house uuid; existing public.memories%rowtype; viewers integer; was_draft boolean;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select hm.house_id into active_house from public.house_memberships hm where hm.profile_id=uid and hm.status='active';
  if active_house is null then raise exception 'not_in_house' using errcode = '42501'; end if;
  perform 1 from public.houses h where h.id=active_house and h.status='active' for update;
  if not found then raise exception 'not_in_house' using errcode = '42501'; end if;
  select * into existing from public.memories m where m.id=p_memory_id and m.author_profile_id=uid for update;
  if not found then raise exception 'memory_draft_not_found' using errcode = '42501'; end if;
  was_draft := existing.status = 'private_draft';
  if was_draft then
    update public.memories set house_id=active_house, status='shared', shared_at=timezone('utc',now()) where id=existing.id;
    insert into public.memory_viewers(memory_id, profile_id, membership_id)
    select existing.id, hm.profile_id, hm.id from public.house_memberships hm
    where hm.house_id=active_house and hm.status='active'
    on conflict (memory_id, profile_id) do nothing;
    insert into public.memory_contributions(memory_id,author_profile_id) values(existing.id,uid)
    on conflict(memory_id,author_profile_id) do nothing;
    insert into public.memory_contribution_revisions(contribution_id,body)
    select mc.id, existing.body from public.memory_contributions mc
    where mc.memory_id=existing.id and mc.author_profile_id=uid
      and not exists (select 1 from public.memory_contribution_revisions r where r.contribution_id=mc.id);
  elsif existing.house_id <> active_house then
    raise exception 'memory_house_mismatch' using errcode = '42501';
  end if;
  select count(*)::integer into viewers from public.memory_viewers where memory_id=existing.id;
  return query select existing.id, active_house, viewers, case when was_draft then 'shared' else 'already_shared' end;
end; $$;

create or replace function public.add_memory_contribution(p_memory_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); contribution_id uuid;
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 if not exists(select 1 from public.memory_viewers where memory_id=p_memory_id and profile_id=uid and can_contribute and access_ended_at is null) then raise exception 'memory_contribution_forbidden' using errcode='42501'; end if;
 if not exists(select 1 from public.memories where id=p_memory_id and status in ('shared','completed')) then raise exception 'memory_contribution_forbidden' using errcode='42501'; end if;
 insert into public.memory_contributions(memory_id,author_profile_id) values(p_memory_id,uid) on conflict(memory_id,author_profile_id) do update set updated_at=timezone('utc',now()) returning id into contribution_id;
 insert into public.memory_contribution_revisions(contribution_id,body,published_at) values(contribution_id,coalesce(p_body,''),clock_timestamp()); return contribution_id;
end; $$;

create or replace function public.revise_memory_contribution(p_contribution_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); memory_id uuid;
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 select mc.memory_id into memory_id from public.memory_contributions mc
 where mc.id=p_contribution_id and mc.author_profile_id=uid and mc.deleted_at is null for update;
 if not found then raise exception 'memory_contribution_not_found' using errcode='42501'; end if;
 if not exists(select 1 from public.memory_viewers where memory_id=memory_id and profile_id=uid and can_contribute and access_ended_at is null) then raise exception 'memory_contribution_forbidden' using errcode='42501'; end if;
 insert into public.memory_contribution_revisions(contribution_id,body,published_at) values(p_contribution_id,coalesce(p_body,''),clock_timestamp());
 update public.memory_contributions set updated_at=timezone('utc',now()) where id=p_contribution_id;
 return p_contribution_id;
end; $$;

create or replace function public.delete_memory_contribution(p_contribution_id uuid)
returns uuid language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); deleted_time timestamptz:=clock_timestamp();
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 update public.memory_contributions set deleted_at=deleted_time, updated_at=deleted_time
 where id=p_contribution_id and author_profile_id=uid and deleted_at is null;
 if not found then raise exception 'memory_contribution_not_found' using errcode='42501'; end if;
 update public.memory_contribution_revisions set deleted_at=deleted_time where contribution_id=p_contribution_id and deleted_at is null;
 update public.memory_photos set deleted_at=deleted_time where contribution_id=p_contribution_id and deleted_at is null;
 return p_contribution_id;
end; $$;

create or replace function public.list_memory_summaries(p_scope text)
returns table(id uuid,title text,occurred_on date,participant_names text[],contribution_count integer,furniture_owned_item_id uuid,preview text)
language sql security definer set search_path=public
as $$
  with accessible as (
    select m.*, mv.access_ended_at, mv.archive_retained
    from public.memories m join public.memory_viewers mv on mv.memory_id=m.id
    where mv.profile_id=auth.uid()
      and ((p_scope='current' and mv.access_ended_at is null) or (p_scope='archive' and mv.archive_retained and mv.access_ended_at is not null))
  )
  select a.id, a.title, a.occurred_on,
    coalesce(array_agg(distinct p.display_name) filter (where mc.id is not null and mc.deleted_at is null), '{}'::text[]) as participant_names,
    count(distinct mc.id) filter (where mc.deleted_at is null)::integer as contribution_count,
    null::uuid as furniture_owned_item_id,
    coalesce((select r.body from public.memory_contribution_revisions r join public.memory_contributions c on c.id=r.contribution_id
      where c.memory_id=a.id and c.deleted_at is null and r.deleted_at is null
        and (a.access_ended_at is null or r.published_at <= a.access_ended_at)
      order by r.published_at desc, r.id desc limit 1), '') as preview
  from accessible a
  left join public.memory_contributions mc on mc.memory_id=a.id
    and (a.access_ended_at is null or mc.created_at <= a.access_ended_at)
  left join public.profiles p on p.id=mc.author_profile_id
  group by a.id,a.title,a.occurred_on,a.access_ended_at
  order by a.occurred_on desc,a.id;
$$;

create or replace function public.get_memory_contribution_detail(p_memory_id uuid)
returns table(contribution_id uuid,author_profile_id uuid,display_name text,body text,published_at timestamptz)
language sql security definer set search_path=public
as $$
  select mc.id, mc.author_profile_id, p.display_name, r.body, r.published_at
  from public.memory_viewers mv
  join public.memory_contributions mc on mc.memory_id=mv.memory_id and mc.deleted_at is null
  join public.memory_contribution_revisions r on r.contribution_id=mc.id and r.deleted_at is null
  join public.profiles p on p.id=mc.author_profile_id
  where mv.memory_id=p_memory_id and mv.profile_id=auth.uid()
    and (mv.access_ended_at is null or (mv.archive_retained and r.published_at <= mv.access_ended_at))
  order by r.published_at asc,r.id asc;
$$;

create or replace function public.get_memory_photo_metadata(p_memory_id uuid)
returns table(photo_id uuid,contribution_id uuid,storage_path text,created_at timestamptz)
language sql security definer set search_path=public
as $$
  select mp.id, mp.contribution_id, mp.storage_path, mp.created_at
  from public.memory_viewers mv
  join public.memory_contributions mc on mc.memory_id=mv.memory_id and mc.deleted_at is null
  join public.memory_photos mp on mp.contribution_id=mc.id and mp.deleted_at is null
  where mv.memory_id=p_memory_id and mv.profile_id=auth.uid()
    and (mv.access_ended_at is null or (mv.archive_retained and mp.created_at <= mv.access_ended_at))
  order by mp.created_at asc,mp.id asc;
$$;

create or replace function public.archive_departing_memory_viewers() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if old.status='active' and new.status='left' then
   update public.memory_viewers mv set access_ended_at=new.left_at, archive_retained=exists(select 1 from public.memory_contributions mc where mc.memory_id=mv.memory_id and mc.author_profile_id=old.profile_id and mc.deleted_at is null)
   where mv.profile_id=old.profile_id and mv.membership_id=old.id and mv.access_ended_at is null;
end if; return new; end; $$;
create trigger archive_departing_memory_viewers after update of status on public.house_memberships for each row execute function public.archive_departing_memory_viewers();
revoke all on function public.add_memory_contribution(uuid,text), public.revise_memory_contribution(uuid,text), public.delete_memory_contribution(uuid), public.list_memory_summaries(text), public.get_memory_contribution_detail(uuid), public.get_memory_photo_metadata(uuid) from public;
grant execute on function public.add_memory_contribution(uuid,text), public.revise_memory_contribution(uuid,text), public.delete_memory_contribution(uuid), public.list_memory_summaries(text), public.get_memory_contribution_detail(uuid), public.get_memory_photo_metadata(uuid) to authenticated;
