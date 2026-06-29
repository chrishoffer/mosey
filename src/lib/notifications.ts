import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TimelineEvent } from '../types/db';

/**
 * Local notifications for timeline nudges (§7.5). Local-only is fine for v1 — the
 * timeline is deterministic, so we can schedule everything on-device. We never
 * manufacture urgency; nudges fire at 09:00 on their lead day and only for events
 * still in the future.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Schedules notifications for a trip's future timeline events. Best-effort: any
 *  failure is swallowed so trip creation never blocks on the OS. */
export async function scheduleTimelineNotifications(
  tripName: string,
  events: TimelineEvent[],
): Promise<number> {
  try {
    const ok = await ensurePermission();
    if (!ok) return 0;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mosey-nudges', {
        name: 'Trip nudges',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    let count = 0;
    const now = Date.now();
    for (const ev of events) {
      if (!ev.notify_at) continue;
      const when = new Date(ev.notify_at).getTime();
      if (Number.isNaN(when) || when <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${tripName}: ${ev.title}`,
          body: ev.body ?? '',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(when) },
      });
      count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}
