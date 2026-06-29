import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export function fmtDateRange(start: string, end: string): string {
  try {
    const s = parseISO(start);
    const e = parseISO(end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth) return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  } catch {
    return '';
  }
}

export function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/** Whole days from today until the date (negative = past). */
export function daysUntil(iso: string, today = new Date()): number {
  try {
    return differenceInCalendarDays(parseISO(iso), today);
  } catch {
    return 0;
  }
}

/** Friendly countdown label for the active-trip hero card. */
export function countdownLabel(startISO: string, endISO: string, today = new Date()): string {
  const toStart = daysUntil(startISO, today);
  const toEnd = daysUntil(endISO, today);
  if (toStart > 1) return `${toStart} days to go`;
  if (toStart === 1) return 'Tomorrow!';
  if (toStart === 0) return 'Today’s the day';
  if (toStart < 0 && toEnd >= 0) return 'On the trip now';
  return 'Trip complete';
}
