import { describe, it, expect } from 'vitest';
import {
  validateQuantity,
  validateDate,
  validateCategoryAndType,
  validateActivityForm,
} from '@/lib/validation';

// Reference "today" for deterministic date tests
const TODAY = new Date('2024-06-15T12:00:00Z');
const TODAY_STR = '2024-06-15';
const YESTERDAY_STR = '2024-06-14';
const TOMORROW_STR = '2024-06-16';

// ---------------------------------------------------------------------------
// validateQuantity
// ---------------------------------------------------------------------------

describe('validateQuantity', () => {
  it('accepts a positive number string', () => {
    expect(validateQuantity('10').valid).toBe(true);
  });

  it('accepts a positive number value', () => {
    expect(validateQuantity(42).valid).toBe(true);
  });

  it('accepts a decimal value', () => {
    expect(validateQuantity('3.14').valid).toBe(true);
  });

  it('rejects an empty string', () => {
    const r = validateQuantity('');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rejects null', () => {
    expect(validateQuantity(null).valid).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateQuantity(undefined).valid).toBe(false);
  });

  it('rejects zero', () => {
    expect(validateQuantity(0).valid).toBe(false);
    expect(validateQuantity('0').valid).toBe(false);
  });

  it('rejects a negative number', () => {
    expect(validateQuantity(-5).valid).toBe(false);
    expect(validateQuantity('-5').valid).toBe(false);
  });

  it('rejects NaN string', () => {
    expect(validateQuantity('abc').valid).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(validateQuantity(Infinity).valid).toBe(false);
  });

  it('rejects a value above the upper bound (100,000)', () => {
    expect(validateQuantity(100_001).valid).toBe(false);
    expect(validateQuantity(100_000).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateDate
// ---------------------------------------------------------------------------

describe('validateDate', () => {
  it('accepts today', () => {
    expect(validateDate(TODAY_STR, TODAY).valid).toBe(true);
  });

  it('accepts a past date', () => {
    expect(validateDate(YESTERDAY_STR, TODAY).valid).toBe(true);
  });

  it('rejects a future date', () => {
    const r = validateDate(TOMORROW_STR, TODAY);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/future/i);
  });

  it('rejects an empty string', () => {
    expect(validateDate('', TODAY).valid).toBe(false);
  });

  it('rejects null', () => {
    expect(validateDate(null, TODAY).valid).toBe(false);
  });

  it('rejects an invalid date string', () => {
    expect(validateDate('not-a-date', TODAY).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateCategoryAndType
// ---------------------------------------------------------------------------

describe('validateCategoryAndType', () => {
  it('accepts valid category and activity type', () => {
    expect(validateCategoryAndType('transport', 'car_petrol').valid).toBe(true);
  });

  it('accepts an offset category', () => {
    expect(validateCategoryAndType('offset', 'tree_planted').valid).toBe(true);
  });

  it('rejects an unknown category', () => {
    const r = validateCategoryAndType('unicorn', 'car');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/category/i);
  });

  it('rejects a null category', () => {
    expect(validateCategoryAndType(null, 'car_petrol').valid).toBe(false);
  });

  it('rejects an unknown activity type in a valid category', () => {
    const r = validateCategoryAndType('transport', 'hoverboard');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/activity type/i);
  });

  it('rejects a null activity type', () => {
    expect(validateCategoryAndType('transport', null).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateActivityForm (composite)
// ---------------------------------------------------------------------------

describe('validateActivityForm', () => {
  const validParams = {
    category: 'transport',
    activityType: 'car_petrol',
    quantity: '50',
    date: TODAY_STR,
    today: TODAY,
  };

  it('returns valid for a correct full input', () => {
    expect(validateActivityForm(validParams).valid).toBe(true);
  });

  it('surfaces a category error first when category is invalid', () => {
    const r = validateActivityForm({ ...validParams, category: 'bad' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/category/i);
  });

  it('surfaces a quantity error when quantity is zero', () => {
    const r = validateActivityForm({ ...validParams, quantity: '0' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/greater than zero/i);
  });

  it('surfaces a date error when date is in the future', () => {
    const r = validateActivityForm({ ...validParams, date: TOMORROW_STR });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/future/i);
  });

  it('surfaces a quantity error before a date error (category checked first)', () => {
    const r = validateActivityForm({ ...validParams, quantity: '-1', date: TOMORROW_STR });
    expect(r.valid).toBe(false);
    // quantity is checked after category/type — should be quantity error
    expect(r.error).toMatch(/greater than zero/i);
  });
});
