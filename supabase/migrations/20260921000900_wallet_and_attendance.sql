create table if not exists public.coin_wallets (
  profile_id uuid primary key references public.profiles(id) on delete restrict,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.coin_transactions (
  id uuid primary key default extensions.gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete restrict,
  amount integer not null, reason text not null, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.attendance_rewards (
  profile_id uuid not null references public.profiles(id) on delete restrict, game_date date not null,
  transaction_id uuid not null references public.coin_transactions(id) on delete restrict,
  primary key (profile_id, game_date)
);
alter table public.coin_wallets enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.attendance_rewards enable row level security;

create or replace function public.claim_attendance_reward()
returns table (balance integer, game_date date, granted boolean)
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); kst_date date := (timezone('Asia/Seoul', now()))::date; reward integer; tx uuid;
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 select value::text::integer into reward from public.app_settings where key='attendance_daily_reward';
 if reward <> 100 then raise exception 'invalid_attendance_reward_setting' using errcode='P0001'; end if;
 insert into public.coin_wallets(profile_id) values(uid) on conflict(profile_id) do nothing;
 perform 1 from public.coin_wallets where profile_id=uid for update;
 select transaction_id into tx from public.attendance_rewards where profile_id=uid and game_date=kst_date;
 if found then return query select w.balance,kst_date,false from public.coin_wallets w where w.profile_id=uid; return; end if;
 insert into public.coin_transactions(profile_id,amount,reason) values(uid,reward,'attendance') returning id into tx;
 insert into public.attendance_rewards(profile_id,game_date,transaction_id) values(uid,kst_date,tx);
 update public.coin_wallets set balance=balance+reward,updated_at=timezone('utc',now()) where profile_id=uid;
 return query select w.balance,kst_date,true from public.coin_wallets w where w.profile_id=uid;
end; $$;
revoke all on table public.coin_wallets,public.coin_transactions,public.attendance_rewards from anon,authenticated;
revoke all on function public.claim_attendance_reward() from public;
grant execute on function public.claim_attendance_reward() to authenticated;
