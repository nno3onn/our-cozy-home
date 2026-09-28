-- Auth users are physically deleted by the Edge Function. Profiles remain as
-- non-identifying tombstones because shared membership, completed furniture and
-- learned-habit provenance retain historical foreign-key references.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.animals add column if not exists deleted_at timestamptz;

create table public.account_deletion_requests (
  profile_id uuid primary key references public.profiles(id) on delete restrict,
  request_key uuid not null unique,
  status text not null check (status in ('ready_for_auth_deletion', 'completed')),
  prepared_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.account_deletion_requests enable row level security;
create policy "account_deletion_requests_select_owner"
on public.account_deletion_requests for select to authenticated using (profile_id = auth.uid());
revoke insert, update, delete on public.account_deletion_requests from anon, authenticated;

create or replace function public.request_account_deletion(p_request_key uuid)
returns table(profile_id uuid, status text)
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); now_at timestamptz := clock_timestamp();
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  perform 1 from public.profiles where id = uid for update;
  if not found then raise exception 'profile_not_found' using errcode = 'P0001'; end if;

  select adr.status into status from public.account_deletion_requests adr
  where adr.profile_id = uid for update;
  if found then
    profile_id := uid;
    return next;
    return;
  end if;

  -- Reuse the house departure transaction: it cancels invites, recovers room
  -- placements, ends in-progress learning, transfers admin role and archives
  -- only the last active house member.
  perform public.leave_house();

  -- Private drafts are personal. Shared memories remain, while the deleting
  -- user's authored content is deleted from the canonical source.
  delete from public.memories where author_profile_id = uid and status = 'private_draft';
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
  update public.memory_contributions
  set deleted_at = now_at, updated_at = now_at
  where author_profile_id = uid and deleted_at is null;
  update public.memories
  set title = '함께한 추억', body = '', updated_at = now_at
  where author_profile_id = uid and status in ('shared', 'completed');
  delete from public.memory_viewers where profile_id = uid;

  -- Retain learned-habit and completed-memory references, but anonymize the
  -- deleted animal rather than exposing its original name.
  update public.habit_learning
  set status = 'ended', ended_at = now_at
  where status = 'learning'
    and (learner_animal_id in (select id from public.animals where profile_id = uid)
      or teacher_animal_id in (select id from public.animals where profile_id = uid));
  update public.animals
  set name = '떠난 동물', state = 'idle', deleted_at = now_at, updated_at = now_at
  where profile_id = uid and deleted_at is null;

  delete from public.notification_delivery_targets target
  using public.notification_deliveries delivery
  where target.delivery_id = delivery.id and delivery.recipient_profile_id = uid;
  delete from public.notification_deliveries where recipient_profile_id = uid;
  update public.notification_events set actor_profile_id = null where actor_profile_id = uid;
  delete from public.push_tokens where profile_id = uid;
  delete from public.notification_preferences where profile_id = uid;

  delete from public.purchase_requests where profile_id = uid;
  delete from public.attendance_rewards where profile_id = uid;
  delete from public.coin_transactions where profile_id = uid;
  delete from public.coin_wallets where profile_id = uid;
  delete from public.room_placements placement
  using public.owned_items item
  where placement.owned_item_id = item.id and item.profile_id = uid;
  delete from public.owned_items where profile_id = uid and kind <> 'memory';

  update public.profiles
  set display_name = '떠난 친구', point_color = '#B8B8B8', deleted_at = now_at, updated_at = now_at
  where id = uid;
  insert into public.account_deletion_requests(profile_id, request_key, status, prepared_at, updated_at)
  values (uid, p_request_key, 'ready_for_auth_deletion', now_at, now_at);

  profile_id := uid;
  status := 'ready_for_auth_deletion';
  return next;
end;
$$;

create or replace function public.mark_account_deletion_completed(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.account_deletion_requests
  set status = 'completed', completed_at = clock_timestamp(), updated_at = clock_timestamp()
  where profile_id = p_profile_id and status = 'ready_for_auth_deletion';
end;
$$;

revoke all on function public.request_account_deletion(uuid), public.mark_account_deletion_completed(uuid) from public;
grant execute on function public.request_account_deletion(uuid) to authenticated;
grant execute on function public.mark_account_deletion_completed(uuid) to service_role;
