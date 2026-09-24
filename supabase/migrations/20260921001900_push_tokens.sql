create table public.push_tokens (id uuid primary key default extensions.gen_random_uuid(),profile_id uuid not null references public.profiles(id) on delete cascade,token text not null unique,platform text not null,active boolean not null default true,updated_at timestamptz not null default clock_timestamp());
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon,authenticated;
create or replace function public.upsert_push_token(p_token text,p_platform text) returns uuid language plpgsql security definer set search_path=public as $$ declare uid uuid:=auth.uid(); result uuid;
begin if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 update public.push_tokens set active=false,updated_at=clock_timestamp() where token=p_token and profile_id<>uid;
 insert into public.push_tokens(profile_id,token,platform,active) values(uid,p_token,p_platform,true) on conflict(token) do update set profile_id=excluded.profile_id,platform=excluded.platform,active=true,updated_at=clock_timestamp() returning id into result; return result; end $$;
create or replace function public.deactivate_my_push_tokens() returns void language sql security definer set search_path=public as $$ update public.push_tokens set active=false,updated_at=clock_timestamp() where profile_id=auth.uid() $$;
revoke all on function public.upsert_push_token(text,text),public.deactivate_my_push_tokens() from public; grant execute on function public.upsert_push_token(text,text),public.deactivate_my_push_tokens() to authenticated;
