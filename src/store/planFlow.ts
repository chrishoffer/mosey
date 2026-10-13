import { create } from 'zustand';

/** Local UI state for the plan flow (search → agenda → stays). Server data will
 *  live in TanStack Query from phase 3; this is deliberately just screen state. */
interface PlanFlowState {
  destination: string;
  dates: string; // display label for now, e.g. "Mar 27 – Apr 1"
  kidAges: number[];
  adults: number;
  pace: 'easy' | 'balanced' | 'packed';
  protectNap: boolean;
  bedtime: string;
  maxDriveMin: number;
  agenda: string[];
  set: (patch: Partial<Omit<PlanFlowState, 'set' | 'toggleAgenda'>>) => void;
  toggleAgenda: (item: string) => void;
}

export const usePlanFlow = create<PlanFlowState>((set) => ({
  destination: '',
  dates: '',
  kidAges: [8, 6, 4],
  adults: 2,
  pace: 'balanced',
  protectNap: true,
  bedtime: '7:30 PM',
  maxDriveMin: 45,
  agenda: [],
  set: (patch) => set(patch),
  toggleAgenda: (item) =>
    set((s) => ({
      agenda: s.agenda.includes(item) ? s.agenda.filter((a) => a !== item) : [...s.agenda, item],
    })),
}));
