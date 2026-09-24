alter table public.memory_photos
  add column upload_request_key uuid unique,
  add column mime_type text,
  add column status text not null default 'prepared' check (status in ('prepared','uploaded','deleted'));

create or replace function public.prepare_memory_photo_upload(p_contribution_id uuid, p_request_key uuid, p_mime_type text)
returns table(photo_id uuid, storage_path text) language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); target public.memory_contributions%rowtype; new_id uuid:=extensions.gen_random_uuid();
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 if p_mime_type not in ('image/jpeg','image/png','image/heic','image/heif') then raise exception 'memory_photo_format_invalid' using errcode='P0001'; end if;
 select * into target from public.memory_contributions where id=p_contribution_id and author_profile_id=uid and deleted_at is null for update;
 if not found then raise exception 'memory_photo_forbidden' using errcode='42501'; end if;
 insert into public.memory_photos(id,contribution_id,storage_path,upload_request_key,mime_type,status)
 values(new_id,p_contribution_id,'contributions/'||p_contribution_id::text||'/'||new_id::text||'.jpg',p_request_key,p_mime_type,'prepared')
 on conflict(upload_request_key) do update set upload_request_key=excluded.upload_request_key
 returning id,memory_photos.storage_path into photo_id,storage_path;
 return next;
end; $$;

create or replace function public.complete_memory_photo_upload(p_photo_id uuid)
returns uuid language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid();
begin
 update public.memory_photos mp set status='uploaded' from public.memory_contributions mc
 where mp.id=p_photo_id and mp.contribution_id=mc.id and mc.author_profile_id=uid and mc.deleted_at is null and mp.deleted_at is null;
 if not found then raise exception 'memory_photo_forbidden' using errcode='42501'; end if; return p_photo_id;
end; $$;

create or replace function public.delete_memory_photo(p_photo_id uuid)
returns text language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); target_path text;
begin
 update public.memory_photos mp set deleted_at=clock_timestamp(),status='deleted' from public.memory_contributions mc
 where mp.id=p_photo_id and mp.contribution_id=mc.id and mc.author_profile_id=uid and mp.deleted_at is null
 returning mp.storage_path into target_path;
 if target_path is null then raise exception 'memory_photo_forbidden' using errcode='42501'; end if; return target_path;
end; $$;

create policy "memory_photos_insert_owner" on storage.objects for insert to authenticated with check (
 bucket_id='memory-photos' and exists (select 1 from public.memory_photos mp join public.memory_contributions mc on mc.id=mp.contribution_id where mp.storage_path=name and mp.status='prepared' and mc.author_profile_id=auth.uid())
);
create policy "memory_photos_read_authorized_viewer" on storage.objects for select to authenticated using (
 bucket_id='memory-photos' and exists (
   select 1 from public.memory_photos mp
   join public.memory_contributions mc on mc.id=mp.contribution_id and mc.deleted_at is null
   join public.memory_viewers mv on mv.memory_id=mc.memory_id
   where mp.storage_path=name and mp.status='uploaded' and mp.deleted_at is null and mv.profile_id=auth.uid()
     and (mv.access_ended_at is null or (mv.archive_retained and mp.created_at <= mv.access_ended_at))
 )
);
create policy "memory_photos_delete_owner" on storage.objects for delete to authenticated using (
 bucket_id='memory-photos' and exists (select 1 from public.memory_photos mp join public.memory_contributions mc on mc.id=mp.contribution_id where mp.storage_path=name and mc.author_profile_id=auth.uid())
);
create or replace function public.get_own_memory_contribution(p_memory_id uuid)
returns uuid language sql security definer set search_path=public
as $$ select id from public.memory_contributions where memory_id=p_memory_id and author_profile_id=auth.uid() and deleted_at is null $$;
revoke all on function public.prepare_memory_photo_upload(uuid,uuid,text),public.complete_memory_photo_upload(uuid),public.delete_memory_photo(uuid) from public;
revoke all on function public.get_own_memory_contribution(uuid) from public;
grant execute on function public.prepare_memory_photo_upload(uuid,uuid,text),public.complete_memory_photo_upload(uuid),public.delete_memory_photo(uuid),public.get_own_memory_contribution(uuid) to authenticated;
