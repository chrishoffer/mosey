/**
 * RevenueCat scaffold (§7.9). v1 ships FREE behind a stubbed paywall: this module
 * is the single seam where react-native-purchases plugs in later. We deliberately
 * do NOT bundle the native SDK yet (it needs a dev build), so nothing here touches
 * a real store — `isPro` is always true in v1, and the paywall is informational.
 *
 * To go live: add `react-native-purchases`, implement these four functions against
 * Purchases.*, and gate premium features on `useEntitlement().isPro`.
 */

export interface Entitlement {
  isPro: boolean;
  source: 'stub' | 'revenuecat';
}

const PLUS_FEATURES = [
  'Unlimited trips on your shelf',
  'AI packing lists & transit kits for every trip',
  'Proactive timeline nudges',
  'Post-trip memory that makes the next trip smarter',
];

export function getPlusFeatures(): string[] {
  return PLUS_FEATURES;
}

/** v1: everyone is "Pro". Swap for a Purchases.getCustomerInfo() check later. */
export async function getEntitlement(): Promise<Entitlement> {
  return { isPro: true, source: 'stub' };
}

/** Stubbed purchase — no store call in v1. Returns success so flows can be wired. */
export async function purchasePlus(): Promise<{ ok: boolean; message: string }> {
  return {
    ok: true,
    message: 'Mosey is free during v1 — you already have everything. Thanks for being early.',
  };
}

export async function restorePurchases(): Promise<{ ok: boolean }> {
  return { ok: true };
}
