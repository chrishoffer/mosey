import { generateTimeline } from '../src/data/timeline';

describe('generateTimeline', () => {
  const base = {
    startDate: '2026-09-01',
    endDate: '2026-09-08',
    transitMode: 'fly' as const,
    tripType: 'cruise' as const,
    hasKids: true,
  };

  it('produces events sorted by lead_days descending', () => {
    const seeds = generateTimeline(base);
    expect(seeds.length).toBeGreaterThan(0);
    const leads = seeds.map((s) => s.lead_days);
    const sorted = [...leads].sort((a, b) => b - a);
    expect(leads).toEqual(sorted);
  });

  it('includes a passport milestone for flights at ~12 weeks out', () => {
    const seeds = generateTimeline(base);
    const passport = seeds.find((s) => s.lead_days === 84);
    expect(passport).toBeDefined();
    expect(passport?.kind).toBe('milestone');
  });

  it('omits the passport milestone for drive-only trips', () => {
    const seeds = generateTimeline({ ...base, transitMode: 'drive' });
    expect(seeds.find((s) => s.lead_days === 84)).toBeUndefined();
  });

  it('always ends with a day-of travel milestone at lead 0', () => {
    const seeds = generateTimeline(base);
    const dayOf = seeds[seeds.length - 1];
    expect(dayOf.lead_days).toBe(0);
    expect(dayOf.title.toLowerCase()).toContain('travel');
  });

  it('computes a 09:00 notify_at on the correct calendar day', () => {
    const seeds = generateTimeline(base);
    const dayOf = seeds.find((s) => s.lead_days === 0)!;
    const d = new Date(dayOf.notify_at!);
    expect(d.getHours()).toBe(9);
  });

  it('adds a kid-specific meds nudge only when kids are present', () => {
    const withKids = generateTimeline(base);
    const withoutKids = generateTimeline({ ...base, hasKids: false });
    expect(withKids.some((s) => s.title.includes('Refill meds'))).toBe(true);
    expect(withoutKids.some((s) => s.title.includes('Refill meds'))).toBe(false);
  });

  it('never crashes on a malformed date', () => {
    const seeds = generateTimeline({ ...base, startDate: 'not-a-date' });
    expect(Array.isArray(seeds)).toBe(true);
    seeds.forEach((s) => expect(s.notify_at).toBeNull());
  });
});
