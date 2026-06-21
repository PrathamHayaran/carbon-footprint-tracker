/**
 * @file activityUtils.ts
 * Pure utility functions for activity data processing.
 *
 * All functions here are side-effect-free and accept explicit dependencies
 * (e.g. `today?: Date`) so they can be tested in isolation without mocking
 * global `Date`, `localStorage`, or React state.
 */

import { Activity, DailyLog } from '@/types';
import { BENCHMARKS } from '@/lib/emissionFactors';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Generates a short random string suitable for use as an activity ID.
 * Uses `Math.random()` and `Date.now()` — for tests, replace with a mock.
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Returns an ISO date string (`YYYY-MM-DD`) for the given Date object.
 * Defaults to `new Date()` (today) when no argument is supplied.
 *
 * @example getDateString() === '2026-06-21'
 */
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Returns a Date object offset by `offsetDays` from the given `from` date.
 * Negative values look into the past; positive values into the future.
 */
export function offsetDate(offsetDays: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + offsetDays);
  return d;
}


// ---------------------------------------------------------------------------
// Daily log aggregation
// ---------------------------------------------------------------------------

/**
 * Builds a `DailyLog[]` array for the last `days` calendar days.
 *
 * @param activities  Full activity list (newest-first or any order).
 * @param days        How many days to include (e.g. 7 or 30).
 * @param today       The reference "today" — defaults to `new Date()`.
 *                    Pass a fixed date in tests to get deterministic output.
 * @returns           Array of `DailyLog` objects, oldest day first.
 */
export function aggregateDailyLogs(
  activities: Activity[],
  days: number,
  today: Date = new Date(),
): DailyLog[] {
  const logs: DailyLog[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = getDateString(offsetDate(-i, today));
    const dayActivities = activities.filter((a) => a.date === date);
    const totalEmission = dayActivities.reduce((sum, a) => sum + a.emission, 0);
    logs.push({ date, totalEmission, activities: dayActivities });
  }

  return logs;
}

// ---------------------------------------------------------------------------
// Streak calculation
// ---------------------------------------------------------------------------

/**
 * Calculates how many consecutive days (ending today or yesterday) the user
 * stayed below `benchmarkDaily` kg CO₂e.
 *
 * A streak is broken when a day's total is **at or above** the benchmark
 * OR when a day has zero activity logged (no data = no streak).
 *
 * @param activities       Full activity list.
 * @param benchmarkDaily   Daily threshold in kg CO₂e (default: India average).
 * @param today            Reference date — override in tests for determinism.
 * @param lookbackDays     Maximum number of days to inspect (default 30).
 */
export function calculateStreak(
  activities: Activity[],
  benchmarkDaily: number = BENCHMARKS.india_daily,
  today: Date = new Date(),
  lookbackDays = 30,
): number {
  let streak = 0;

  for (let i = 0; i < lookbackDays; i++) {
    const date = getDateString(offsetDate(-i, today));
    const dayActivities = activities.filter((a) => a.date === date);
    const dayTotal = dayActivities.reduce((sum, a) => sum + a.emission, 0);

    // No activities logged today yet — don't break streak on day 0, skip it
    if (i === 0 && dayTotal === 0) continue;

    if (dayTotal > 0 && dayTotal < benchmarkDaily) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ---------------------------------------------------------------------------
// Category breakdown
// ---------------------------------------------------------------------------

/**
 * Sums positive emissions per category across a set of daily logs.
 * Offset/negative emissions are excluded from the breakdown.
 *
 * @returns  A `Record<category, totalKg>` map (only categories with > 0 kg).
 */
export function calculateCategoryBreakdown(
  logs: DailyLog[],
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const log of logs) {
    for (const activity of log.activities) {
      if (activity.emission > 0) {
        totals[activity.category] = (totals[activity.category] ?? 0) + activity.emission;
      }
    }
  }

  return totals;
}

// ---------------------------------------------------------------------------
// Emission equivalents  (human-readable comparisons)
// ---------------------------------------------------------------------------

/**
 * Returns the number of km in an average petrol car equivalent to `kg` CO₂e.
 */
export function kgToPetrolKm(kg: number): number {
  return Math.round(kg / 0.21);
}

/**
 * Returns the number of mature trees needed to absorb `kg` CO₂ in a year.
 */
export function kgToTrees(kg: number): number {
  return parseFloat((kg / 21).toFixed(1));
}
