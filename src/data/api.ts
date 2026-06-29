import { supabase } from '../lib/supabase';
import type {
  Child,
  PackingItem,
  Profile,
  TimelineEvent,
  TransitItem,
  Trip,
  TripNote,
} from '../types/db';
import { generateTimeline } from './timeline';

/**
 * Plain data-access functions over Supabase. RLS enforces that the user only ever
 * touches their own rows, so these don't re-filter by profile_id on reads — the
 * database does. Writes set profile_id explicitly because RLS checks it on insert.
 */

// ---- Profile ----
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId);
  if (error) throw error;
}

// ---- Children ----
export async function fetchChildren(): Promise<Child[]> {
  const { data, error } = await supabase.from('children').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createChild(
  profileId: string,
  input: {
    name: string;
    birth_year: number | null;
    relation: string | null;
    notes?: string | null;
    color: string;
  },
): Promise<Child> {
  const { data, error } = await supabase
    .from('children')
    .insert({ profile_id: profileId, ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateChild(id: string, patch: Partial<Child>): Promise<void> {
  const { error } = await supabase.from('children').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteChild(id: string): Promise<void> {
  const { error } = await supabase.from('children').delete().eq('id', id);
  if (error) throw error;
}

// ---- Trips ----
export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from('trips').select('*').order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface NewTripInput {
  name: string;
  destination: string;
  trip_type: Trip['trip_type'];
  transit_mode: Trip['transit_mode'];
  start_date: string;
  end_date: string;
  pace: Trip['pace'];
  hard_nos: string | null;
  accent_color: string;
  childIds: string[];
  hasKids: boolean;
}

/** Creates a trip, attaches travelers, and seeds the deterministic timeline. */
export async function createTrip(profileId: string, input: NewTripInput): Promise<Trip> {
  const { childIds, hasKids, ...tripFields } = input;
  const { data: trip, error } = await supabase
    .from('trips')
    .insert({ profile_id: profileId, status: 'planning', ...tripFields })
    .select('*')
    .single();
  if (error) throw error;

  if (childIds.length) {
    const rows = childIds.map((child_id) => ({ trip_id: trip.id, child_id }));
    const { error: tErr } = await supabase.from('trip_travelers').insert(rows);
    if (tErr) throw tErr;
  }

  // Seed timeline deterministically (more reliable than the model for dates).
  const seeds = generateTimeline({
    startDate: trip.start_date,
    endDate: trip.end_date,
    transitMode: trip.transit_mode,
    tripType: trip.trip_type,
    hasKids,
  });
  if (seeds.length) {
    const rows = seeds.map((s) => ({ trip_id: trip.id, ...s }));
    const { error: evErr } = await supabase.from('timeline_events').insert(rows);
    if (evErr) throw evErr;
  }

  return trip;
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<void> {
  const { error } = await supabase.from('trips').update(patch).eq('id', id);
  if (error) throw error;
}

export async function fetchTravelers(tripId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .select('child:children(*)')
    .eq('trip_id', tripId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.child).filter(Boolean) as Child[];
}

// ---- Packing ----
export async function fetchPacking(tripId: string): Promise<PackingItem[]> {
  const { data, error } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function setPacked(id: string, is_packed: boolean): Promise<void> {
  const { error } = await supabase.from('packing_items').update({ is_packed }).eq('id', id);
  if (error) throw error;
}

export async function addManualPackingItem(
  tripId: string,
  input: { label: string; category: string; child_id: string | null },
): Promise<PackingItem> {
  const { data, error } = await supabase
    .from('packing_items')
    .insert({ trip_id: tripId, source: 'manual', is_packed: false, ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePackingItem(id: string): Promise<void> {
  const { error } = await supabase.from('packing_items').delete().eq('id', id);
  if (error) throw error;
}

// ---- Timeline ----
export async function fetchTimeline(tripId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('trip_id', tripId)
    .order('lead_days', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setEventDone(id: string, is_done: boolean): Promise<void> {
  const { error } = await supabase.from('timeline_events').update({ is_done }).eq('id', id);
  if (error) throw error;
}

// ---- Transit ----
export async function fetchTransit(tripId: string): Promise<TransitItem[]> {
  const { data, error } = await supabase
    .from('transit_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function setTransitDone(id: string, is_done: boolean): Promise<void> {
  const { error } = await supabase.from('transit_items').update({ is_done }).eq('id', id);
  if (error) throw error;
}

// ---- Trip notes ----
export async function fetchTripNote(tripId: string): Promise<TripNote | null> {
  const { data, error } = await supabase
    .from('trip_notes')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveTripNote(
  tripId: string,
  input: { hits: string | null; misses: string | null },
): Promise<void> {
  const { error } = await supabase.from('trip_notes').insert({ trip_id: tripId, ...input });
  if (error) throw error;
}
