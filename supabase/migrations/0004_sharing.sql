-- 0004: whole-account sharing with full edit (co-parent).
-- An owner invites someone by email; once that person signs in, they get full
-- read/write access to the owner's entire account (all trips + crew). Security is
-- enforced here in RLS via can_access(owner): true if you ARE the owner, or you are
-- an ACTIVE member of that owner's account.

-- ---------------------------------------------------------------------------
-- account_members: who may act inside whose account
-- ---------------------------------------------------------------------------
create table if not exists public.account_members (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  member_id     uuid references auth.users (id) on delete cascade, -- null until claimed
  invited_email text not null,
  status        text not null default 'pending' check (status in ('pending','active','revoked')),
  created_at    timestamptz not null default now(),
  unique (owner_id, invited_email)
);
create index if not exists account_members_owner_idx on public.account_members (owner_id);
create index if not exists account_members_member_idx on public.account_members (member_id);

alter table public.account_members enable row level security;

-- Owner manages their own invites; an invited member may read their memberships.
drop policy if exists account_members_owner on public.account_members;
create policy account_members_owner on public.account_members
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists account_members_member on public.account_members;
create policy account_members_member on public.account_members
  for select using (member_id = auth.uid());

-- ---------------------------------------------------------------------------
-- can_access(owner): the heart of sharing. SECURITY DEFINER so it can read
-- account_members regardless of that table's RLS, without recursion.
-- ---------------------------------------------------------------------------
create or replace function public.can_access(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    owner = auth.uid()
    or exists (
      select 1 from public.account_members m
      where m.owner_id = owner
        and m.member_id = auth.uid()
        and m.status = 'active'
    );
$$;
grant execute on function public.can_access(uuid) to authenticated;

-- claim_invites(): called by the app after sign-in. Links any pending invites
-- addressed to the caller's email to the caller, activating them.
create or replace function public.claim_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.account_members
     set member_id = auth.uid(), status = 'active'
   where status = 'pending'
     and member_id is null
     and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''));
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on function public.claim_invites() to authenticated;

-- ---------------------------------------------------------------------------
-- Re-point every data policy at can_access(...). Drop old names (granular from
-- 0001 and FOR ALL from 0003) if present, then create one FOR ALL per table.
-- ---------------------------------------------------------------------------

-- profiles: members may READ accessible profiles (to show whose account it is);
-- only the owner may modify their own profile row.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
create policy profiles_select on public.profiles for select using (can_access(id));
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete on public.profiles for delete using (id = auth.uid());

-- children
drop policy if exists children_select on public.children;
drop policy if exists children_insert on public.children;
drop policy if exists children_update on public.children;
drop policy if exists children_delete on public.children;
drop policy if exists children_access on public.children;
create policy children_access on public.children
  for all using (can_access(profile_id)) with check (can_access(profile_id));

-- trips
drop policy if exists trips_select on public.trips;
drop policy if exists trips_insert on public.trips;
drop policy if exists trips_update on public.trips;
drop policy if exists trips_delete on public.trips;
drop policy if exists trips_access on public.trips;
create policy trips_access on public.trips
  for all using (can_access(profile_id)) with check (can_access(profile_id));

-- Helper predicate for child tables: the owning trip must be accessible.
-- trip_travelers (also gate the child on insert)
drop policy if exists trip_travelers_select on public.trip_travelers;
drop policy if exists trip_travelers_insert on public.trip_travelers;
drop policy if exists trip_travelers_delete on public.trip_travelers;
drop policy if exists trip_travelers_access on public.trip_travelers;
create policy trip_travelers_access on public.trip_travelers
  for all
  using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (
    trip_id in (select id from public.trips where can_access(profile_id))
    and child_id in (select id from public.children where can_access(profile_id))
  );

-- packing_items / timeline_events / transit_items / trip_notes / trip_days / logistics_items / home_tasks
drop policy if exists packing_items_select on public.packing_items;
drop policy if exists packing_items_insert on public.packing_items;
drop policy if exists packing_items_update on public.packing_items;
drop policy if exists packing_items_delete on public.packing_items;
drop policy if exists packing_items_access on public.packing_items;
create policy packing_items_access on public.packing_items
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));

drop policy if exists timeline_events_select on public.timeline_events;
drop policy if exists timeline_events_insert on public.timeline_events;
drop policy if exists timeline_events_update on public.timeline_events;
drop policy if exists timeline_events_delete on public.timeline_events;
drop policy if exists timeline_events_access on public.timeline_events;
create policy timeline_events_access on public.timeline_events
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));

drop policy if exists transit_items_select on public.transit_items;
drop policy if exists transit_items_insert on public.transit_items;
drop policy if exists transit_items_update on public.transit_items;
drop policy if exists transit_items_delete on public.transit_items;
drop policy if exists transit_items_access on public.transit_items;
create policy transit_items_access on public.transit_items
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));

drop policy if exists trip_notes_select on public.trip_notes;
drop policy if exists trip_notes_insert on public.trip_notes;
drop policy if exists trip_notes_update on public.trip_notes;
drop policy if exists trip_notes_delete on public.trip_notes;
drop policy if exists trip_notes_access on public.trip_notes;
create policy trip_notes_access on public.trip_notes
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));

drop policy if exists trip_days_all on public.trip_days;
drop policy if exists trip_days_select on public.trip_days;
drop policy if exists trip_days_insert on public.trip_days;
drop policy if exists trip_days_update on public.trip_days;
drop policy if exists trip_days_delete on public.trip_days;
drop policy if exists trip_days_access on public.trip_days;
create policy trip_days_access on public.trip_days
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));

drop policy if exists logistics_items_all on public.logistics_items;
drop policy if exists logistics_items_select on public.logistics_items;
drop policy if exists logistics_items_insert on public.logistics_items;
drop policy if exists logistics_items_update on public.logistics_items;
drop policy if exists logistics_items_delete on public.logistics_items;
drop policy if exists logistics_items_access on public.logistics_items;
create policy logistics_items_access on public.logistics_items
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));

drop policy if exists home_tasks_all on public.home_tasks;
drop policy if exists home_tasks_select on public.home_tasks;
drop policy if exists home_tasks_insert on public.home_tasks;
drop policy if exists home_tasks_update on public.home_tasks;
drop policy if exists home_tasks_delete on public.home_tasks;
drop policy if exists home_tasks_access on public.home_tasks;
create policy home_tasks_access on public.home_tasks
  for all using (trip_id in (select id from public.trips where can_access(profile_id)))
  with check (trip_id in (select id from public.trips where can_access(profile_id)));
