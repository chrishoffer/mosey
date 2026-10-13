// Mock data for phases 1–2 (static screens). Shapes mirror MOSEY_BUILD_BRIEF.md §5
// so phase 3 can swap this module for Supabase queries without reshaping screens.
// Place names here are static demo content from the mockups — NOT AI output.

export interface Traveler {
  id: string;
  label: string;
  age: number | null; // null for adults
  isAdult: boolean;
  napStart?: string; // "13:00"
  napEnd?: string;
  bedtime?: string; // "19:30"
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // ISO
  endDate: string;
  daysUntil: number;
  driveLabel: string;
  agenda: string[];
  laundryAccess: boolean;
  pace: 'easy' | 'balanced' | 'packed';
  maxDriveMinutes: number;
}

export type PlanKind = 'activity' | 'meal' | 'nap' | 'travel';

export interface PlanItem {
  id: string;
  day: number; // index into tripDays
  startTime: string; // "9:00 AM"
  durationMin: number;
  kind: PlanKind;
  title: string;
  placeName?: string;
  note?: string; // the one-line "why" in parent language
  agesOk?: string; // "Ages 3+"
  booked?: boolean;
  locked?: boolean; // protected (nap/bedtime)
  partner?: string;
}

export interface Stay {
  id: string;
  name: string;
  partner: 'Booking.com' | 'Viator' | 'Ticketmaster';
  kidFit: number; // 0..100
  priceLabel: string;
  perNight: string;
  distanceLabel: string;
  reasons: string[]; // "why Mosey picked it"
  amenities: string[];
  booked: boolean;
}

export interface PackItem {
  id: string;
  travelerId: string | null; // null = shared
  label: string;
  qty?: number;
  reason?: string;
  packed: boolean;
  carryOnWarning?: string;
  packLast?: boolean;
  learned?: boolean; // from pack_history ("you used this last trip")
}

export interface Todo {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
}

export interface ExploreResult {
  id: string;
  title: string;
  category: string;
  durationLabel: string;
  distanceLabel: string;
  agesLabel: string;
  kidFit: number;
  fitNote?: string; // "Fits your Fri 3:15 opening"
  priceLabel: string;
  partner: string;
  indoor: boolean;
}

export const travelers: Traveler[] = [
  { id: 't1', label: 'You', age: null, isAdult: true },
  { id: 't2', label: 'Elise', age: null, isAdult: true },
  { id: 't3', label: 'Mackenzie', age: 8, isAdult: false, bedtime: '21:00' },
  { id: 't4', label: 'Cooper', age: 6, isAdult: false, bedtime: '20:00' },
  { id: 't5', label: 'Chase', age: 4, isAdult: false, napStart: '13:00', napEnd: '14:30', bedtime: '19:30' },
];

export const trip: Trip = {
  id: '1',
  title: 'Smoky Mountain spring break',
  destination: 'Gatlinburg',
  startDate: '2027-03-27',
  endDate: '2027-04-01',
  daysUntil: 12,
  driveLabel: '4 hr 20 min drive from home',
  agenda: ['Mountains & views', 'Easy hikes', 'Aquarium', 'Pool time', 'Pancakes'],
  laundryAccess: true,
  pace: 'balanced',
  maxDriveMinutes: 45,
};

export const tripDays = ['Fri 27', 'Sat 28', 'Sun 29', 'Mon 30', 'Tue 31', 'Wed 1'];

export const planItems: PlanItem[] = [
  // Day 0 — arrival Friday
  { id: 'p1', day: 0, startTime: '9:00 AM', durationMin: 260, kind: 'travel', title: 'Drive to Gatlinburg', note: 'Leave by 9 so the drive ends before nap melts down.', locked: false },
  { id: 'p2', day: 0, startTime: '1:30 PM', durationMin: 90, kind: 'nap', title: 'Chase naps · quiet hour', note: 'Protected — Mosey plans around this.', locked: true },
  { id: 'p3', day: 0, startTime: '3:30 PM', durationMin: 90, kind: 'activity', title: 'Settle in + cabin pool', note: 'Low-key first afternoon beats a big outing after a drive.', agesOk: 'All ages' },
  { id: 'p4', day: 0, startTime: '5:45 PM', durationMin: 60, kind: 'meal', title: 'Easy dinner near the cabin', note: 'Close to home base for a 7:30 bedtime.', booked: false },
  // Day 1 — Saturday
  { id: 'p5', day: 1, startTime: '8:30 AM', durationMin: 60, kind: 'meal', title: 'Pancake breakfast', placeName: 'Pancake spot downtown', note: 'On the agenda — go early, lines build by 9:30.', booked: true, partner: 'OpenTable' },
  { id: 'p6', day: 1, startTime: '10:00 AM', durationMin: 150, kind: 'activity', title: 'Aquarium morning', placeName: 'Ripley’s Aquarium of the Smokies', note: 'Indoor anchor for the day; stroller-friendly loop.', agesOk: 'All ages', booked: true, partner: 'Viator' },
  { id: 'p7', day: 1, startTime: '1:00 PM', durationMin: 90, kind: 'nap', title: 'Chase naps · quiet hour', note: 'Protected — Mosey plans around this.', locked: true },
  { id: 'p8', day: 1, startTime: '3:00 PM', durationMin: 120, kind: 'activity', title: 'Easy waterfall walk', note: 'Under your 45-min drive cap; turn back anytime.', agesOk: 'Ages 3+' },
  { id: 'p9', day: 1, startTime: '6:00 PM', durationMin: 75, kind: 'meal', title: 'Family dinner', note: 'Kids’ menu + fast service — out by bedtime.', booked: false },
];

