-- Mosey — initial schema (§4)
-- Mirrors src/types/db.ts EXACTLY. Every table has RLS enabled with owner-scoped
-- policies: a user only ever sees rows tied to their own profile_id (= auth.uid()).
-- Child tables scope ownership via a subquery up to trips/children.

-- gen_random_uuid() lives in pgcrypto on older Postgres; Supabase ships it, but be safe.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users; id = auth user id)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
create table public.children (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  birth_year integer not null, -- derive age; never store a stale int
  notes      text,             -- fears / food / quirks
  color      text not null,
  created_at timestamptz not null default now()
);
create index children_profile_id_idx on public.children (profile_id);

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table public.trips (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  destination  text not null,
  trip_type    text not null check (trip_type in ('cruise','resort','road_trip','city','other')),
  transit_mode text not null check (transit_mode in ('fly','drive','both')),
  start_date   date not null, -- ISO date (yyyy-mm-dd)
  end_date     date not null,
  pace         text not null check (pace in ('chill','balanced','packed')),
  hard_nos     text,
  accent_color text not null, -- AccentKey from theme
  status       text not null check (status in ('planning','active','archived')),
  created_at   timestamptz not null default now()
);
create index trips_profile_id_idx on public.trips (profile_id);

-- ---------------------------------------------------------------------------
-- trip_travelers  (join: which children are on which trip)
-- ---------------------------------------------------------------------------
create table public.trip_travelers (
  trip_id  uuid not null references public.trips (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (trip_id, child_id)
);
create index trip_travelers_trip_id_idx on public.trip_travelers (trip_id);
create index trip_travelers_child_id_idx on public.trip_travelers (child_id);

-- ---------------------------------------------------------------------------
-- packing_items
-- ---------------------------------------------------------------------------
create table public.packing_items (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips (id) on delete cascade,
  child_id     uuid references public.children (id) on delete cascade, -- null = shared
  label        text not null,
  category     text not null,
  reason       text,
  is_packed    boolean not null default false,
  amazon_query text,
  source       text not null check (source in ('ai','manual')),
  created_at   timestamptz not null default now()
);
create index packing_items_trip_id_idx on public.packing_items (trip_id);
create index packing_items_child_id_idx on public.packing_items (child_id);

-- ---------------------------------------------------------------------------
-- timeline_events  (written by the deterministic client generator; §6)
-- ---------------------------------------------------------------------------
create table public.timeline_events (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  title      text not null,
  body       text,
  lead_days  integer not null, -- days before start_date this fires
  kind       text not null check (kind in ('milestone','nudge')),
  is_done    boolean not null default false,
  notify_at  timestamptz,      -- ISO timestamp, or null if it can't be dated
  created_at timestamptz not null default now()
);
create index timeline_events_trip_id_idx on public.timeline_events (trip_id);

-- ---------------------------------------------------------------------------
-- transit_items
-- ---------------------------------------------------------------------------
create table public.transit_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  child_id   uuid references public.children (id) on delete cascade,
  kind       text not null check (kind in ('carryon','download','activity','playlist')),
  label      text not null,
  detail     text,
  is_done    boolean not null default false,
  created_at timestamptz not null default now()
);
create index transit_items_trip_id_idx on public.transit_items (trip_id);
create index transit_items_child_id_idx on public.transit_items (child_id);

-- ---------------------------------------------------------------------------
-- trip_notes  (hits/misses captured after a trip, used as future context)
-- ---------------------------------------------------------------------------
create table public.trip_notes (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  hits       text,
  misses     text,
  created_at timestamptz not null default now()
);
create index trip_notes_trip_id_idx on public.trip_notes (trip_id);

-- ===========================================================================
-- Row Level Security — enabled on EVERY table, owner-scoped.
-- ===========================================================================

alter table public.profiles       enable row level security;
alter table public.children       enable row level security;
alter table public.trips          enable row level security;
alter table public.trip_travelers enable row level security;
alter table public.packing_items  enable row level security;
alter table public.timeline_events enable row level security;
alter table public.transit_items  enable row level security;
alter table public.trip_notes     enable row level security;

-- profiles: a user owns exactly their own row (id = auth.uid()).
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete on public.profiles
  for delete using (id = auth.uid());

-- children: owned via profile_id = auth.uid().
create policy children_select on public.children
  for select using (profile_id = auth.uid());
create policy children_insert on public.children
  for insert with check (profile_id = auth.uid());
create policy children_update on public.children
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy children_delete on public.children
  for delete using (profile_id = auth.uid());

-- trips: owned via profile_id = auth.uid().
create policy trips_select on public.trips
  for select using (profile_id = auth.uid());
create policy trips_insert on public.trips
  for insert with check (profile_id = auth.uid());
create policy trips_update on public.trips
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy trips_delete on public.trips
  for delete using (profile_id = auth.uid());

-- Child tables: scope ownership via a subquery to the owning trip/child.

-- trip_travelers: both the trip and the child must belong to the user.
create policy trip_travelers_select on public.trip_travelers
  for select using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy trip_travelers_insert on public.trip_travelers
  for insert with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
    and child_id in (select id from public.children where profile_id = auth.uid())
  );
create policy trip_travelers_delete on public.trip_travelers
  for delete using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );

-- packing_items: scoped via owning trip.
create policy packing_items_select on public.packing_items
  for select using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy packing_items_insert on public.packing_items
  for insert with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy packing_items_update on public.packing_items
  for update using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  ) with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy packing_items_delete on public.packing_items
  for delete using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );

-- timeline_events: scoped via owning trip.
create policy timeline_events_select on public.timeline_events
  for select using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy timeline_events_insert on public.timeline_events
  for insert with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy timeline_events_update on public.timeline_events
  for update using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  ) with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy timeline_events_delete on public.timeline_events
  for delete using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );

-- transit_items: scoped via owning trip.
create policy transit_items_select on public.transit_items
  for select using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy transit_items_insert on public.transit_items
  for insert with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy transit_items_update on public.transit_items
  for update using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  ) with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy transit_items_delete on public.transit_items
  for delete using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );

-- trip_notes: scoped via owning trip.
create policy trip_notes_select on public.trip_notes
  for select using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy trip_notes_insert on public.trip_notes
  for insert with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy trip_notes_update on public.trip_notes
  for update using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  ) with check (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );
create policy trip_notes_delete on public.trip_notes
  for delete using (
    trip_id in (select id from public.trips where profile_id = auth.uid())
  );

-- ===========================================================================
-- Auto-provision a profile row whenever a new auth user is created.
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
