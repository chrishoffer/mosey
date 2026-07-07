import * as Notifications from 'expo-notifications';
import { ensurePermission } from './notifications';
import type { Trip } from '../types/db';

/**
 * Nurture drip: a few gentle, scheduled prompts between trip creation and
 * departure that ask the "sharpen" questions (lodging / activities / anything
 * else) right when answering them still improves the lists. Rules:
 *  - at most three prompts per trip, all before the trip starts
 *  - each is cancelled automatically once the trip has no more gaps
 *  - tapping one deep-links into the trip (handled in app/_layout.tsx)
 * Calm by design — this nudges toward a better plan, never manufactures urgency.
 */

const NURTURE_TAG = 'nurture';

interface DripSpec {
  /** Days AFTER creation (when leadDays is null) or days BEFORE start. */
  leadDaysBeforeStart: number | null;
  daysAfterCreation: number | null;
  title: string;
  body: string;
}

const DRIPS: DripSpec[] = [
  {
    leadDaysBeforeStart: null,
    daysAfterCreation: 2,
    title: 'Quick one from Mosey',
    body: 'Where are you staying? One tap helps me tailor what to pack.',
  },
  {
    leadDaysBeforeStart: 21,
    daysAfterCreation: null,
    title: 'Three weeks out 🎒',
    body: 'What are you planning — beach, parks, hikes? I’ll tune the packing list and day plan.',
  },
  {
    leadDaysBeforeStart: 10,
    daysAfterCreation: null,
    title: 'Packing time is close',
    body: 'Anything else I should know about this trip? Last call before your lists get built.',
  },
];

/** 10:00 local on the computed day, or null if it isn't usefully in the future. */
function fireDate(trip: Trip, spec: DripSpec, now = new Date()): Date | null {
  const start = new Date(`${trip.start_date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;

  const when = new Date(now.getTime());
  if (spec.daysAfterCreation != null) {
    when.setDate(when.getDate() + spec.daysAfterCreation);
  } else if (spec.leadDaysBeforeStart != null) {
    when.setTime(start.getTime());
    when.setDate(when.getDate() - spec.leadDaysBeforeStart);
  } else {
    return null;
  }
  when.setHours(10, 0, 0, 0);

  // Must be at least an hour away and land before the trip begins.
  if (when.getTime() < now.getTime() + 3_600_000) return null;
  if (when.getTime() >= start.getTime()) return null;
  return when;
}

/** Schedules the drip for a freshly created trip. Best-effort; never throws. */
export async function scheduleNurturePrompts(trip: Trip): Promise<number> {
  try {
    const ok = await ensurePermission();
    if (!ok) return 0;
    let count = 0;
    for (const spec of DRIPS) {
      const when = fireDate(trip, spec);
      if (!when) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: spec.title,
          body: spec.body,
          data: { tripId: trip.id, mosey: NURTURE_TAG },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
      count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}

/** Cancels any remaining nurture prompts for a trip (called once its context
 *  gaps are filled — no point asking questions that are already answered). */
export async function cancelNurturePrompts(tripId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const req of scheduled) {
      const data = req.content.data as { tripId?: string; mosey?: string } | undefined;
      if (data?.mosey === NURTURE_TAG && data?.tripId === tripId) {
        await Notifications.cancelScheduledNotificationAsync(req.identifier);
      }
    }
  } catch {
    /* best-effort */
  }
}
