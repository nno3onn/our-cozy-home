-- Private originals only. Memory viewer grants are added with the memories schema.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-photos', 'memory-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

-- No storage.objects policy is intentionally created here: anon and authenticated
-- clients cannot list, read, insert, update, or delete until a memory viewer grant
-- is present. Photo lifecycle migration adds narrowly scoped policies/RPCs.
