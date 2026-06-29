import type { TransitMode } from '../types/db';

/**
 * The "leaving home" checklist — deterministic defaults seeded on trip creation
 * (like the timeline). Generic, universally useful prep so the list is never empty;
 * the parent checks off and adds their own. A couple of items adapt to trip length.
 */
export function defaultHomeTasks(input: {
  tripDays: number;
  transitMode: TransitMode;
  hasKids?: boolean;
}): string[] {
  const base = [
    'Hold or forward the mail',
    'Take out the trash & run the disposal',
    'Empty the fridge of anything that’ll spoil',
    'Lock all doors & windows',
    'Set a couple of lights on a timer',
    'Turn down / program the thermostat',
    'Unplug what you safely can',
    'Leave a key + your itinerary with someone you trust',
  ];

  if (input.tripDays >= 3) {
    base.push('Arrange a pet sitter or boarding');
    base.push('Ask a neighbor to water plants & grab packages');
  }
  if (input.transitMode === 'drive' || input.transitMode === 'both') {
    base.push('Gas up the car & check tire pressure');
  }
  if (input.hasKids) {
    base.push('Refill the kids’ meds & pack the medicine pouch');
    base.push('Download shows & games on every kid’s device');
    base.push('Pack each kid’s comfort item (lovey, blanket, sound machine)');
    base.push('Share the schedule + emergency contacts with your sitter');
  }
  base.push('Charge everything & pack the chargers');
  return base;
}
