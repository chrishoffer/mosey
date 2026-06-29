-- 0005: richer trip context for sharper AI recommendations.
-- Optional fields collected in the questionnaire and fed into every generation
-- prompt (packing, transit kit, day plan, Ask Mosey).

alter table public.trips add column if not exists lodging text;
alter table public.trips add column if not exists activities text[];
alter table public.trips add column if not exists extra_notes text;
