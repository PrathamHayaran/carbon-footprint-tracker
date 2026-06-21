/**
 * @file useActivityForm.ts
 * Encapsulates all state and logic for the activity-logging form on
 * the Tracker page, keeping the page component focused purely on rendering.
 *
 * Extracting this to a hook also makes the form logic independently testable
 * via `@testing-library/react`'s `renderHook` without mounting the full page.
 */

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { EMISSION_FACTORS, calculateEmission, getEmissionFactor } from '@/lib/emissionFactors';
import { validateActivityForm } from '@/lib/validation';
import { getDateString } from '@/lib/activityUtils';
import { PREVIEW_THRESHOLDS, CategoryKey } from '@/lib/constants';

export type { CategoryKey };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityFormState {
  activeCategory: CategoryKey;
  activityType: string;
  quantity: string;
  date: string;
  note: string;
  preview: number;
  /** Null when no toast is shown */
  toast: string | null;
  validationError: string | null;
  /** CSS colour string derived from the preview value */
  previewColor: string;
}

export interface ActivityFormActions {
  setActiveCategory: (cat: CategoryKey) => void;
  setActivityType: (type: string) => void;
  setQuantity: (qty: string) => void;
  setDate: (date: string) => void;
  setNote: (note: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  dismissToast: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolvePreviewColor(preview: number): string {
  if (preview < 0) return 'var(--green-300)';
  if (preview < PREVIEW_THRESHOLDS.LOW) return 'var(--green-300)';
  if (preview < PREVIEW_THRESHOLDS.HIGH) return 'var(--amber-400)';
  return 'var(--red-400)';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param initialCategory  Which category tab is pre-selected (from URL params).
 */
export function useActivityForm(
  initialCategory: CategoryKey = 'transport',
): ActivityFormState & ActivityFormActions {
  const { addActivity } = useApp();

  const [activeCategory, setActiveCategoryState] = useState<CategoryKey>(initialCategory);
  const [activityType, setActivityType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(getDateString());
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // When the category changes, reset activityType to the first in the new category
  const setActiveCategory = useCallback((cat: CategoryKey) => {
    setActiveCategoryState(cat);
  }, []);

  useEffect(() => {
    const catFactors = EMISSION_FACTORS[activeCategory] as Record<string, { factor: number; unit: string; label: string }>;
    const firstKey = Object.keys(catFactors)[0] ?? '';
    setActivityType(firstKey);
  }, [activeCategory]);

  // Recompute preview whenever relevant fields change
  useEffect(() => {
    if (activityType && quantity) {
      const value = calculateEmission(activeCategory, activityType, Number(quantity));
      setPreview(value);
    } else {
      setPreview(0);
    }
  }, [activityType, quantity, activeCategory]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      const result = validateActivityForm({
        category: activeCategory,
        activityType,
        quantity,
        date,
      });

      if (!result.valid) {
        setValidationError(result.error ?? 'Invalid input.');
        return;
      }

      const factor = getEmissionFactor(activeCategory, activityType);
      if (!factor) return; // guard — should not happen after validation

      const emission = calculateEmission(activeCategory, activityType, Number(quantity));

      addActivity({
        category: activeCategory,
        activityType,
        quantity: Number(quantity),
        unit: factor.unit,
        emission,
        label: factor.label,
        date,
        note,
      });

      // Reset transient fields
      setQuantity('');
      setNote('');
      setPreview(0);

      const msg = `✅ Logged ${factor.label} — ${Math.abs(emission).toFixed(2)} kg CO₂e`;
      setToast(msg);
      setTimeout(() => setToast(null), 3500);
    },
    [activeCategory, activityType, quantity, date, note, addActivity],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    // State
    activeCategory,
    activityType,
    quantity,
    date,
    note,
    preview,
    toast,
    validationError,
    previewColor: resolvePreviewColor(preview),
    // Actions
    setActiveCategory,
    setActivityType,
    setQuantity,
    setDate,
    setNote,
    handleSubmit,
    dismissToast,
  };
}
