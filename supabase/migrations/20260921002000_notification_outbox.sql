-- Notification events are produced in the same transaction as their domain
-- event. Only the server-side worker can claim or mutate deliveries.

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  updated_at timestamptz not null default clock_timestamp()
);

create table public.notification_events (
  id uuid primary key default extensions.gen_random_uuid(),
  event_key text not null unique,
  event_type text not null check (event_type in ('house_joined', 'memory_completed', 'habit_learned')),
  house_id uuid not null references public.houses(id) on delete restrict,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  memory_id uuid references public.memories(id) on delete cascade,
  habit_learning_id uuid references public.habit_learning(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  constraint notification_event_resource_matches_type check (
    (event_type = 'house_joined' and memory_id is null and habit_learning_id is null)
    or (event_type = 'memory_completed' and memory_id is not null and habit_learning_id is null)
    or (event_type = 'habit_learned' and memory_id is null and habit_learning_id is not null)
  )
);

create table public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'awaiting_receipt', 'sent', 'failed', 'skipped')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint notification_delivery_once_per_recipient unique (event_id, recipient_profile_id)
);

create table public.notification_delivery_targets (
  id uuid primary key default extensions.gen_random_uuid(),
  delivery_id uuid not null references public.notification_deliveries(id) on delete cascade,
  push_token_id uuid not null references public.push_tokens(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'leased', 'awaiting_receipt', 'receipt_leased', 'sent', 'retry', 'failed', 'skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default clock_timestamp(),
  lease_expires_at timestamptz,
  expo_ticket_id text,
  receipt_check_after timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint notification_target_once_per_token unique (delivery_id, push_token_id)
);

create index notification_deliveries_status_idx on public.notification_deliveries(status, created_at);
create index notification_targets_pending_idx on public.notification_delivery_targets(status, next_attempt_at);
create index notification_targets_receipts_idx on public.notification_delivery_targets(status, receipt_check_after)
  where status = 'awaiting_receipt';

alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_delivery_targets enable row level security;
revoke all on public.notification_preferences, public.notification_events, public.notification_deliveries, public.notification_delivery_targets from anon, authenticated;

create or replace function public.notification_recipient_is_eligible(p_event_id uuid, p_profile_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1
    from public.notification_events e
    left join public.notification_preferences np on np.profile_id = p_profile_id
    where e.id = p_event_id
      and coalesce(np.push_enabled, true)
      and exists (
        select 1 from public.house_memberships hm
        where hm.house_id = e.house_id and hm.profile_id = p_profile_id and hm.status = 'active'
      )
      and (
        (e.event_type = 'house_joined')
        or (e.event_type = 'memory_completed' and exists (
          select 1 from public.memory_viewers mv
          where mv.memory_id = e.memory_id and mv.profile_id = p_profile_id and mv.access_ended_at is null
        ))
        or (e.event_type = 'habit_learned' and exists (
          select 1
          from public.habit_learning hl
          join public.animals learner on learner.id = hl.learner_animal_id
          join public.animals teacher on teacher.id = hl.teacher_animal_id
          where hl.id = e.habit_learning_id
            and p_profile_id in (learner.profile_id, teacher.profile_id)
        ))
      )
  );
$$;

create or replace function public.set_my_push_enabled(p_push_enabled boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  insert into public.notification_preferences(profile_id,push_enabled,updated_at)
  values(auth.uid(),p_push_enabled,clock_timestamp())
  on conflict(profile_id) do update set push_enabled=excluded.push_enabled,updated_at=excluded.updated_at;
end;
$$;

create or replace function public.enqueue_notification_event(
  p_event_key text,
  p_event_type text,
  p_house_id uuid,
  p_actor_profile_id uuid default null,
  p_memory_id uuid default null,
  p_habit_learning_id uuid default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare event_id uuid; inserted_event boolean := false;
begin
  if p_event_type not in ('house_joined', 'memory_completed', 'habit_learned') then
    raise exception 'invalid_notification_event_type' using errcode = '22023';
  end if;

  insert into public.notification_events(event_key,event_type,house_id,actor_profile_id,memory_id,habit_learning_id)
  values(p_event_key,p_event_type,p_house_id,p_actor_profile_id,p_memory_id,p_habit_learning_id)
  on conflict(event_key) do nothing
  returning id into event_id;
  inserted_event := found;

  if not inserted_event then
    select id into event_id from public.notification_events where event_key = p_event_key;
    return event_id;
  end if;

  insert into public.notification_deliveries(event_id,recipient_profile_id)
  select event_id, hm.profile_id
  from public.house_memberships hm
  where hm.house_id = p_house_id
    and hm.status = 'active'
    and hm.profile_id is distinct from p_actor_profile_id
    and (
      p_event_type = 'house_joined'
      or (p_event_type = 'memory_completed' and exists (
        select 1 from public.memory_viewers mv
        where mv.memory_id = p_memory_id and mv.profile_id = hm.profile_id and mv.access_ended_at is null
      ))
      or (p_event_type = 'habit_learned' and exists (
        select 1 from public.habit_learning hl
        join public.animals learner on learner.id = hl.learner_animal_id
        join public.animals teacher on teacher.id = hl.teacher_animal_id
        where hl.id = p_habit_learning_id and hm.profile_id in (learner.profile_id, teacher.profile_id)
      ))
    )
  on conflict(event_id,recipient_profile_id) do nothing;

  return event_id;
end;
$$;

create or replace function public.refresh_notification_delivery_status(p_delivery_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare next_status text;
begin
  select case
    when count(*) = 0 then 'pending'
    when count(*) filter (where status in ('pending','leased','retry','receipt_leased')) > 0 then 'pending'
    when count(*) filter (where status = 'awaiting_receipt') > 0 then 'awaiting_receipt'
    when count(*) filter (where status = 'sent') > 0 then 'sent'
    when count(*) filter (where status = 'failed') > 0 then 'failed'
    else 'skipped'
  end into next_status
  from public.notification_delivery_targets where delivery_id = p_delivery_id;
  update public.notification_deliveries set status=next_status,updated_at=clock_timestamp() where id=p_delivery_id;
end;
$$;

create or replace function public.claim_notification_delivery_targets(p_limit integer default 50, p_lease_seconds integer default 120)
returns table(target_id uuid,delivery_id uuid,event_id uuid,event_type text,house_id uuid,memory_id uuid,habit_learning_id uuid,expo_token text)
language plpgsql security definer set search_path=public as $$
declare candidate record; claimed_at timestamptz := clock_timestamp();
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_notification_limit' using errcode='22023'; end if;

  insert into public.notification_delivery_targets(delivery_id,push_token_id)
  select d.id, pt.id
  from public.notification_deliveries d
  join public.notification_events e on e.id=d.event_id
  join public.push_tokens pt on pt.profile_id=d.recipient_profile_id and pt.active
  where d.status in ('pending','awaiting_receipt') and e.created_at > claimed_at - interval '24 hours'
  on conflict(delivery_id,push_token_id) do nothing;

  for candidate in
    select t.id as candidate_target_id,t.delivery_id,d.event_id,e.event_type,e.house_id,e.memory_id,e.habit_learning_id,pt.token
    from public.notification_delivery_targets t
    join public.notification_deliveries d on d.id=t.delivery_id
    join public.notification_events e on e.id=d.event_id
    join public.push_tokens pt on pt.id=t.push_token_id
    where t.status in ('pending','retry') and t.next_attempt_at <= claimed_at
      and (t.lease_expires_at is null or t.lease_expires_at <= claimed_at)
    order by t.next_attempt_at,t.id
    limit p_limit
    for update of t skip locked
  loop
    if not public.notification_recipient_is_eligible(candidate.event_id, (select recipient_profile_id from public.notification_deliveries where id=candidate.delivery_id))
       or not exists(select 1 from public.push_tokens where id=(select push_token_id from public.notification_delivery_targets where id=candidate.candidate_target_id) and active) then
      update public.notification_delivery_targets set status='skipped',lease_expires_at=null,updated_at=claimed_at where id=candidate.candidate_target_id;
      perform public.refresh_notification_delivery_status(candidate.delivery_id);
      continue;
    end if;
    update public.notification_delivery_targets
    set status='leased',attempt_count=attempt_count+1,lease_expires_at=claimed_at + make_interval(secs => p_lease_seconds),updated_at=claimed_at
    where id=candidate.candidate_target_id;
    return query select candidate.candidate_target_id,candidate.delivery_id,candidate.event_id,candidate.event_type,candidate.house_id,candidate.memory_id,candidate.habit_learning_id,candidate.token;
  end loop;
end;
$$;

create or replace function public.record_notification_ticket_result(
  p_target_id uuid,
  p_result text,
  p_ticket_id text default null,
  p_error text default null
)
returns void language plpgsql security definer set search_path=public as $$
declare target public.notification_delivery_targets%rowtype; retry_at timestamptz;
begin
  select * into target from public.notification_delivery_targets where id=p_target_id for update;
  if not found or target.status <> 'leased' then return; end if;
  if p_result = 'accepted' and p_ticket_id is not null then
    update public.notification_delivery_targets set status='awaiting_receipt',expo_ticket_id=p_ticket_id,receipt_check_after=clock_timestamp()+interval '1 minute',lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  elsif p_result = 'invalid_token' then
    update public.push_tokens set active=false,updated_at=clock_timestamp() where id=target.push_token_id;
    update public.notification_delivery_targets set status='failed',last_error=coalesce(p_error,'DeviceNotRegistered'),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  elsif p_result = 'permanent_failure' then
    update public.notification_delivery_targets set status='failed',last_error=coalesce(p_error,'permanent Expo Push failure'),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  else
    retry_at := clock_timestamp() + make_interval(secs => least(3600, 60 * (2 ^ greatest(target.attempt_count - 1, 0))));
    update public.notification_delivery_targets set status='retry',next_attempt_at=retry_at,last_error=coalesce(p_error,'retryable Expo Push failure'),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  end if;
  perform public.refresh_notification_delivery_status(target.delivery_id);
end;
$$;

create or replace function public.claim_notification_receipts(p_limit integer default 50, p_lease_seconds integer default 120)
returns table(target_id uuid,expo_ticket_id text)
language plpgsql security definer set search_path=public as $$
declare candidate public.notification_delivery_targets%rowtype; claimed_at timestamptz := clock_timestamp();
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_notification_limit' using errcode='22023'; end if;
  for candidate in
    select * from public.notification_delivery_targets
    where status='awaiting_receipt' and receipt_check_after <= claimed_at
    order by receipt_check_after,id limit p_limit for update skip locked
  loop
    update public.notification_delivery_targets set status='receipt_leased',lease_expires_at=claimed_at+make_interval(secs => p_lease_seconds),updated_at=claimed_at where id=candidate.id;
    return query select candidate.id,candidate.expo_ticket_id;
  end loop;
end;
$$;

create or replace function public.record_notification_receipt_result(p_target_id uuid,p_result text,p_error text default null)
returns void language plpgsql security definer set search_path=public as $$
declare target public.notification_delivery_targets%rowtype; retry_at timestamptz;
begin
  select * into target from public.notification_delivery_targets where id=p_target_id for update;
  if not found or target.status <> 'receipt_leased' then return; end if;
  if p_result='sent' then
    update public.notification_delivery_targets set status='sent',sent_at=clock_timestamp(),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  elsif p_result='pending_receipt' then
    update public.notification_delivery_targets set status='awaiting_receipt',receipt_check_after=clock_timestamp()+interval '1 minute',lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  elsif p_result='invalid_token' then
    update public.push_tokens set active=false,updated_at=clock_timestamp() where id=target.push_token_id;
    update public.notification_delivery_targets set status='failed',last_error=coalesce(p_error,'DeviceNotRegistered'),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  elsif p_result='permanent_failure' then
    update public.notification_delivery_targets set status='failed',last_error=coalesce(p_error,'permanent Expo receipt failure'),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  else
    retry_at := clock_timestamp() + make_interval(secs => least(3600, 60 * (2 ^ greatest(target.attempt_count - 1, 0))));
    update public.notification_delivery_targets set status='retry',next_attempt_at=retry_at,last_error=coalesce(p_error,'retryable Expo receipt failure'),lease_expires_at=null,updated_at=clock_timestamp() where id=target.id;
  end if;
  perform public.refresh_notification_delivery_status(target.delivery_id);
end;
$$;

create or replace function public.enqueue_house_joined_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='active' and new.role='member' then
    perform public.enqueue_notification_event('house-joined:' || new.id::text, 'house_joined', new.house_id, new.profile_id);
  end if;
  return new;
end;
$$;
drop trigger if exists house_member_joined_notification on public.house_memberships;
create trigger house_member_joined_notification after insert on public.house_memberships for each row execute function public.enqueue_house_joined_notification();

create or replace function public.complete_memory_if_ready(p_memory_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare memory_row public.memories%rowtype; contributor_count integer; definition_id text; item_id uuid;
begin
 select * into memory_row from public.memories where id=p_memory_id for update;
 if not found or memory_row.status not in ('shared','completed') then return null; end if;
 select count(*) into contributor_count from public.memory_contributions where memory_id=p_memory_id and deleted_at is null;
 if contributor_count < 2 then return null; end if;
 if memory_row.status = 'completed' then select owned_item_id into item_id from public.memory_completion_events where memory_id=p_memory_id; return item_id; end if;
 select id into definition_id from public.item_definitions where source='memory' and active order by id offset (abs(hashtextextended(p_memory_id::text, 0)) % 15) limit 1;
 if definition_id is null then raise exception 'memory_furniture_definition_missing' using errcode='P0001'; end if;
 insert into public.owned_items(profile_id,item_definition_id,kind,memory_id) values(memory_row.author_profile_id,definition_id,'memory',p_memory_id)
 on conflict (memory_id) where memory_id is not null do update set memory_id=excluded.memory_id returning id into item_id;
 insert into public.memory_completion_events(memory_id,owned_item_id) values(p_memory_id,item_id) on conflict (memory_id) do nothing;
 update public.memories set status='completed',generated_item_id=definition_id,updated_at=clock_timestamp() where id=p_memory_id;
 perform public.enqueue_notification_event('memory-completed:' || p_memory_id::text, 'memory_completed', memory_row.house_id, auth.uid(), p_memory_id);
 return item_id;
end;
$$;

create or replace function public.record_habit_activity(p_learning_id uuid) returns table(days integer,status text) language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); l public.habit_learning%rowtype; d date:=((clock_timestamp() at time zone 'Asia/Seoul')::date); count_days integer; event_house_id uuid;
begin
 select * into l from public.habit_learning where id=p_learning_id and status='learning' for update; if not found then raise exception 'learning_not_active' using errcode='42501'; end if;
 if not exists(select 1 from public.animals where id=l.learner_animal_id and profile_id=uid) and not exists(select 1 from public.animals where id=l.teacher_animal_id and profile_id=uid) then raise exception 'activity_forbidden' using errcode='42501'; end if;
 insert into public.habit_learning_participants(learning_id,game_date,profile_id) values(l.id,d,uid) on conflict do nothing;
 insert into public.habit_learning_days(learning_id,game_date) select l.id,d where (select count(distinct p.profile_id) from public.habit_learning_participants p where p.learning_id=l.id and p.game_date=d)>=2 on conflict do nothing;
 select count(*) into count_days from public.habit_learning_days where learning_id=l.id;
 if count_days>=3 then
   insert into public.learned_habits(animal_id,habit_id,teacher_animal_id) values(l.learner_animal_id,l.habit_id,l.teacher_animal_id) on conflict do nothing;
   if found then
     update public.habit_learning set status='learned',ended_at=clock_timestamp() where id=l.id;
     select hm.house_id into event_house_id from public.animals a join public.house_memberships hm on hm.profile_id=a.profile_id and hm.status='active' where a.id=l.learner_animal_id;
     perform public.enqueue_notification_event('habit-learned:' || l.id::text, 'habit_learned', event_house_id, uid, null, l.id);
   end if;
 end if;
 return query select least(count_days,3),case when count_days>=3 then 'learned' else 'learning' end;
end $$;

revoke all on function public.notification_recipient_is_eligible(uuid,uuid), public.set_my_push_enabled(boolean), public.enqueue_notification_event(text,text,uuid,uuid,uuid,uuid), public.refresh_notification_delivery_status(uuid), public.claim_notification_delivery_targets(integer,integer), public.record_notification_ticket_result(uuid,text,text,text), public.claim_notification_receipts(integer,integer), public.record_notification_receipt_result(uuid,text,text) from public;
grant execute on function public.set_my_push_enabled(boolean) to authenticated;
grant execute on function public.claim_notification_delivery_targets(integer,integer), public.record_notification_ticket_result(uuid,text,text,text), public.claim_notification_receipts(integer,integer), public.record_notification_receipt_result(uuid,text,text) to service_role;
