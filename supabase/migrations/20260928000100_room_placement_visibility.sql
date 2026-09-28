-- A room member needs the definition and owner of furniture that is currently
-- displayed in their shared room. The SECURITY DEFINER helper avoids a
-- room_placements <-> owned_items RLS policy recursion and preserves the
-- memory viewer snapshot boundary for memory furniture.
create or replace function public.is_active_house_placed_item(p_owned_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_placements placement
    join public.owned_items item on item.id = placement.owned_item_id
    where placement.owned_item_id = p_owned_item_id
      and public.is_active_house_member(placement.house_id)
      and (
        item.memory_id is null
        or exists (
          select 1
          from public.memory_viewers viewer
          where viewer.memory_id = item.memory_id
            and viewer.profile_id = auth.uid()
            and viewer.access_ended_at is null
        )
      )
  );
$$;

revoke all on function public.is_active_house_placed_item(uuid) from public;
grant execute on function public.is_active_house_placed_item(uuid) to authenticated;

create policy "owned_items_select_active_house_placement" on public.owned_items
for select to authenticated
using (
  public.is_active_house_placed_item(id)
);
