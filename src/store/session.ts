import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Session store — PREVIEW auth. Holds a local "who am I" so the welcome/signup
 * flow, dashboard greeting, and gates all work end-to-end before phase 3 wires
 * real Supabase Auth (Sign in with Apple + email). Swapping the backend in means
 * replacing signIn/signOut internals; the shape stays.
 */
interface SessionState {
  signedIn: boolean;
  email: string | null;
  name: string | null; // "Hoffer crew" style display name
  hydrated: boolean;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  setHydrated: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      email: null,
      name: null,
      hydrated: false,
      signIn: (email, name) =>
        set({ signedIn: true, email: email.trim().toLowerCase(), name: name?.trim() || null }),
      signOut: () => set({ signedIn: false, email: null, name: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'mosey.session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ signedIn: s.signedIn, email: s.email, name: s.name }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
