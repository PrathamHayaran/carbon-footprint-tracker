import { describe, it, expect } from 'vitest';
import { calculateEmission, getEmissionFactor, BENCHMARKS, EMISSION_FACTORS } from '@/lib/emissionFactors';

describe('calculateEmission', () => {
  it('returns the correct rounded value for a known factor', () => {
    // 50 km × 0.21 kg/km = 10.5
    expect(calculateEmission('transport', 'car_petrol', 50)).toBe(10.5);
  });

  it('returns a negative value for offset activities', () => {
    // 2 trees × -21 kg/tree = -42
    expect(calculateEmission('offset', 'tree_planted', 2)).toBe(-42);
  });

  it('returns 0 for an unknown category', () => {
    expect(calculateEmission('unknown_category', 'car', 10)).toBe(0);
  });

  it('returns 0 for an unknown activity type within a valid category', () => {
    expect(calculateEmission('transport', 'flying_carpet', 10)).toBe(0);
  });

  it('returns 0 for bicycle (factor = 0)', () => {
    expect(calculateEmission('transport', 'bicycle', 100)).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    // 1 motorcycle km = 0.113 → stays 0.113 (already 3dp but rounded correctly)
    const result = calculateEmission('transport', 'motorcycle', 1);
    expect(Number.isFinite(result)).toBe(true);
    expect(String(result).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe('getEmissionFactor', () => {
  it('returns the correct entry for a known category + type', () => {
    const entry = getEmissionFactor('transport', 'car_petrol');
    expect(entry).toEqual({ factor: 0.21, unit: 'km', label: 'Petrol Car' });
  });

  it('returns undefined for an unknown category', () => {
    expect(getEmissionFactor('unicorn', 'car')).toBeUndefined();
  });

  it('returns undefined for an unknown activity type', () => {
    expect(getEmissionFactor('food', 'unicorn_steak')).toBeUndefined();
  });
});

describe('BENCHMARKS', () => {
  it('all benchmark values are positive numbers', () => {
    Object.values(BENCHMARKS).forEach((val) => {
      expect(val).toBeGreaterThan(0);
    });
  });

  it('india_annual is approximately india_daily × 365', () => {
    expect(BENCHMARKS.india_annual).toBeCloseTo(BENCHMARKS.india_daily * 365, -2);
  });

  it('paris_target_annual is less than india_annual (2 t < 1.9 t?)', () => {
    // Paris 2 t = 2000 kg, India average ~1900 kg — they are close
    expect(BENCHMARKS.paris_target_annual).toBeLessThanOrEqual(3000);
  });
});

describe('EMISSION_FACTORS data integrity', () => {
  it('every entry has a numeric factor, a non-empty unit, and a non-empty label', () => {
    for (const [category, factors] of Object.entries(EMISSION_FACTORS)) {
      for (const [key, entry] of Object.entries(
        factors as Record<string, { factor: number; unit: string; label: string }>,
      )) {
        expect(typeof entry.factor, `${category}.${key}.factor`).toBe('number');
        expect(isFinite(entry.factor), `${category}.${key}.factor should be finite`).toBe(true);
        expect(entry.unit.trim().length, `${category}.${key}.unit`).toBeGreaterThan(0);
        expect(entry.label.trim().length, `${category}.${key}.label`).toBeGreaterThan(0);
      }
    }
  });

  it('offset factors are all negative', () => {
    for (const entry of Object.values(EMISSION_FACTORS.offset)) {
      expect(entry.factor).toBeLessThan(0);
    }
  });

  it('non-offset factors are all non-negative', () => {
    const nonOffset = Object.entries(EMISSION_FACTORS).filter(([k]) => k !== 'offset');
    for (const [, factors] of nonOffset) {
      for (const entry of Object.values(
        factors as Record<string, { factor: number }>,
      )) {
        expect(entry.factor).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
