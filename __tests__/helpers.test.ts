import { ageFromBirthYear, isKid } from '../src/types/db';
import { buildAmazonUrl } from '../src/lib/amazon';
import { countdownLabel, daysUntil } from '../src/lib/dates';

describe('ageFromBirthYear', () => {
  it('derives age from the current year', () => {
    const now = new Date('2026-06-29T12:00:00Z');
    expect(ageFromBirthYear(2018, now)).toBe(8);
    expect(ageFromBirthYear(2020, now)).toBe(6);
    expect(ageFromBirthYear(2022, now)).toBe(4);
  });

  it('never returns a negative age', () => {
    const now = new Date('2026-06-29T12:00:00Z');
    expect(ageFromBirthYear(2030, now)).toBe(0);
  });

  it('returns null when no birth year (adults)', () => {
    expect(ageFromBirthYear(null)).toBeNull();
  });
});

describe('isKid', () => {
  const now = new Date('2026-06-29T12:00:00Z');
  it('treats relation=child as a kid regardless of age', () => {
    expect(isKid({ relation: 'child', birth_year: null }, now)).toBe(true);
  });
  it('treats under-18 by birth year as a kid', () => {
    expect(isKid({ relation: null, birth_year: 2018 }, now)).toBe(true);
  });
  it('treats an adult (partner, no age) as not a kid', () => {
    expect(isKid({ relation: 'partner', birth_year: null }, now)).toBe(false);
  });
});

describe('buildAmazonUrl', () => {
  it('builds a search URL and encodes the query', () => {
    const url = buildAmazonUrl('toddler rash guard 4T');
    expect(url.startsWith('https://www.amazon.com/s?k=')).toBe(true);
    expect(url).toContain('toddler%20rash%20guard%204T');
  });
});

describe('countdownLabel', () => {
  const today = new Date('2026-06-29T12:00:00Z');
  it('counts days to a future trip', () => {
    expect(countdownLabel('2026-07-09', '2026-07-16', today)).toBe('10 days to go');
  });
  it('says Tomorrow the day before', () => {
    expect(countdownLabel('2026-06-30', '2026-07-05', today)).toBe('Tomorrow!');
  });
  it('knows when the trip is underway', () => {
    expect(countdownLabel('2026-06-27', '2026-07-02', today)).toBe('On the trip now');
  });
});

describe('daysUntil', () => {
  it('is negative for past dates', () => {
    expect(daysUntil('2026-06-01', new Date('2026-06-29T00:00:00Z'))).toBeLessThan(0);
  });
});
