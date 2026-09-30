-- Preserve historical migrations while correcting runtime function behaviour
-- under PostgreSQL's PL/pgSQL name-resolution rules.

create or replace function public.complete_onboarding(
  p_display_name text,
  p_point_color text,
  p_animal_name text,
  p_species public.animal_species
)
returns table (profile_id uuid, animal_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  created_animal_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if btrim(p_display_name) !~ '^[[:alnum:]가-힣 _-]{1,20}$' then
    raise exception 'invalid display name' using errcode = '22023';
  end if;
  if p_point_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid point color' using errcode = '22023';
  end if;
  if btrim(p_animal_name) !~ '^[[:alnum:]가-힣 _-]{1,20}$' then
    raise exception 'invalid animal name' using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name, point_color)
  values (current_user_id, btrim(p_display_name), p_point_color)
  on conflict (id) do update
    set display_name = excluded.display_name,
        point_color = excluded.point_color;

  insert into public.animals (profile_id, name, species, state)
  values (current_user_id, btrim(p_animal_name), p_species, 'idle')
  on conflict (profile_id) do update
    set name = excluded.name,
        species = excluded.species
  returning id into created_animal_id;

  return query select current_user_id, created_animal_id;
end;
$$;

create or replace function public.reject_deleted_profile_write()
returns trigger language plpgsql security definer set search_path = public
as $$
declare writer_id uuid;
begin
  if TG_TABLE_NAME in ('memories', 'memory_contributions') then
    writer_id := (to_jsonb(new) ->> 'author_profile_id')::uuid;
  else
    select mc.author_profile_id into writer_id
    from public.memory_contributions mc
    where mc.id = (to_jsonb(new) ->> 'contribution_id')::uuid;
  end if;
  perform public.assert_active_profile(writer_id);
  return new;
end;
$$;

create or replace function public.create_house_invite(p_reissue boolean default false)
returns table (invite_token text, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  current_membership public.house_memberships%rowtype;
  current_invite public.house_invites%rowtype;
  raw_token text;
  new_code text;
  new_expiry timestamptz := timezone('utc', now()) + interval '24 hours';
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into current_membership from public.house_memberships
  where profile_id = current_user_id and status = 'active' for update;
  if not found or current_membership.role <> 'admin' then raise exception 'admin_required' using errcode = '42501'; end if;
  perform 1 from public.houses where id = current_membership.house_id and status = 'active' for update;
  if not found then raise exception 'house_archived' using errcode = 'P0001'; end if;
  select * into current_invite from public.house_invites where house_id = current_membership.house_id and status = 'active' for update;
  if found and current_invite.expires_at <= timezone('utc', now()) then
    update public.house_invites set status = 'expired', ended_at = timezone('utc', now()) where id = current_invite.id;
    found := false;
  end if;
  if found and not p_reissue then raise exception 'active_invite_exists' using errcode = 'P0001'; end if;
  if found then update public.house_invites set status = 'reissued', ended_at = timezone('utc', now()) where id = current_invite.id; end if;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  loop
    new_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.house_invites where invite_code = new_code);
  end loop;
  insert into public.house_invites (house_id, created_by_profile_id, token_hash, invite_code, expires_at)
  values (current_membership.house_id, current_user_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), new_code, new_expiry);
  return query select raw_token, new_code, new_expiry;
end;
$$;

-- Qualify only the output-name collisions in invite acceptance. This preserves
-- local variables such as timestamps instead of changing PL/pgSQL's global
-- variable-resolution mode.
do $$
declare function_definition text;
begin
  select pg_get_functiondef('public.accept_house_invite(text,text)'::regprocedure)
  into function_definition;
  function_definition := replace(
    function_definition,
    E'select id, house_id into candidate_invite_id, candidate_house_id\n  from public.house_invites\n  where token_hash',
    E'select invite.id, invite.house_id into candidate_invite_id, candidate_house_id\n  from public.house_invites invite\n  where invite.token_hash'
  );
  function_definition := replace(
    function_definition,
    E'from public.house_memberships\n  where house_id = locked_house.id and status = \'active\';',
    E'from public.house_memberships membership\n  where membership.house_id = locked_house.id and membership.status = \'active\';'
  );
  execute function_definition;
end;
$$;

