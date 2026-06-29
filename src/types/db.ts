/**
 * Domain types mirroring the Supabase schema (§4). Kept hand-written (rather than
 * generated) so the app has a single, readable source of truth. If the schema
 * changes, update both this file and supabase/migrations together.
 */

export type TripType = 'cruise' | 'resort' | 'road_trip' | 'city' | 'other';
export type TransitMode = 'fly' | 'drive' | 'train' | 'public_transit' | 'both';
/** How a traveler relates to the account owner. Free-ish; UI offers presets. */
export type Relation = 'me' | 'partner' | 'child' | 'grandparent' | 'relative' | 'friend' | 'other';
export type Pace = 'chill' | 'balanced' | 'packed';
export type TripStatus = 'planning' | 'active' | 'archived';
export type ItemSource = 'ai' | 'manual';
export type TimelineKind = 'milestone' | 'nudge';
export type TransitKind = 'carryon' | 'download' | 'activity' | 'playlist';

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

/** A traveler in the user's crew — a kid, partner, grandparent, friend, anyone.
 *  (The table is still named `children` for legacy reasons; treat it as "people".)
 *  birth_year is optional: adults can skip it; it's mainly used to tailor kid gear. */
export interface Child {
  id: string;
  profile_id: string;
  name: string;
  birth_year: number | null; // derive age; null = age not relevant (e.g. adults)
  relation: Relation | null; // me / partner / child / friend …
  notes: string | null; // fears / food / quirks / dietary
  color: string;
  created_at: string;
}

export interface Trip {
  id: string;
  profile_id: string;
  name: string;
  destination: string;
  trip_type: TripType;
  transit_mode: TransitMode;
  start_date: string; // ISO date (yyyy-mm-dd)
  end_date: string;
  pace: Pace;
  hard_nos: string | null;
  accent_color: string; // AccentKey from theme
  status: TripStatus;
  created_at: string;
}

export interface TripTraveler {
  trip_id: string;
  child_id: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  child_id: string | null; // null = shared
  label: string;
  category: string;
  reason: string | null;
  is_packed: boolean;
  amazon_query: string | null;
  source: ItemSource;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  trip_id: string;
  title: string;
  body: string | null;
  lead_days: number; // days before start_date this fires
  kind: TimelineKind;
  is_done: boolean;
  notify_at: string | null; // ISO timestamp
  created_at: string;
}

export interface TransitItem {
  id: string;
  trip_id: string;
  child_id: string | null;
  kind: TransitKind;
  label: string;
  detail: string | null;
  is_done: boolean;
  created_at: string;
}

export interface TripNote {
  id: string;
  trip_id: string;
  hits: string | null;
  misses: string | null;
  created_at: string;
}

/** Derived helpers */
export function ageFromBirthYear(birthYear: number | null, today = new Date()): number | null {
  if (birthYear == null) return null;
  return Math.max(0, today.getFullYear() - birthYear);
}

/** A traveler counts as a kid if explicitly relation==='child', or under 18 by age. */
export function isKid(c: Pick<Child, 'relation' | 'birth_year'>, today = new Date()): boolean {
  if (c.relation === 'child') return true;
  const age = ageFromBirthYear(c.birth_year, today);
  return age != null && age < 18;
}

export const RELATION_LABELS: Record<Relation, string> = {
  me: 'Me',
  partner: 'Partner',
  child: 'Kid',
  grandparent: 'Grandparent',
  relative: 'Relative',
  friend: 'Friend',
  other: 'Other',
};

export const TRANSIT_LABELS: Record<TransitMode, string> = {
  fly: 'Flying',
  drive: 'Driving',
  train: 'Train',
  public_transit: 'Public transit',
  both: 'A mix',
};
