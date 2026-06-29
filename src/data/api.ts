import { supabase } from '../lib/supabase';
import type {
  AccountMember,
  Child,
  HomeTask,
  LogisticsItem,
  LogisticsKind,
  PackingItem,
  Profile,
  TimelineEvent,
  TransitItem,
  Trip,
  TripDay,
  TripNote,
} from '../types/db';
import { generateTimeline } from './timeline';
import { defaultHomeTasks } from './homeChecklist';
import { differenceInCalendarDays, parseISO } from 'date-fns';

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
export async function fetchChildren(accountId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('profile_id', accountId)
    .order('created_at', { ascending: true });
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
export async function fetchTrips(accountId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('profile_id', accountId)
    .order('start_date', { ascending: true });
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

  // Seed the leaving-home checklist (deterministic defaults).
  let tripDays = 1;
  try {
    const n = differenceInCalendarDays(parseISO(trip.end_date), parseISO(trip.start_date));
    tripDays = Number.isFinite(n) ? Math.max(1, n + 1) : 1;
  } catch {
    tripDays = 1;
  }
  const homeRows = defaultHomeTasks({ tripDays, transitMode: trip.transit_mode }).map((label) => ({
    trip_id: trip.id,
    label,
    is_done: false,
    source: 'default' as const,
  }));
  if (homeRows.length) {
    const { error: htErr } = await supabase.from('home_tasks').insert(homeRows);
    if (htErr) throw htErr;
  }

  return trip;
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<void> {
  const { error } = await supabase.from('trips').update(patch).eq('id', id);
  if (error) throw error;
}

export async function addTraveler(tripId: string, childId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_travelers')
    .insert({ trip_id: tripId, child_id: childId });
  if (error) throw error;
}

export async function removeTraveler(tripId: string, childId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_travelers')
    .delete()
    .eq('trip_id', tripId)
    .eq('child_id', childId);
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

export async function deleteTransitItem(id: string): Promise<void> {
  const { error } = await supabase.from('transit_items').delete().eq('id', id);
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

// ---- Day plan ----
export async function fetchDays(tripId: string): Promise<TripDay[]> {
  const { data, error } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- Logistics ----
export async function fetchLogistics(tripId: string): Promise<LogisticsItem[]> {
  const { data, error } = await supabase
    .from('logistics_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addLogistics(
  tripId: string,
  input: { kind: LogisticsKind; label: string; detail: string | null },
): Promise<LogisticsItem> {
  const { data, error } = await supabase
    .from('logistics_items')
    .insert({ trip_id: tripId, ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLogistics(id: string): Promise<void> {
  const { error } = await supabase.from('logistics_items').delete().eq('id', id);
  if (error) throw error;
}

// ---- Home tasks ----
export async function fetchHomeTasks(tripId: string): Promise<HomeTask[]> {
  const { data, error } = await supabase
    .from('home_tasks')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function setHomeTaskDone(id: string, is_done: boolean): Promise<void> {
  const { error } = await supabase.from('home_tasks').update({ is_done }).eq('id', id);
  if (error) throw error;
}

export async function addHomeTask(tripId: string, label: string): Promise<HomeTask> {
  const { data, error } = await supabase
    .from('home_tasks')
    .insert({ trip_id: tripId, label, is_done: false, source: 'manual' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHomeTask(id: string): Promise<void> {
  const { error } = await supabase.from('home_tasks').delete().eq('id', id);
  if (error) throw error;
}

// ---- Sharing (invites into MY account) ----
export async function fetchSentInvites(ownerId: string): Promise<AccountMember[]> {
  const { data, error } = await supabase
    .from('account_members')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function inviteMember(ownerId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('account_members')
    .upsert(
      { owner_id: ownerId, invited_email: email.trim().toLowerCase(), status: 'pending', member_id: null },
      { onConflict: 'owner_id,invited_email' },
    );
  if (error) throw error;
}

export async function revokeInvite(id: string): Promise<void> {
  const { error } = await supabase.from('account_members').delete().eq('id', id);
  if (error) throw error;
}