export const stays: Stay[] = [
  {
    id: 's1',
    name: 'Creekside Cabin · 3BR',
    partner: 'Booking.com',
    kidFit: 92,
    priceLabel: '$1,180 total',
    perNight: '$236 / night',
    distanceLabel: '8 min to downtown',
    reasons: ['Separate room for the 4-year-old’s nap', 'Washer/dryer — pack half as much', 'Fenced deck, no drop-offs'],
    amenities: ['Washer/dryer', 'Full kitchen', 'Crib available', 'Hot tub'],
    booked: false,
  },
  {
    id: 's2',
    name: 'Mountain View Lodge · Family suite',
    partner: 'Booking.com',
    kidFit: 86,
    priceLabel: '$1,340 total',
    perNight: '$268 / night',
    distanceLabel: '3 min to downtown',
    reasons: ['Indoor pool for rainy afternoons', 'Free breakfast before 9 AM rush', 'Connecting rooms'],
    amenities: ['Indoor pool', 'Free breakfast', 'Connecting rooms', 'Parking'],
    booked: false,
  },
  {
    id: 's3',
    name: 'Downtown Condo · 2BR',
    partner: 'Booking.com',
    kidFit: 74,
    priceLabel: '$990 total',
    perNight: '$198 / night',
    distanceLabel: 'Walk everywhere',
    reasons: ['Cheapest 2BR with a kitchen', 'Walk to the aquarium — skip parking'],
    amenities: ['Kitchen', 'Balcony', 'Elevator'],
    booked: false,
  },
];

export const todos: Todo[] = [
  { id: 'd1', label: 'Book your stay', detail: 'Creekside Cabin is holding at $236/night', done: true },
  { id: 'd2', label: 'Reserve aquarium tickets', detail: 'Sat morning slots sell out', done: true },
  { id: 'd3', label: 'Start the packing list', detail: 'Mosey drafted it from your agenda', done: false },
  { id: 'd4', label: 'Arrange the dog sitter', detail: '6 days — book early', done: false },
  { id: 'd5', label: 'Download offline maps & shows', detail: 'Spotty service in the mountains', done: false },
];

export const packItems: PackItem[] = [
  { id: 'k1', travelerId: 't5', label: 'Sound machine', reason: 'Chase won’t nap without it', packed: false, learned: true },
  { id: 'k2', travelerId: 't5', label: 'Swim diapers ×8', reason: 'Pool days Fri–Sun', packed: false },
  { id: 'k3', travelerId: 't5', label: 'Lovey (the bear)', packed: false, carryOnWarning: 'Keep in the car cab, never the roof box', packLast: true },
  { id: 'k4', travelerId: 't4', label: 'Water shoes', reason: 'Creek walk Saturday', packed: true },
  { id: 'k5', travelerId: 't4', label: 'Headphones', reason: 'Car ride shows', packed: false, learned: true },
  { id: 'k6', travelerId: 't3', label: 'Books ×3', reason: 'Quiet hour reader', packed: false },
  { id: 'k7', travelerId: 't3', label: 'Swimsuit ×2', reason: 'Laundry at the cabin — 2 is plenty', packed: true },
  { id: 'k8', travelerId: null, label: 'Meds pouch', reason: 'Kids’ Tylenol, thermometer, band-aids', packed: false, carryOnWarning: 'Day bag, not the suitcase' },
  { id: 'k9', travelerId: null, label: 'Snack bin for the car', reason: '4+ hr drive', packed: false, packLast: true },
  { id: 'k10', travelerId: null, label: 'Rain jackets ×5', reason: '40% rain Sat — mountains turn fast', packed: false },
];

export const exploreResults: ExploreResult[] = [
  {
    id: 'e1',
    title: 'Scenic chairlift ride',
    category: 'Outdoors',
    durationLabel: '1–1.5 hr',
    distanceLabel: '6 min drive',
    agesLabel: 'All ages',
    kidFit: 90,
    fitNote: 'Fits your Fri 3:15 opening',
    priceLabel: 'From $24',
    partner: 'Viator',
    indoor: false,
  },
  {
    id: 'e2',
    title: 'Mountain coaster',
    category: 'Thrills',
    durationLabel: '45 min',
    distanceLabel: '10 min drive',
    agesLabel: 'Ages 3+ with adult',
    kidFit: 84,
    priceLabel: 'From $18',
    partner: 'Viator',
    indoor: false,
  },
  {
    id: 'e3',
    title: 'Indoor mini-golf & arcade',
    category: 'Rainy day',
    durationLabel: '1–2 hr',
    distanceLabel: '4 min drive',
    agesLabel: 'All ages',
    kidFit: 81,
    fitNote: 'Good swap if Sat turns rainy',
    priceLabel: 'From $12',
    partner: 'Viator',
    indoor: true,
  },
  {
    id: 'e4',
    title: 'Pottery painting studio',
    category: 'Crafts',
    durationLabel: '1 hr',
    distanceLabel: '7 min drive',
    agesLabel: 'Ages 4+',
    kidFit: 72,
    priceLabel: 'From $15',
    partner: 'Viator',
    indoor: true,
  },
];

export const agentQuickActions = ['Meltdown', 'Raining', 'Hungry now', 'Running late'] as const;

export const kidsLine = 'Kids 8 · 6 · 4';
