-- 0002: Travelers can be anyone (not just kids), and more ways to get there.
-- Safe to run once on an existing project (idempotent where possible).

-- children → "people": birth_year optional (adults skip it), add a relation label.
alter table public.children alter column birth_year drop not null;
alter table public.children add column if not exists relation text;

-- trips: expand transit_mode beyond fly/drive/both.
alter table public.trips drop constraint if exists trips_transit_mode_check;
alter table public.trips add constraint trips_transit_mode_check
  check (transit_mode in ('fly','drive','train','public_transit','both'));
