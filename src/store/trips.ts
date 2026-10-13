import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trip as sampleTrip, type Trip } from '../mock/data';

/**
 * Trips store — the dashboard's list of trips. Seeded with the Gatlinburg sample.
 * NOTE (phases 1–2): per-trip content (days, packing, stays…) still renders the
 * shared sample data for every trip; phase 3 moves trips + content to Supabase.
 */
interface TripsState {
  trips: Trip[];
  addTrip: (t: Omit<Trip, 'id'>) => string;
  removeTrip: (id: string) => void;
}

export const useTrips = create<TripsState>()(
  persist(
    (set) => ({
      trips: [sampleTrip],
      addTrip: (t) => {
        const id = `t${Date.now()}`;
        set((s) => ({ trips: [...s.trips, { ...t, id }] }));
        return id;
      },
      removeTrip: (id) => set((s) => ({ trips: s.trips.filter((x) => x.id !== id) })),
    }),
    { name: 'mosey.trips', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
