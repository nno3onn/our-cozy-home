-- 우리집의 모든 도메인 migration은 이 파일 뒤에 추가 전용으로 작성한다.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.house_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.membership_status as enum ('active', 'left');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.house_member_role as enum ('admin', 'member');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.animal_species as enum ('rabbit', 'bear', 'cat');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.animal_state as enum ('idle', 'eating', 'resting', 'playing', 'reacting');
exception
  when duplicate_object then null;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint app_settings_key_not_blank check (btrim(key) <> '')
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  point_color text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_not_blank check (btrim(display_name) <> ''),
  constraint profiles_point_color_not_blank check (btrim(point_color) <> '')
);

create table if not exists public.houses (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  status public.house_status not null default 'active',
  admin_profile_id uuid references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint houses_name_not_blank check (btrim(name) <> ''),
  constraint houses_archive_timestamp_matches_status check (
    (status = 'active' and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create table if not exists public.house_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  house_id uuid not null references public.houses (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  role public.house_member_role not null default 'member',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint house_memberships_left_timestamp_matches_status check (
    (status = 'active' and left_at is null)
    or (status = 'left' and left_at is not null)
  )
);

create unique index if not exists one_active_house_membership_per_profile
  on public.house_memberships (profile_id)
  where status = 'active';

create index if not exists house_memberships_active_house_joined_at_idx
  on public.house_memberships (house_id, joined_at, id)
  where status = 'active';

create table if not exists public.animals (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  species public.animal_species not null,
  state public.animal_state not null default 'idle',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint animals_name_not_blank check (btrim(name) <> '')
);

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists houses_set_updated_at on public.houses;
create trigger houses_set_updated_at
before update on public.houses
for each row execute function public.set_updated_at();

drop trigger if exists house_memberships_set_updated_at on public.house_memberships;
create trigger house_memberships_set_updated_at
before update on public.house_memberships
for each row execute function public.set_updated_at();

drop trigger if exists animals_set_updated_at on public.animals;
create trigger animals_set_updated_at
before update on public.animals
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.house_memberships enable row level security;
alter table public.animals enable row level security;
