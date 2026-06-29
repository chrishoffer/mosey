-- 0003: day-by-day flow plan, trip logistics pocket, and the leaving-home checklist.
-- RLS on every table, scoped to the owning trip (same pattern as 0001).

-- ---------------------------------------------------------------------------
-- trip_days  (AI-generated gentle daily rhythm; generic, no real places)
-- ---------------------------------------------------------------------------
create table if not exists public.trip_days (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  day_index  integer not null,
  date       date not null,
  title      text not null,
  morning    text,
  afternoon  text,
  evening    text,
  created_at timestamptz not null default now()
);
create index if not exists trip_days_trip_id_idx on public.trip_days (trip_id);

-- ---------------------------------------------------------------------------
-- logistics_items  (confirmation #s, flight/check-in times, lodging, contacts)
-- ---------------------------------------------------------------------------
create table if not exists public.logistics_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  kind       text not null check (kind in ('lodging','flight','ground','reservation','confirmation','contact','other')),
  label      text not null,
  detail     text,
  created_at timestamptz not null default now()
);
create index if not exists logistics_items_trip_id_idx on public.logistics_items (trip_id);

-- ---------------------------------------------------------------------------
-- home_tasks  (leaving-home checklist: mail, pets, thermostat…)
-- ---------------------------------------------------------------------------
create table if not exists public.home_tasks (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  label      text not null,
  is_done    boolean not null default false,
  source     text not null check (source in ('default','manual')),
  created_at timestamptz not null default now()
);
create index if not exists home_tasks_trip_id_idx on public.home_tasks (trip_id);

-- RLS
alter table public.trip_days       enable row level security;
alter table public.logistics_items enable row level security;
alter table public.home_tasks      enable row level security;

-- trip_days policies
create policy trip_days_select on public.trip_days
  for select using (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy trip_days_insert on public.trip_days
  for insert with check (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy trip_days_update on public.trip_days
  for update using (trip_id in (select id from public.trips where profile_id = auth.uid()))
  with check (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy trip_days_delete on public.trip_days
  for delete using (trip_id in (select id from public.trips where profile_id = auth.uid()));

-- logistics_items policies
create policy logistics_items_select on public.logistics_items
  for select using (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy logistics_items_insert on public.logistics_items
  for insert with check (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy logistics_items_update on public.logistics_items
  for update using (trip_id in (select id from public.trips where profile_id = auth.uid()))
  with check (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy logistics_items_delete on public.logistics_items
  for delete using (trip_id in (select id from public.trips where profile_id = auth.uid()));

-- home_tasks policies
create policy home_tasks_select on public.home_tasks
  for select using (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy home_tasks_insert on public.home_tasks
  for insert with check (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy home_tasks_update on public.home_tasks
  for update using (trip_id in (select id from public.trips where profile_id = auth.uid()))
  with check (trip_id in (select id from public.trips where profile_id = auth.uid()));
create policy home_tasks_delete on public.home_tasks
  for delete using (trip_id in (select id from public.trips where profile_id = auth.uid()));
