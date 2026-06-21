/**
 * @file validation.ts
 * Centralised input validation for activity logging.
 *
 * All validators return a `ValidationResult` object so callers can both check
 * validity and surface a human-readable error message to the user — without
 * the logic being scattered across form components.
 */

import { EMISSION_FACTORS } from '@/lib/emissionFactors';
import { getDateString } from '@/lib/activityUtils';

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  /** Human-readable error message; only present when `valid === false`. */
  error?: string;
}

const OK: ValidationResult = { valid: true };
const fail = (error: string): ValidationResult => ({ valid: false, error });

// ---------------------------------------------------------------------------
// Individual field validators
// ---------------------------------------------------------------------------

/**
 * Validates a numeric quantity string (or number).
 *
 * Rules:
 *  - Must not be empty / undefined / null
 *  - Must be a finite number (no NaN, no Infinity)
 *  - Must be strictly greater than zero
 *  - Must be ≤ 100,000 (sanity upper bound to catch accidental big inputs)
 */
export function validateQuantity(value: string | number | null | undefined): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return fail('Quantity is required.');
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (!isFinite(num) || isNaN(num)) {
    return fail('Quantity must be a valid number.');
  }
  if (num <= 0) {
    return fail('Quantity must be greater than zero.');
  }
  if (num > 100_000) {
    return fail('Quantity seems unreasonably large (max 100,000).');
  }

  return OK;
}

/**
 * Validates an ISO date string (`YYYY-MM-DD`).
 *
 * Rules:
 *  - Must not be empty
 *  - Must parse to a valid Date
 *  - Must not be in the future (relative to `today`)
 *
 * @param value  The date string to validate.
 * @param today  Reference date — override in tests for determinism.
 */
export function validateDate(
  value: string | null | undefined,
  today: Date = new Date(),
): ValidationResult {
  if (!value) return fail('Date is required.');

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return fail('Date is not a valid date.');

  const todayStr = getDateString(today);
  if (value > todayStr) return fail('Date cannot be in the future.');

  return OK;
}

/**
 * Validates that `category` and `activityType` are known to the app's
 * emission factor registry.
 *
 * This prevents invalid combinations from being saved to state — useful both
 * for form submissions and for future API route validation.
 */
export function validateCategoryAndType(
  category: string | null | undefined,
  activityType: string | null | undefined,
): ValidationResult {
  if (!category) return fail('Category is required.');

  const cat = EMISSION_FACTORS[category as keyof typeof EMISSION_FACTORS];
  if (!cat) return fail(`Unknown category: "${category}".`);

  if (!activityType) return fail('Activity type is required.');

  const type = (cat as Record<string, unknown>)[activityType];
  if (!type) return fail(`Unknown activity type "${activityType}" in category "${category}".`);

  return OK;
}

/**
 * Composite validator — runs all field-level validators and returns the first
 * failure, or `{ valid: true }` when everything passes.
 *
 * Use this as the single validation call before calling `addActivity`.
 */
export function validateActivityForm(params: {
  category: string | null | undefined;
  activityType: string | null | undefined;
  quantity: string | number | null | undefined;
  date: string | null | undefined;
  today?: Date;
}): ValidationResult {
  const catResult = validateCategoryAndType(params.category, params.activityType);
  if (!catResult.valid) return catResult;

  const qtyResult = validateQuantity(params.quantity);
  if (!qtyResult.valid) return qtyResult;

  const dateResult = validateDate(params.date, params.today);
  if (!dateResult.valid) return dateResult;

  return OK;
}
