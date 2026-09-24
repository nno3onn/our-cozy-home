alter table public.memories add column generated_item_id text references public.item_definitions(id) on delete restrict;
alter table public.owned_items add column memory_id uuid references public.memories(id) on delete restrict;
create unique index owned_memory_furniture_once on public.owned_items(memory_id) where memory_id is not null;

create table public.memory_completion_events (
  memory_id uuid primary key references public.memories(id) on delete cascade,
  owned_item_id uuid not null unique references public.owned_items(id) on delete restrict,
  completed_at timestamptz not null default clock_timestamp()
);
alter table public.memory_completion_events enable row level security;
revoke all on public.memory_completion_events from anon, authenticated;

drop policy if exists "owned_items_select_owner" on public.owned_items;
create policy "owned_items_select_owner_or_authorized_memory_viewer" on public.owned_items for select to authenticated using (
  profile_id = auth.uid() or (kind = 'memory' and exists (
    select 1 from public.memory_viewers mv where mv.memory_id=owned_items.memory_id and mv.profile_id=auth.uid() and mv.access_ended_at is null
  ))
);

create or replace function public.complete_memory_if_ready(p_memory_id uuid)
returns uuid language plpgsql security definer set search_path=public
as $$
declare memory_row public.memories%rowtype; contributor_count integer; definition_id text; item_id uuid;
begin
 select * into memory_row from public.memories where id=p_memory_id for update;
 if not found or memory_row.status not in ('shared','completed') then return null; end if;
 select count(*) into contributor_count from public.memory_contributions
 where memory_id=p_memory_id and deleted_at is null;
 if contributor_count < 2 then return null; end if;
 if memory_row.status = 'completed' then
   select owned_item_id into item_id from public.memory_completion_events where memory_id=p_memory_id;
   return item_id;
 end if;
 select id into definition_id from public.item_definitions
 where source='memory' and active
 order by id offset (abs(hashtextextended(p_memory_id::text, 0)) % 15) limit 1;
 if definition_id is null then raise exception 'memory_furniture_definition_missing' using errcode='P0001'; end if;
 insert into public.owned_items(profile_id,item_definition_id,kind,memory_id)
 values(memory_row.author_profile_id,definition_id,'memory',p_memory_id)
 on conflict (memory_id) where memory_id is not null do update set memory_id=excluded.memory_id
 returning id into item_id;
 insert into public.memory_completion_events(memory_id,owned_item_id) values(p_memory_id,item_id)
 on conflict (memory_id) do nothing;
 update public.memories set status='completed',generated_item_id=definition_id,updated_at=clock_timestamp() where id=p_memory_id;
 return item_id;
end; $$;

create or replace function public.add_memory_contribution(p_memory_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); contribution_id uuid;
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 if not exists(select 1 from public.memory_viewers where memory_id=p_memory_id and profile_id=uid and can_contribute and access_ended_at is null) then raise exception 'memory_contribution_forbidden' using errcode='42501'; end if;
 if not exists(select 1 from public.memories where id=p_memory_id and status in ('shared','completed')) then raise exception 'memory_contribution_forbidden' using errcode='42501'; end if;
 insert into public.memory_contributions(memory_id,author_profile_id) values(p_memory_id,uid) on conflict(memory_id,author_profile_id) do update set updated_at=clock_timestamp() returning id into contribution_id;
 insert into public.memory_contribution_revisions(contribution_id,body,published_at) values(contribution_id,coalesce(p_body,''),clock_timestamp());
 perform public.complete_memory_if_ready(p_memory_id);
 return contribution_id;
end; $$;

drop policy if exists "room_placements_select_member" on public.room_placements;
create policy "room_placements_select_authorized_member" on public.room_placements for select to authenticated using (
 public.is_active_house_member(house_id) and not exists (
   select 1 from public.owned_items oi where oi.id=room_placements.owned_item_id and oi.memory_id is not null
     and not exists (select 1 from public.memory_viewers mv where mv.memory_id=oi.memory_id and mv.profile_id=auth.uid() and mv.access_ended_at is null)
 )
);

revoke all on function public.complete_memory_if_ready(uuid) from public;
grant execute on function public.complete_memory_if_ready(uuid) to authenticated;
