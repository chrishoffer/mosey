import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlanId } from '../config/plans';

/**
 * Entitlements — PREVIEW billing. The paywall "purchase" buttons set the local
 * plan so gates behave exactly as they will in production; RevenueCat replaces
 * the setter later. Never treat this as real payment state.
 */
interface EntitlementsState {
  plan: PlanId;
  setPlan: (plan: PlanId) => void;
}

export const useEntitlements = create<EntitlementsState>()(
  persist(
    (set) => ({
      plan: 'free',
      setPlan: (plan) => set({ plan }),
    }),
    { name: 'mosey.entitlements', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
