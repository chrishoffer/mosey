import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Centralized query keys so invalidation stays consistent across screens. */
export const qk = {
  profile: ['profile'] as const,
  children: ['children'] as const,
  trips: ['trips'] as const,
  trip: (id: string) => ['trip', id] as const,
  packing: (tripId: string) => ['packing', tripId] as const,
  timeline: (tripId: string) => ['timeline', tripId] as const,
  transit: (tripId: string) => ['transit', tripId] as const,
  travelers: (tripId: string) => ['travelers', tripId] as const,
  tripNote: (tripId: string) => ['tripNote', tripId] as const,
  days: (tripId: string) => ['days', tripId] as const,
  logistics: (tripId: string) => ['logistics', tripId] as const,
  homeTasks: (tripId: string) => ['homeTasks', tripId] as const,
};
