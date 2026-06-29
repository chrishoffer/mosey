import { differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import type { TimelineKind, TransitMode, TripType } from '../types/db';

/**
 * Deterministic timeline / nudge generator (§6). We generate this from facts
 * (start_date + transit_mode + trip shape) rather than asking the model, because
 * dates and lead times must be reliable, not creative. The model is great at
 * "what to pack"; arithmetic on calendars it should not be trusted with.
 *
 * Pure and side-effect free so it can be unit-tested and reused server-side.
 */

export interface TimelineSeed {
  title: string;
  body: string;
  lead_days: number; // days before start_date this fires
  kind: TimelineKind;
  /** ISO timestamp (09:00 local on the fire day), or null if it can't be dated. */
  notify_at: string | null;
}

export interface TimelineInput {
  startDate: string; // yyyy-mm-dd
  endDate: string;
  transitMode: TransitMode;
  tripType: TripType;
  hasKids: boolean;
}

const flies = (m: TransitMode) => m === 'fly' || m === 'both';
const drives = (m: TransitMode) => m === 'drive' || m === 'both';
/** Any mode where "download before you lose signal" is worth a nudge. */
const longHaul = (m: TransitMode) => m === 'fly' || m === 'train' || m === 'public_transit' || m === 'both';

/** 09:00 local on (startDate - leadDays). */
function fireAt(startDate: string, leadDays: number): string | null {
  try {
    const start = parseISO(startDate);
    if (Number.isNaN(start.getTime())) return null;
    const day = subDays(start, leadDays);
    day.setHours(9, 0, 0, 0);
    return day.toISOString();
  } catch {
    return null;
  }
}

export function generateTimeline(input: TimelineInput): TimelineSeed[] {
  const { startDate, endDate, transitMode, tripType, hasKids } = input;
  const seeds: Array<Omit<TimelineSeed, 'notify_at'>> = [];

  const tripDays = (() => {
    try {
      const n = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
      return Number.isFinite(n) ? Math.max(1, n + 1) : 1;
    } catch {
      return 1;
    }
  })();

  // --- Far-out milestones ---
  if (flies(transitMode)) {
    seeds.push({
      kind: 'milestone',
      lead_days: 84,
      title: 'Check passports & IDs',
      body: 'If this trip is international, make sure every passport is valid for 6+ months past your return — renewals can take 10–12 weeks. Domestic? Confirm each adult ID.',
    });
  }

  seeds.push({
    kind: 'milestone',
    lead_days: 21,
    title: 'Confirm the essentials',
    body: 'Double-check reservations, transport, and anything that needs a deposit or a booking window. Note check-in times.',
  });

  // --- Packing arc ---
  seeds.push({
    kind: 'nudge',
    lead_days: 14,
    title: 'Start your packing list',
    body: 'Open your Mosey packing list and skim it. Anything you need to buy or wash? Two weeks out is the calm time to notice.',
  });

  if (hasKids) {
    seeds.push({
      kind: 'nudge',
      lead_days: 7,
      title: 'Refill meds & restock the kit',
      body: 'Refill any prescriptions, restock kids’ meds (fever, allergy, motion), and set aside a small first-aid pouch.',
    });
  }

  seeds.push({
    kind: 'nudge',
    lead_days: 10,
    title: 'Pack the non-clothes first',
    body: 'Knock out chargers, toiletries, documents, and gear now while you have time. Clothes are the easy last step.',
  });

  // --- Transit prep ---
  if (longHaul(transitMode) || (drives(transitMode) && tripDays >= 2)) {
    seeds.push({
      kind: 'nudge',
      lead_days: 3,
      title: 'Download before you lose wifi',
      body: 'Load shows, playlists, games, and offline maps onto every device now — not at the gate. Check your Getting There kit.',
    });
  }

  seeds.push({
    kind: 'nudge',
    lead_days: 1,
    title: 'Charge everything & stage the bags',
    body: 'Charge tablets and battery packs tonight, pack carry-on snacks and entertainment, and put one bag by the door per kid.',
  });

  // --- Day of ---
  seeds.push({
    kind: 'milestone',
    lead_days: 0,
    title: 'Travel day',
    body: hasKids
      ? 'Snacks within reach, one job per kid, and a slow breath. You planned this — Mosey’s got the list.'
      : 'Snacks within reach and a slow breath. You planned this — Mosey’s got the list.',
  });

  return seeds
    .sort((a, b) => b.lead_days - a.lead_days)
    .map((s) => ({ ...s, notify_at: fireAt(startDate, s.lead_days) }));
}
