import { defaultHomeTasks } from '../src/data/homeChecklist';

describe('defaultHomeTasks', () => {
  const base = { tripDays: 5, transitMode: 'fly' as const };

  it('always includes the universal basics', () => {
    const tasks = defaultHomeTasks(base);
    expect(tasks).toContain('Hold or forward the mail');
    expect(tasks.some((t) => t.toLowerCase().includes('thermostat'))).toBe(true);
  });

  it('adds kid-specific prep only when kids are present', () => {
    const withKids = defaultHomeTasks({ ...base, hasKids: true });
    const withoutKids = defaultHomeTasks({ ...base, hasKids: false });
    expect(withKids.some((t) => t.toLowerCase().includes('meds'))).toBe(true);
    expect(withoutKids.some((t) => t.toLowerCase().includes('meds'))).toBe(false);
  });

  it('adds the pet sitter for longer trips only', () => {
    expect(defaultHomeTasks({ ...base, tripDays: 1 }).some((t) => t.includes('pet sitter'))).toBe(false);
    expect(defaultHomeTasks({ ...base, tripDays: 5 }).some((t) => t.includes('pet sitter'))).toBe(true);
  });

  it('adds a fuel reminder for drives', () => {
    expect(defaultHomeTasks({ ...base, transitMode: 'drive' }).some((t) => t.includes('Gas up'))).toBe(true);
    expect(defaultHomeTasks({ ...base, transitMode: 'fly' }).some((t) => t.includes('Gas up'))).toBe(false);
  });
});
