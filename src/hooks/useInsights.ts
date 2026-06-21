/**
 * @file useInsights.ts
 * Encapsulates all derived data and computations for the Insights page.
 *
 * Extracting this keeps the page component focused on rendering and makes
 * all statistical derivations independently testable via `renderHook`.
 */

'use client';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { BENCHMARKS } from '@/lib/emissionFactors';
import { calculateCategoryBreakdown } from '@/lib/activityUtils';
import { CATEGORY_MAP, CategoryKey } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface BenchmarkComparison {
  label: string;
  icon: string;
  daily: number;
  annual: number;
  /** Percentage difference from user's daily average; negative = below benchmark */
  diffPercent: number;
}

export interface InsightsData {
  /** Period currently selected */
  period: 'week' | 'month';
  totalEmission: number;
  avgDaily: number;
  predictedAnnual: number;
  catBreakdown: CategoryBreakdownItem[];
  topCategory: CategoryKey | null;
  benchmarks: BenchmarkComparison[];
  weeklyEmissions: number[];
  monthlyEmissions: number[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns all derived analytics for the Insights page for the given period.
 *
 * @param period  '7 days' window ('week') or '30 days' window ('month').
 */
export function useInsights(period: 'week' | 'month'): InsightsData {
  const { getDailyLogs, weeklyEmissions, monthlyEmissions } = useApp();

  const logs = useMemo(
    () => getDailyLogs(period === 'week' ? 7 : 30),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period],
  );

  const totalEmission = useMemo(
    () => logs.reduce((sum, l) => sum + l.totalEmission, 0),
    [logs],
  );

  const avgDaily = logs.length > 0 ? totalEmission / logs.length : 0;
  const predictedAnnual = Math.round(avgDaily * 365);

  const catBreakdown: CategoryBreakdownItem[] = useMemo(() => {
    const totals = calculateCategoryBreakdown(logs);
    return Object.entries(totals)
      .map(([cat, val]) => ({
        name: cat,
        value: Math.round(val * 100) / 100,
        color: CATEGORY_MAP[cat as CategoryKey]?.color ?? '#888',
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const topCategory =
    (catBreakdown[0]?.name ?? null) as CategoryKey | null;

  const benchmarks: BenchmarkComparison[] = useMemo(() => [
    {
      label: 'India Average',
      icon: '🇮🇳',
      daily: BENCHMARKS.india_daily,
      annual: BENCHMARKS.india_annual,
      diffPercent:
        ((avgDaily - BENCHMARKS.india_daily) / BENCHMARKS.india_daily) * 100,
    },
    {
      label: 'Global Average',
      icon: '🌍',
      daily: BENCHMARKS.global_daily,
      annual: BENCHMARKS.global_annual,
      diffPercent:
        ((avgDaily - BENCHMARKS.global_daily) / BENCHMARKS.global_daily) * 100,
    },
    {
      label: 'Paris 2°C Target',
      icon: '🎯',
      daily: BENCHMARKS.paris_target_annual / 365,
      annual: BENCHMARKS.paris_target_annual,
      diffPercent:
        ((predictedAnnual - BENCHMARKS.paris_target_annual) /
          BENCHMARKS.paris_target_annual) *
        100,
    },
  ], [avgDaily, predictedAnnual]);

  return {
    period,
    totalEmission,
    avgDaily,
    predictedAnnual,
    catBreakdown,
    topCategory,
    benchmarks,
    weeklyEmissions,
    monthlyEmissions,
  };
}
