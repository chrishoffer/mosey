import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from './lib/queryClient';
import { useAuth } from './lib/auth';
import * as api from './data/api';
import type { Child, PackingItem, TimelineEvent, TransitItem } from './types/db';

/** Convenience: the signed-in user's id (= their profile id). */
function useUserId(): string | null {
  return useAuth().session?.user?.id ?? null;
}

// ---- Family ----
export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.profile,
    queryFn: () => api.fetchProfile(userId!),
    enabled: !!userId,
  });
}

export function useChildren() {
  const userId = useUserId();
  return useQuery({ queryKey: qk.children, queryFn: api.fetchChildren, enabled: !!userId });
}

export function useCreateChild() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      birth_year: number | null;
      relation: string | null;
      notes?: string | null;
      color: string;
    }) => api.createChild(userId!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.children }),
  });
}

export function useUpdateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Child> }) => api.updateChild(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.children }),
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteChild(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.children }),
  });
}

// ---- Trips ----
export function useTrips() {
  const userId = useUserId();
  return useQuery({ queryKey: qk.trips, queryFn: api.fetchTrips, enabled: !!userId });
}

export function useTrip(id: string) {
  return useQuery({ queryKey: qk.trip(id), queryFn: () => api.fetchTrip(id), enabled: !!id });
}

export function useTravelers(tripId: string) {
  return useQuery({ queryKey: qk.travelers(tripId), queryFn: () => api.fetchTravelers(tripId), enabled: !!tripId });
}

export function useCreateTrip() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.NewTripInput) => api.createTrip(userId!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trips }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<import('./types/db').Trip> }) =>
      api.updateTrip(id, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.trips });
      qc.invalidateQueries({ queryKey: qk.trip(vars.id) });
    },
  });
}

// ---- Packing ----
export function usePacking(tripId: string) {
  return useQuery({ queryKey: qk.packing(tripId), queryFn: () => api.fetchPacking(tripId), enabled: !!tripId });
}

export function useSetPacked(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_packed }: { id: string; is_packed: boolean }) => api.setPacked(id, is_packed),
    // optimistic toggle — packing is the one flow that must feel instant
    onMutate: async ({ id, is_packed }) => {
      await qc.cancelQueries({ queryKey: qk.packing(tripId) });
      const prev = qc.getQueryData<PackingItem[]>(qk.packing(tripId));
      qc.setQueryData<PackingItem[]>(qk.packing(tripId), (old) =>
        (old ?? []).map((i) => (i.id === id ? { ...i, is_packed } : i)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.packing(tripId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.packing(tripId) }),
  });
}

export function useAddPackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { label: string; category: string; child_id: string | null }) =>
      api.addManualPackingItem(tripId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.packing(tripId) }),
  });
}

export function useDeletePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePackingItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.packing(tripId) }),
  });
}

// ---- Timeline ----
export function useTimeline(tripId: string) {
  return useQuery({ queryKey: qk.timeline(tripId), queryFn: () => api.fetchTimeline(tripId), enabled: !!tripId });
}

export function useSetEventDone(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_done }: { id: string; is_done: boolean }) => api.setEventDone(id, is_done),
    onMutate: async ({ id, is_done }) => {
      await qc.cancelQueries({ queryKey: qk.timeline(tripId) });
      const prev = qc.getQueryData<TimelineEvent[]>(qk.timeline(tripId));
      qc.setQueryData<TimelineEvent[]>(qk.timeline(tripId), (old) =>
        (old ?? []).map((e) => (e.id === id ? { ...e, is_done } : e)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.timeline(tripId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.timeline(tripId) }),
  });
}

// ---- Transit ----
export function useTransit(tripId: string) {
  return useQuery({ queryKey: qk.transit(tripId), queryFn: () => api.fetchTransit(tripId), enabled: !!tripId });
}

export function useSetTransitDone(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_done }: { id: string; is_done: boolean }) => api.setTransitDone(id, is_done),
    onMutate: async ({ id, is_done }) => {
      await qc.cancelQueries({ queryKey: qk.transit(tripId) });
      const prev = qc.getQueryData<TransitItem[]>(qk.transit(tripId));
      qc.setQueryData<TransitItem[]>(qk.transit(tripId), (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, is_done } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.transit(tripId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.transit(tripId) }),
  });
}

// ---- Trip notes ----
export function useTripNote(tripId: string) {
  return useQuery({ queryKey: qk.tripNote(tripId), queryFn: () => api.fetchTripNote(tripId), enabled: !!tripId });
}

export function useSaveTripNote(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { hits: string | null; misses: string | null }) => api.saveTripNote(tripId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tripNote(tripId) }),
  });
}
