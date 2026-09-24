create table public.habit_definitions (id text primary key, name_ko text not null, active boolean not null default true);
insert into public.habit_definitions(id,name_ko) values ('dance','빙글빙글 춤'),('photo-pose','사진 포즈') on conflict(id) do nothing;
create table public.habit_learning (
 id uuid primary key default extensions.gen_random_uuid(), learner_animal_id uuid not null references public.animals(id), teacher_animal_id uuid not null references public.animals(id), habit_id text not null references public.habit_definitions(id), status text not null default 'learning' check(status in('learning','learned','ended')), started_at timestamptz not null default clock_timestamp(), ended_at timestamptz,
);
create unique index active_habit_learning_once on public.habit_learning(learner_animal_id,habit_id) where status='learning';
create table public.habit_learning_days (learning_id uuid not null references public.habit_learning(id) on delete cascade, game_date date not null, primary key(learning_id,game_date));
create table public.habit_learning_participants (learning_id uuid not null references public.habit_learning(id) on delete cascade, game_date date not null, profile_id uuid not null references public.profiles(id), primary key(learning_id,game_date,profile_id));
create table public.learned_habits (animal_id uuid not null references public.animals(id),habit_id text not null references public.habit_definitions(id),teacher_animal_id uuid not null references public.animals(id),learned_at timestamptz not null default clock_timestamp(),primary key(animal_id,habit_id));
alter table public.habit_learning enable row level security; alter table public.habit_learning_days enable row level security; alter table public.habit_learning_participants enable row level security; alter table public.learned_habits enable row level security;
revoke all on public.habit_learning,public.habit_learning_days,public.habit_learning_participants,public.learned_habits from anon,authenticated;

create or replace function public.start_habit_learning(p_learner uuid,p_teacher uuid,p_habit_id text) returns uuid language plpgsql security definer set search_path=public as $$ declare uid uuid:=auth.uid(); lid uuid;
begin
 if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
 if exists(select 1 from public.learned_habits where animal_id=p_learner and habit_id=p_habit_id) then raise exception 'habit_already_learned' using errcode='P0001'; end if;
 if not exists(select 1 from public.animals a join public.house_memberships hm on hm.profile_id=a.profile_id and hm.status='active' where a.id=p_learner and a.profile_id=uid) then raise exception 'learner_forbidden' using errcode='42501'; end if;
 if not exists(select 1 from public.animals t join public.house_memberships tm on tm.profile_id=t.profile_id and tm.status='active' join public.house_memberships lm on lm.house_id=tm.house_id and lm.status='active' where t.id=p_teacher and lm.profile_id=uid) then raise exception 'teacher_not_in_house' using errcode='42501'; end if;
 insert into public.habit_learning(learner_animal_id,teacher_animal_id,habit_id) values(p_learner,p_teacher,p_habit_id) on conflict(learner_animal_id,habit_id) where status='learning' do update set teacher_animal_id=excluded.teacher_animal_id returning id into lid; return lid;
end $$;

create or replace function public.record_habit_activity(p_learning_id uuid) returns table(days integer,status text) language plpgsql security definer set search_path=public as $$ declare uid uuid:=auth.uid(); l public.habit_learning%rowtype; d date:=((clock_timestamp() at time zone 'Asia/Seoul')::date); count_days integer;
begin
 select * into l from public.habit_learning where id=p_learning_id and status='learning' for update; if not found then raise exception 'learning_not_active' using errcode='42501'; end if;
 if not exists(select 1 from public.animals where id=l.learner_animal_id and profile_id=uid) and not exists(select 1 from public.animals where id=l.teacher_animal_id and profile_id=uid) then raise exception 'activity_forbidden' using errcode='42501'; end if;
 insert into public.habit_learning_participants(learning_id,game_date,profile_id) values(l.id,d,uid) on conflict do nothing;
 insert into public.habit_learning_days(learning_id,game_date)
 select l.id,d where (select count(distinct p.profile_id) from public.habit_learning_participants p where p.learning_id=l.id and p.game_date=d)>=2 on conflict do nothing;
 select count(*) into count_days from public.habit_learning_days where learning_id=l.id;
 if count_days>=3 then insert into public.learned_habits(animal_id,habit_id,teacher_animal_id) values(l.learner_animal_id,l.habit_id,l.teacher_animal_id) on conflict do nothing; update public.habit_learning set status='learned',ended_at=clock_timestamp() where id=l.id; end if;
 return query select least(count_days,3),case when count_days>=3 then 'learned' else 'learning' end;
end $$;
revoke all on function public.start_habit_learning(uuid,uuid,text),public.record_habit_activity(uuid) from public; grant execute on function public.start_habit_learning(uuid,uuid,text),public.record_habit_activity(uuid) to authenticated;
create or replace function public.end_departed_habit_learning() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.status='active' and new.status='left' then
   update public.habit_learning hl set status='ended',ended_at=clock_timestamp()
   from public.animals teacher where hl.teacher_animal_id=teacher.id and teacher.profile_id=old.profile_id and hl.status='learning';
 end if; return new;
end $$;
create trigger end_departed_habit_learning after update of status on public.house_memberships for each row execute function public.end_departed_habit_learning();
