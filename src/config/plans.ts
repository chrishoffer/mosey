// Mosey pricing tiers — single source of truth for the paywall and feature gates.
// Defined by Chris (2026-10-13). Payments are stubbed until RevenueCat wires up;
// "purchasing" in the preview just sets the local entitlement.

export type PlanId = 'free' | 'trip_pass' | 'family';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceNote?: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    tagline: 'Plan your first trip, end to end.',
    features: [
      'Search, agenda & stays ranked by Kid-fit',
      'Plan one trip',
      'Explore things to do',
      'Map & directions',
      'Booking through partners',
    ],
  },
  {
    id: 'trip_pass',
    name: 'Trip Pass',
    price: '$9.99',
    priceNote: 'per trip',
    tagline: 'Everything in Family, for a single trip. Built for the once-a-year vacation family.',
    features: [
      'Everything in the Family plan',
      'For one trip, start to finish',
    ],
  },
  {
    id: 'family',
    name: 'Family plan',
    price: '$49.99/yr',
    priceNote: 'or $6.99/mo',
    tagline: 'Mosey holds every trip, all year.',
    highlight: true,
    features: [
      'Unlimited trips',
      'The in-trip agent (Meltdown, Raining, Hungry, Late)',
      'Mosey reads your booking confirmations',
      'Smart packing that learns your family',
      'Shared editing for both parents',
      'Offline access',
    ],
  },
];

/** Feature gates, by plan. Trip Pass unlocks family features for its one trip. */
export const FREE_TRIP_LIMIT = 1;

/** The bundled Gatlinburg sample is a demo, not the user's trip — it never
 *  counts against the free limit, so a free family still gets one REAL trip. */
export const SAMPLE_TRIP_ID = '1';

export function countBillableTrips(trips: { id: string }[]): number {
  return trips.filter((t) => t.id !== SAMPLE_TRIP_ID).length;
}

export function canUseAgent(plan: PlanId): boolean {
  return plan === 'family' || plan === 'trip_pass';
}

export function canCreateAnotherTrip(plan: PlanId, billableTripCount: number): boolean {
  if (plan === 'family') return true;
  return billableTripCount < FREE_TRIP_LIMIT;
}
