create or replace function public.assert_active_profile(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform 1 from public.profiles where id = p_profile_id and deleted_at is null for key share;
  if not found then raise exception 'account_deleted' using errcode = '42501'; end if;
end;
$$;

create or replace function public.reject_deleted_profile_write()
returns trigger language plpgsql security definer set search_path = public
as $$
declare writer_id uuid;
begin
  writer_id := case TG_TABLE_NAME
    when 'memories' then new.author_profile_id
    when 'memory_contributions' then new.author_profile_id
    else (select author_profile_id from public.memory_contributions where id = new.contribution_id)
  end;
  perform public.assert_active_profile(writer_id);
  return new;
end;
$$;

create or replace function public.reject_tombstone_mutation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.deleted_at is not null then raise exception 'account_deleted' using errcode = '42501'; end if;
  return new;
end;
$$;

drop trigger if exists profiles_reject_tombstone_mutation on public.profiles;
create trigger profiles_reject_tombstone_mutation before update on public.profiles
for each row execute function public.reject_tombstone_mutation();
drop trigger if exists animals_reject_tombstone_mutation on public.animals;
create trigger animals_reject_tombstone_mutation before update on public.animals
for each row execute function public.reject_tombstone_mutation();

drop trigger if exists memories_reject_deleted_author on public.memories;
create trigger memories_reject_deleted_author before insert or update on public.memories
for each row execute function public.reject_deleted_profile_write();
drop trigger if exists memory_contributions_reject_deleted_author on public.memory_contributions;
create trigger memory_contributions_reject_deleted_author before insert or update on public.memory_contributions
for each row execute function public.reject_deleted_profile_write();
drop trigger if exists memory_revisions_reject_deleted_author on public.memory_contribution_revisions;
create trigger memory_revisions_reject_deleted_author before insert or update on public.memory_contribution_revisions
for each row execute function public.reject_deleted_profile_write();
drop trigger if exists memory_photos_reject_deleted_author on public.memory_photos;
create trigger memory_photos_reject_deleted_author before insert or update on public.memory_photos
for each row execute function public.reject_deleted_profile_write();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid() and deleted_at is null);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid() and deleted_at is null) with check (id = auth.uid() and deleted_at is null);
drop policy if exists "animals_select_own" on public.animals;
create policy "animals_select_own" on public.animals for select to authenticated using (profile_id = auth.uid() and deleted_at is null);
drop policy if exists "animals_update_own" on public.animals;
create policy "animals_update_own" on public.animals for update to authenticated using (profile_id = auth.uid() and deleted_at is null) with check (profile_id = auth.uid() and deleted_at is null);
drop policy if exists "memories_select_author_or_active_viewer" on public.memories;
create policy "memories_select_author_or_active_viewer" on public.memories for select to authenticated using (
  (author_profile_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and deleted_at is null))
  or exists (select 1 from public.memory_viewers mv where mv.memory_id = memories.id and mv.profile_id = auth.uid() and mv.access_ended_at is null)
);

create or replace function public.get_account_deletion_status()
returns table(status text) language sql security definer set search_path = public
as $$ select adr.status from public.account_deletion_requests adr where adr.profile_id = auth.uid() $$;
revoke all on function public.assert_active_profile(uuid), public.get_account_deletion_status() from public;
grant execute on function public.assert_active_profile(uuid), public.get_account_deletion_status() to authenticated;
