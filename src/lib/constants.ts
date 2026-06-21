/**
 * @file constants.ts
 * Single source of truth for category metadata, colour thresholds, and
 * numeric constants that were previously duplicated across multiple pages.
 */

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

export type CategoryKey = 'transport' | 'food' | 'energy' | 'shopping' | 'offset';

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: string;
  /** HSL colour string used for charts, badges, and progress bars */
  color: string;
  /** Background colour (semi-transparent) for quick-log cards */
  bg: string;
  /** Border colour (semi-transparent) for quick-log cards */
  border: string;
  /** Deep-link href to the tracker page pre-selecting this category */
  href: string;
}

/**
 * Canonical list of all activity categories.
 * Previously duplicated in page.tsx, tracker/page.tsx, and insights/page.tsx.
 */
export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    key: 'transport',
    label: 'Transport',
    icon: '🚗',
    color: 'hsl(212,80%,60%)',
    bg: 'hsla(214,80%,30%,0.4)',
    border: 'hsla(214,80%,55%,0.3)',
    href: '/tracker?cat=transport',
  },
  {
    key: 'food',
    label: 'Food',
    icon: '🍽️',
    color: 'hsl(150,60%,50%)',
    bg: 'hsla(152,55%,20%,0.4)',
    border: 'hsla(152,55%,50%,0.3)',
    href: '/tracker?cat=food',
  },
  {
    key: 'energy',
    label: 'Energy',
    icon: '⚡',
    color: 'hsl(38,92%,58%)',
    bg: 'hsla(38,90%,26%,0.4)',
    border: 'hsla(38,90%,55%,0.3)',
    href: '/tracker?cat=energy',
  },
  {
    key: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    color: 'hsl(280,70%,65%)',
    bg: 'hsla(270,60%,26%,0.4)',
    border: 'hsla(270,60%,55%,0.3)',
    href: '/tracker?cat=shopping',
  },
  {
    key: 'offset',
    label: 'Offsets',
    icon: '♻️',
    color: 'hsl(175,72%,45%)',
    bg: 'hsla(174,60%,20%,0.4)',
    border: 'hsla(174,60%,45%,0.3)',
    href: '/tracker?cat=offset',
  },
];

/** Ordered array of category keys — useful for iteration without object spread */
export const CATEGORY_KEYS = CATEGORY_CONFIG.map((c) => c.key);

/** Quick lookup map: key → CategoryConfig */
export const CATEGORY_MAP = Object.fromEntries(
  CATEGORY_CONFIG.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryConfig>;

// ---------------------------------------------------------------------------
// Emission thresholds (kg CO₂e) used to derive preview/badge colours
// ---------------------------------------------------------------------------

/**
 * Thresholds for colouring a real-time emission preview on the tracker form.
 *   value < LOW   → green  (acceptable)
 *   value < HIGH  → amber  (moderate)
 *   value >= HIGH → red    (high)
 */
export const PREVIEW_THRESHOLDS = {
  LOW: 2,
  HIGH: 5,
} as const;

// ---------------------------------------------------------------------------
// Numeric constants previously scattered as magic numbers
// ---------------------------------------------------------------------------

/**
 * kg CO₂e emitted per km driven in an average petrol car.
 * Source: DEFRA 2023 — matches EMISSION_FACTORS.transport.car_petrol.factor
 */
export const PETROL_KM_FACTOR = 0.21;

/**
 * Average CO₂ absorbed per mature tree per year (kg).
 * Used for real-world equivalents on the dashboard.
 */
export const TREE_ABSORPTION_KG_PER_YEAR = 21;

/**
 * Approximate kWh consumed per hour by an LED bulb (0.015 kWh = 15 W).
 * Used for real-world equivalents on the dashboard.
 */
export const LED_KWH_PER_HOUR = 0.015;

// ---------------------------------------------------------------------------
// localStorage keys — centralised so a rename never misses a spot
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  ACTIVITIES: 'carbonwise_activities',
} as const;
