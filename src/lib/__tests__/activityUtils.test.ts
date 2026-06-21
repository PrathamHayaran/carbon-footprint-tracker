import { describe, it, expect } from 'vitest';
import {
  generateId,
  getDateString,
  offsetDate,
  aggregateDailyLogs,
  calculateStreak,
  calculateCategoryBreakdown,
  kgToPetrolKm,
  kgToTrees,
} from '@/lib/activityUtils';
import type { Activity } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date('2024-06-15T12:00:00Z');

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'test-id',
    userId: 'local-user',
    category: 'transport',
    activityType: 'car_petrol',
    quantity: 10,
    unit: 'km',
    emission: 2.1,
    label: 'Petrol Car',
    date: '2024-06-15',
    createdAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = Array.from({ length: 50 }, generateId);
    expect(new Set(ids).size).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// getDateString
// ---------------------------------------------------------------------------

describe('getDateString', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    const result = getDateString(TODAY);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the correct date for the reference date', () => {
    expect(getDateString(TODAY)).toBe('2024-06-15');
  });
});

// ---------------------------------------------------------------------------
// offsetDate
// ---------------------------------------------------------------------------

describe('offsetDate', () => {
  it('returns the same date with offset 0', () => {
    expect(getDateString(offsetDate(0, TODAY))).toBe('2024-06-15');
  });

  it('returns yesterday with offset -1', () => {
    expect(getDateString(offsetDate(-1, TODAY))).toBe('2024-06-14');
  });

  it('returns tomorrow with offset +1', () => {
    expect(getDateString(offsetDate(1, TODAY))).toBe('2024-06-16');
  });
});

// ---------------------------------------------------------------------------
// aggregateDailyLogs
// ---------------------------------------------------------------------------

describe('aggregateDailyLogs', () => {
  it('returns exactly `days` entries', () => {
    expect(aggregateDailyLogs([], 7, TODAY)).toHaveLength(7);
    expect(aggregateDailyLogs([], 30, TODAY)).toHaveLength(30);
    expect(aggregateDailyLogs([], 1, TODAY)).toHaveLength(1);
  });

  it('returns entries ordered oldest-first', () => {
    const logs = aggregateDailyLogs([], 3, TODAY);
    expect(logs[0]!.date).toBe('2024-06-13'); // 2 days ago
    expect(logs[1]!.date).toBe('2024-06-14'); // 1 day ago
    expect(logs[2]!.date).toBe('2024-06-15'); // today
  });

  it('correctly sums emissions for a matching day', () => {
    const activities: Activity[] = [
      makeActivity({ date: '2024-06-15', emission: 3.0 }),
      makeActivity({ date: '2024-06-15', emission: 1.5 }),
      makeActivity({ date: '2024-06-14', emission: 2.0 }),
    ];
    const logs = aggregateDailyLogs(activities, 3, TODAY);

    const today = logs.find((l) => l.date === '2024-06-15')!;
    expect(today.totalEmission).toBeCloseTo(4.5);
    expect(today.activities).toHaveLength(2);

    const yesterday = logs.find((l) => l.date === '2024-06-14')!;
    expect(yesterday.totalEmission).toBeCloseTo(2.0);
  });

  it('returns 0 emission and empty activities for days with no data', () => {
    const logs = aggregateDailyLogs([], 7, TODAY);
    for (const log of logs) {
      expect(log.totalEmission).toBe(0);
      expect(log.activities).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateStreak
// ---------------------------------------------------------------------------

describe('calculateStreak', () => {
  const BENCHMARK = 5.2;

  it('returns 0 when no activities are logged', () => {
    expect(calculateStreak([], BENCHMARK, TODAY)).toBe(0);
  });

  it('returns 0 when today has no activities (skips day 0)', () => {
    // Activity only on a future date — nothing for today
    expect(calculateStreak([], BENCHMARK, TODAY)).toBe(0);
  });

  it('counts consecutive days below benchmark', () => {
    const activities: Activity[] = [
      makeActivity({ date: '2024-06-15', emission: 2.0 }), // today — below
      makeActivity({ date: '2024-06-14', emission: 3.0 }), // yesterday — below
      makeActivity({ date: '2024-06-13', emission: 1.0 }), // 2 days ago — below
    ];
    // All 3 days are below 5.2 → streak = 3
    expect(calculateStreak(activities, BENCHMARK, TODAY)).toBe(3);
  });

  it('stops the streak when a day is at or above benchmark', () => {
    const activities: Activity[] = [
      makeActivity({ date: '2024-06-15', emission: 2.0 }), // today — below
      makeActivity({ date: '2024-06-14', emission: 8.0 }), // yesterday — ABOVE → streak breaks
      makeActivity({ date: '2024-06-13', emission: 1.0 }),
    ];
    expect(calculateStreak(activities, BENCHMARK, TODAY)).toBe(1);
  });

  it('does not count a day with emission exactly at benchmark', () => {
    const activities: Activity[] = [
      makeActivity({ date: '2024-06-15', emission: BENCHMARK }), // at benchmark — not below
    ];
    expect(calculateStreak(activities, BENCHMARK, TODAY)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateCategoryBreakdown
// ---------------------------------------------------------------------------

describe('calculateCategoryBreakdown', () => {
  it('returns an empty object for logs with no activities', () => {
    const logs = aggregateDailyLogs([], 7, TODAY);
    expect(calculateCategoryBreakdown(logs)).toEqual({});
  });

  it('sums emissions by category', () => {
    const activities: Activity[] = [
      makeActivity({ category: 'transport', emission: 3.0 }),
      makeActivity({ category: 'transport', emission: 2.0 }),
      makeActivity({ category: 'food', emission: 5.0 }),
    ];
    const logs = [{ date: '2024-06-15', totalEmission: 10, activities }];
    const result = calculateCategoryBreakdown(logs);
    expect(result.transport).toBeCloseTo(5.0);
    expect(result.food).toBeCloseTo(5.0);
  });

  it('excludes negative (offset) emissions from the breakdown', () => {
    const activities: Activity[] = [
      makeActivity({ category: 'offset', emission: -21 }),
      makeActivity({ category: 'transport', emission: 5 }),
    ];
    const logs = [{ date: '2024-06-15', totalEmission: -16, activities }];
    const result = calculateCategoryBreakdown(logs);
    expect(result.offset).toBeUndefined();
    expect(result.transport).toBeCloseTo(5);
  });
});

// ---------------------------------------------------------------------------
// Equivalents
// ---------------------------------------------------------------------------

describe('kgToPetrolKm', () => {
  it('converts 10.5 kg to 50 km (10.5 / 0.21)', () => {
    expect(kgToPetrolKm(10.5)).toBe(50);
  });

  it('returns 0 for 0 kg', () => {
    expect(kgToPetrolKm(0)).toBe(0);
  });
});

describe('kgToTrees', () => {
  it('converts 21 kg to 1.0 tree', () => {
    expect(kgToTrees(21)).toBe(1.0);
  });

  it('converts 42 kg to 2.0 trees', () => {
    expect(kgToTrees(42)).toBe(2.0);
  });
});