-- The notification outbox function returns a UUID and historically used the
-- same `event_id` identifier for its local value and delivery-table column.
-- Keep the event value distinct so runtime PL/pgSQL resolution remains
-- explicit without changing the semantics of `on conflict` column names.
create or replace function public.enqueue_notification_event(
  p_event_key text,
  p_event_type text,
  p_house_id uuid,
  p_actor_profile_id uuid default null,
  p_memory_id uuid default null,
  p_habit_learning_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_event_id uuid;
  inserted_event boolean := false;
begin
  if p_event_type not in ('house_joined', 'memory_completed', 'habit_learned') then
    raise exception 'invalid_notification_event_type' using errcode = '22023';
  end if;

  insert into public.notification_events(event_key,event_type,house_id,actor_profile_id,memory_id,habit_learning_id)
  values(p_event_key,p_event_type,p_house_id,p_actor_profile_id,p_memory_id,p_habit_learning_id)
  on conflict(event_key) do nothing
  returning id into created_event_id;
  inserted_event := found;

  if not inserted_event then
    select queued_event.id into created_event_id
    from public.notification_events queued_event
    where queued_event.event_key = p_event_key;
    return created_event_id;
  end if;

  insert into public.notification_deliveries(event_id,recipient_profile_id)
  select created_event_id, membership.profile_id
  from public.house_memberships membership
  where membership.house_id = p_house_id
    and membership.status = 'active'
    and membership.profile_id is distinct from p_actor_profile_id
    and (
      p_event_type = 'house_joined'
      or (p_event_type = 'memory_completed' and exists (
        select 1 from public.memory_viewers viewer
        where viewer.memory_id = p_memory_id
          and viewer.profile_id = membership.profile_id
          and viewer.access_ended_at is null
      ))
      or (p_event_type = 'habit_learned' and exists (
        select 1 from public.habit_learning learning
        join public.animals learner on learner.id = learning.learner_animal_id
        join public.animals teacher on teacher.id = learning.teacher_animal_id
        where learning.id = p_habit_learning_id
          and membership.profile_id in (learner.profile_id, teacher.profile_id)
      ))
    )
  on conflict(event_id,recipient_profile_id) do nothing;

  return created_event_id;
end;
$$;

-- Return-table field names become PL/pgSQL variables. Recompile the remaining
-- state-changing RPCs with explicit relation aliases and distinct local names;
-- changing the global conflict setting would corrupt legitimate assignments.
create or replace function public.leave_house()
returns table (house_id uuid, house_archived boolean, successor_profile_id uuid, result text)
language plpgsql security definer set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  candidate_house_id uuid;
  locked_house public.houses%rowtype;
  current_membership public.house_memberships%rowtype;
  successor_membership public.house_memberships%rowtype;
  remaining_members integer;
  departure_at timestamptz := clock_timestamp();
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select membership.house_id into candidate_house_id
  from public.house_memberships membership
  where membership.profile_id = current_user_id and membership.status = 'active';
  if not found then
    return query select null::uuid, false, null::uuid, 'already_left';
    return;
  end if;

  select * into locked_house from public.houses house where house.id = candidate_house_id for update;
  select * into current_membership from public.house_memberships membership
  where membership.profile_id = current_user_id
    and membership.house_id = locked_house.id
    and membership.status = 'active'
  for update;
  if not found then
    return query select locked_house.id, locked_house.status = 'archived', null::uuid, 'already_left';
    return;
  end if;

  update public.house_invites invite
  set status = 'cancelled', ended_at = departure_at
  where invite.house_id = locked_house.id and invite.status = 'active';

  update public.house_memberships membership
  set status = 'left', left_at = departure_at
  where membership.id = current_membership.id;

  select count(*)::integer into remaining_members
  from public.house_memberships membership
  where membership.house_id = locked_house.id and membership.status = 'active';
  if remaining_members = 0 then
    update public.houses house
    set status = 'archived', archived_at = departure_at
    where house.id = locked_house.id;
    return query select locked_house.id, true, null::uuid, 'left';
    return;
  end if;

  if current_membership.role = 'admin' then
    select * into successor_membership from public.house_memberships membership
    where membership.house_id = locked_house.id and membership.status = 'active'
    order by membership.joined_at asc, membership.id asc limit 1 for update;
    update public.house_memberships membership
    set role = 'admin'
    where membership.id = successor_membership.id;
    update public.houses house
    set admin_profile_id = successor_membership.profile_id
    where house.id = locked_house.id;
    return query select locked_house.id, false, successor_membership.profile_id, 'left';
    return;
  end if;

  return query select locked_house.id, false, null::uuid, 'left';
end;
$$;

create or replace function public.share_memory_draft(p_memory_id uuid)
returns table(memory_id uuid, house_id uuid, viewer_count integer, result text)
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  active_house uuid;
  existing public.memories%rowtype;
  viewers integer;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select membership.house_id into active_house
  from public.house_memberships membership
  where membership.profile_id = uid and membership.status = 'active';
  if active_house is null then raise exception 'not_in_house' using errcode = '42501'; end if;
  perform 1 from public.houses house
  where house.id = active_house and house.status = 'active' for update;
  if not found then raise exception 'not_in_house' using errcode = '42501'; end if;
  select * into existing from public.memories memory
  where memory.id = p_memory_id and memory.author_profile_id = uid for update;
  if not found then raise exception 'memory_draft_not_found' using errcode = '42501'; end if;
  if existing.status = 'private_draft' then
    update public.memories memory
    set house_id = active_house, status = 'shared', shared_at = timezone('utc',now())
    where memory.id = existing.id;
    insert into public.memory_viewers(memory_id, profile_id, membership_id)
    select existing.id, membership.profile_id, membership.id
    from public.house_memberships membership
    where membership.house_id = active_house and membership.status = 'active'
    on conflict on constraint memory_viewers_pkey do nothing;
    insert into public.memory_contributions(memory_id,author_profile_id)
    values(existing.id,uid)
    on conflict on constraint memory_contributions_memory_id_author_profile_id_key do nothing;
    insert into public.memory_contribution_revisions(contribution_id,body)
    select contribution.id, existing.body
    from public.memory_contributions contribution
    where contribution.memory_id = existing.id
      and contribution.author_profile_id = uid
      and not exists (
        select 1 from public.memory_contribution_revisions revision
        where revision.contribution_id = contribution.id
      );
  elsif existing.house_id <> active_house then
    raise exception 'memory_house_mismatch' using errcode = '42501';
  end if;
  select count(*)::integer into viewers
  from public.memory_viewers viewer
  where viewer.memory_id = existing.id;
  return query select existing.id, active_house, viewers,
    case when existing.status = 'private_draft' then 'shared' else 'already_shared' end;
end;
$$;

create or replace function public.claim_attendance_reward()
returns table (balance integer, game_date date, granted boolean)
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  kst_date date := (timezone('Asia/Seoul', now()))::date;
  reward integer;
  tx uuid;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  select settings.value::text::integer into reward
  from public.app_settings settings
  where settings.key = 'attendance_daily_reward';
  if reward <> 100 then raise exception 'invalid_attendance_reward_setting' using errcode='P0001'; end if;
  insert into public.coin_wallets(profile_id) values(uid) on conflict(profile_id) do nothing;
  perform 1 from public.coin_wallets wallet where wallet.profile_id = uid for update;
  select attendance.transaction_id into tx
  from public.attendance_rewards attendance
  where attendance.profile_id = uid and attendance.game_date = kst_date;
  if found then
    return query select wallet.balance, kst_date, false
    from public.coin_wallets wallet where wallet.profile_id = uid;
    return;
  end if;
  insert into public.coin_transactions(profile_id,amount,reason)
  values(uid,reward,'attendance') returning id into tx;
  insert into public.attendance_rewards(profile_id,game_date,transaction_id)
  values(uid,kst_date,tx);
  update public.coin_wallets wallet
  set balance = wallet.balance + reward, updated_at = timezone('utc',now())
  where wallet.profile_id = uid;
  return query select wallet.balance, kst_date, true
  from public.coin_wallets wallet where wallet.profile_id = uid;
end;
$$;

create or replace function public.purchase_item(p_item_definition_id text, p_request_key uuid)
returns table (item_definition_id text, owned_item_id uuid, balance integer, quantity integer, result text)
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  price integer;
  consumable boolean;
  item_kind text;
  owned uuid;
  item_quantity integer;
  current_balance integer;
  tx uuid;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  insert into public.coin_wallets(profile_id) values (uid) on conflict(profile_id) do nothing;
  perform 1 from public.coin_wallets wallet where wallet.profile_id = uid for update;
  select request.item_definition_id, request.owned_item_id, request.balance, request.quantity
    into item_definition_id, owned_item_id, balance, quantity
  from public.purchase_requests request
  where request.profile_id = uid and request.request_key = p_request_key;
  if found then result := 'already_purchased'; return next; return; end if;
  select item.price, item.consumable into price, consumable
  from public.item_definitions item
  where item.id = p_item_definition_id and item.source = 'shop' and item.active;
  if not found then raise exception 'shop_item_not_found' using errcode = 'P0001'; end if;
  select wallet.balance into current_balance
  from public.coin_wallets wallet where wallet.profile_id = uid;
  if current_balance < price then
    raise exception 'insufficient_coins' using errcode = 'P0001',
      detail = json_build_object('balance', current_balance, 'price', price, 'shortage', price - current_balance)::text;
  end if;
  item_kind := case when consumable then 'consumable' else 'furniture' end;
  if consumable then
    select item.id, item.quantity into owned, item_quantity
    from public.owned_items item
    where item.profile_id = uid
      and item.item_definition_id = p_item_definition_id
      and item.kind = 'consumable'
      and item.recovered_at is null
    for update;
    if found then
      update public.owned_items item
      set quantity = item.quantity + 1, updated_at = now()
      where item.id = owned
      returning item.quantity into item_quantity;
    else
      insert into public.owned_items as item(profile_id,item_definition_id,kind)
      values(uid,p_item_definition_id,item_kind)
      returning item.id, item.quantity into owned,item_quantity;
    end if;
  else
    insert into public.owned_items as item(profile_id,item_definition_id,kind)
    values(uid,p_item_definition_id,item_kind)
    returning item.id, item.quantity into owned,item_quantity;
  end if;
  update public.coin_wallets wallet
  set balance = wallet.balance - price, updated_at = now()
  where wallet.profile_id = uid
  returning wallet.balance into current_balance;
  insert into public.coin_transactions(profile_id,amount,reason)
  values(uid,-price,'purchase:' || p_item_definition_id) returning id into tx;
  insert into public.purchase_requests(profile_id,request_key,item_definition_id,owned_item_id,transaction_id,balance,quantity)
  values(uid,p_request_key,p_item_definition_id,owned,tx,current_balance,item_quantity);
  item_definition_id := p_item_definition_id;
  owned_item_id := owned;
  balance := current_balance;
  quantity := item_quantity;
  result := 'purchased';
  return next;
end;
$$;

create or replace function public.request_account_deletion(p_request_key uuid)
returns table(profile_id uuid, status text)
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  now_at timestamptz := clock_timestamp();
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  perform 1 from public.profiles profile where profile.id = uid for update;
  if not found then raise exception 'profile_not_found' using errcode = 'P0001'; end if;

  select request.status into status
  from public.account_deletion_requests request
  where request.profile_id = uid for update;
  if found then
    profile_id := uid;
    return next;
    return;
  end if;

  perform public.leave_house();

  delete from public.memories memory
  where memory.author_profile_id = uid and memory.status = 'private_draft';
  update public.memory_photos photo
  set deleted_at = now_at
  from public.memory_contributions contribution
  where photo.contribution_id = contribution.id
    and contribution.author_profile_id = uid
    and photo.deleted_at is null;
  update public.memory_contribution_revisions revision
  set deleted_at = now_at
  from public.memory_contributions contribution
  where revision.contribution_id = contribution.id
    and contribution.author_profile_id = uid
    and revision.deleted_at is null;
  update public.memory_contributions contribution
  set deleted_at = now_at, updated_at = now_at
  where contribution.author_profile_id = uid and contribution.deleted_at is null;
  update public.memories memory
  set title = '함께한 추억', body = '', updated_at = now_at
  where memory.author_profile_id = uid and memory.status in ('shared', 'completed');
  delete from public.memory_viewers viewer where viewer.profile_id = uid;

  update public.habit_learning learning
  set status = 'ended', ended_at = now_at
  where learning.status = 'learning'
    and (learning.learner_animal_id in (select animal.id from public.animals animal where animal.profile_id = uid)
      or learning.teacher_animal_id in (select animal.id from public.animals animal where animal.profile_id = uid));
  update public.animals animal
  set name = '떠난 동물', state = 'idle', deleted_at = now_at, updated_at = now_at
  where animal.profile_id = uid and animal.deleted_at is null;

  delete from public.notification_delivery_targets target
  using public.notification_deliveries delivery
  where target.delivery_id = delivery.id and delivery.recipient_profile_id = uid;
  delete from public.notification_deliveries delivery where delivery.recipient_profile_id = uid;
  update public.notification_events notification_event
  set actor_profile_id = null where notification_event.actor_profile_id = uid;
  delete from public.push_tokens token where token.profile_id = uid;
  delete from public.notification_preferences preference where preference.profile_id = uid;

  delete from public.purchase_requests request where request.profile_id = uid;
  delete from public.attendance_rewards attendance where attendance.profile_id = uid;
  delete from public.coin_transactions transaction_entry where transaction_entry.profile_id = uid;
  delete from public.coin_wallets wallet where wallet.profile_id = uid;
  delete from public.room_placements placement
  using public.owned_items item
  where placement.owned_item_id = item.id and item.profile_id = uid;
  delete from public.owned_items item where item.profile_id = uid and item.kind <> 'memory';

  update public.profiles profile
  set display_name = '떠난 친구', point_color = '#B8B8B8', deleted_at = now_at, updated_at = now_at
  where profile.id = uid;
  insert into public.account_deletion_requests(profile_id, request_key, status, prepared_at, updated_at)
  values (uid, p_request_key, 'ready_for_auth_deletion', now_at, now_at);

  profile_id := uid;
  status := 'ready_for_auth_deletion';
  return next;
end;
$$;

create or replace function public.revise_memory_contribution(p_contribution_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  contribution_memory_id uuid;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  select contribution.memory_id into contribution_memory_id
  from public.memory_contributions contribution
  where contribution.id = p_contribution_id
    and contribution.author_profile_id = uid
    and contribution.deleted_at is null
  for update;
  if not found then raise exception 'memory_contribution_not_found' using errcode='42501'; end if;
  if not exists(
    select 1 from public.memory_viewers viewer
    where viewer.memory_id = contribution_memory_id
      and viewer.profile_id = uid
      and viewer.can_contribute
      and viewer.access_ended_at is null
  ) then
    raise exception 'memory_contribution_forbidden' using errcode='42501';
  end if;
  insert into public.memory_contribution_revisions(contribution_id,body,published_at)
  values(p_contribution_id,coalesce(p_body,''),clock_timestamp());
  update public.memory_contributions contribution
  set updated_at = timezone('utc',now())
  where contribution.id = p_contribution_id;
  return p_contribution_id;
end;
$$;

-- A departed contributor sees one immutable snapshot per contributor: the
-- latest revision available at the departure timestamp, never later changes.
create or replace function public.get_memory_contribution_detail(p_memory_id uuid)
returns table(contribution_id uuid,author_profile_id uuid,display_name text,body text,published_at timestamptz)
language sql security definer set search_path = public
as $$
  select contribution.id, contribution.author_profile_id, profile.display_name,
    revision.body, revision.published_at
  from public.memory_viewers viewer
  join public.memory_contributions contribution
    on contribution.memory_id = viewer.memory_id and contribution.deleted_at is null
  join public.profiles profile on profile.id = contribution.author_profile_id
  join lateral (
    select candidate.body, candidate.published_at
    from public.memory_contribution_revisions candidate
    where candidate.contribution_id = contribution.id
      and candidate.deleted_at is null
      and (
        viewer.access_ended_at is null
        or (viewer.archive_retained and candidate.published_at <= viewer.access_ended_at)
      )
    order by candidate.published_at desc, candidate.id desc
    limit 1
  ) revision on true
  where viewer.memory_id = p_memory_id
    and viewer.profile_id = auth.uid()
  order by revision.published_at asc, contribution.id asc;
$$;

drop policy if exists "profiles_select_active_house_members" on public.profiles;
create policy "profiles_select_active_house_members" on public.profiles
for select to authenticated using (
  deleted_at is null and (
    id = auth.uid()
    or exists (
      select 1
      from public.house_memberships mine
      join public.house_memberships theirs on theirs.house_id = mine.house_id
      where mine.profile_id = auth.uid()
        and mine.status = 'active'
        and theirs.profile_id = profiles.id
        and theirs.status = 'active'
    )
  )
);
