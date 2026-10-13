// Smoke tests for the v2 mock data + theme contract. These guard the shapes the
// screens rely on (brief §5) until phase 3 swaps mocks for Supabase.
import {
  exploreResults,
  packItems,
  planItems,
  stays,
  travelers,
  trip,
  tripDays,
} from '../src/mock/data';
import { colors, MIN_TOUCH, radius } from '../src/theme/tokens';

describe('v2 mock data integrity', () => {
  it('has a trip with days matching its label list', () => {
    expect(trip.id).toBe('1');
    expect(tripDays.length).toBe(6); // Mar 27 – Apr 1
  });

  it('plan items reference valid days and protected naps are locked', () => {
    for (const p of planItems) {
      expect(p.day).toBeGreaterThanOrEqual(0);
      expect(p.day).toBeLessThan(tripDays.length);
      if (p.kind === 'nap') expect(p.locked).toBe(true);
    }
  });

  it('every stay has a kid-fit score and at least one "why" reason', () => {
    for (const s of stays) {
      expect(s.kidFit).toBeGreaterThan(0);
      expect(s.kidFit).toBeLessThanOrEqual(100);
      expect(s.reasons.length).toBeGreaterThan(0);
    }
  });

  it('stays are ranked by kid-fit, best first', () => {
    const scores = stays.map((s) => s.kidFit);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('pack items reference real travelers (or shared)', () => {
    const ids = new Set(travelers.map((t) => t.id));
    for (const k of packItems) {
      if (k.travelerId !== null) expect(ids.has(k.travelerId)).toBe(true);
    }
  });

  it('explore results carry kid-fit and a partner source', () => {
    for (const e of exploreResults) {
      expect(e.kidFit).toBeGreaterThan(0);
      expect(e.partner.length).toBeGreaterThan(0);
    }
  });
});

describe('v2 theme contract', () => {
  it('matches the brief §3 tokens', () => {
    expect(colors.ink).toBe('#0F2237');
    expect(colors.coral).toBe('#C9472B');
    expect(colors.teal).toBe('#0B7A6E');
    expect(colors.sun).toBe('#FFC845');
    expect(radius.chip).toBe(999);
    expect(MIN_TOUCH).toBe(44);
  });
});
