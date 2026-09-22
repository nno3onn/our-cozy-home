-- Leaving a house is a single transaction. Future owned-item/placement migrations
-- extend this command with the same user -> house -> child-row lock ordering.

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
  left_at timestamptz := timezone('utc', now());
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select house_id into candidate_house_id from public.house_memberships
  where profile_id = current_user_id and status = 'active';
  if not found then
    return query select null::uuid, false, null::uuid, 'already_left';
    return;
  end if;

  select * into locked_house from public.houses where id = candidate_house_id for update;
  select * into current_membership from public.house_memberships
  where profile_id = current_user_id and house_id = locked_house.id and status = 'active' for update;
  if not found then
    return query select locked_house.id, locked_house.status = 'archived', null::uuid, 'already_left';
    return;
  end if;

  -- Active invitations are never revived by a later departure.
  update public.house_invites set status = 'cancelled', ended_at = left_at
  where house_id = locked_house.id and status = 'active';

  update public.house_memberships set status = 'left', left_at = left_at
  where id = current_membership.id;

  select count(*)::integer into remaining_members from public.house_memberships
  where house_id = locked_house.id and status = 'active';
  if remaining_members = 0 then
    update public.houses set status = 'archived', archived_at = left_at where id = locked_house.id;
    return query select locked_house.id, true, null::uuid, 'left';
    return;
  end if;

  if current_membership.role = 'admin' then
    select * into successor_membership from public.house_memberships
    where house_id = locked_house.id and status = 'active'
    order by joined_at asc, id asc limit 1 for update;
    update public.house_memberships set role = 'admin' where id = successor_membership.id;
    update public.houses set admin_profile_id = successor_membership.profile_id where id = locked_house.id;
    return query select locked_house.id, false, successor_membership.profile_id, 'left';
    return;
  end if;

  return query select locked_house.id, false, null::uuid, 'left';
end;
$$;

revoke all on function public.leave_house() from public;
grant execute on function public.leave_house() to authenticated;
