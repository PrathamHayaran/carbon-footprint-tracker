/**
 * @file emissionFactors.ts
 * Emission factors in kg CO₂e per unit.
 *
 * Sources:
 *  - IPCC AR6 (2021)
 *  - US EPA GHG Emission Factors Hub (2023)
 *  - DEFRA UK Government GHG Conversion Factors (2023)
 *  - Our World in Data — Food & Land Use data
 *
 * All `factor` values are in **kg CO₂ equivalent per unit** (e.g. per km, per
 * kg of food consumed, per kWh of electricity).  Negative factors represent
 * carbon sequestration (offsets).
 */

// ---------------------------------------------------------------------------
// Emission factor registry
// ---------------------------------------------------------------------------

export const EMISSION_FACTORS = {
  transport: {
    car_petrol:    { factor: 0.21,  unit: 'km',    label: 'Petrol Car' },
    car_diesel:    { factor: 0.17,  unit: 'km',    label: 'Diesel Car' },
    car_ev:        { factor: 0.07,  unit: 'km',    label: 'Electric Car' },
    motorcycle:    { factor: 0.113, unit: 'km',    label: 'Motorcycle' },
    bus:           { factor: 0.089, unit: 'km',    label: 'Bus' },
    train:         { factor: 0.041, unit: 'km',    label: 'Train / Metro' },
    flight_short:  { factor: 0.255, unit: 'km',    label: 'Short-haul Flight' },
    flight_long:   { factor: 0.195, unit: 'km',    label: 'Long-haul Flight' },
    auto_rickshaw: { factor: 0.09,  unit: 'km',    label: 'Auto Rickshaw' },
    bicycle:       { factor: 0,     unit: 'km',    label: 'Bicycle / Walk' },
  },
  food: {
    beef:              { factor: 27.0, unit: 'kg',    label: 'Beef' },
    lamb:              { factor: 24.5, unit: 'kg',    label: 'Lamb / Mutton' },
    pork:              { factor: 7.6,  unit: 'kg',    label: 'Pork' },
    chicken:           { factor: 6.9,  unit: 'kg',    label: 'Chicken' },
    fish:              { factor: 3.0,  unit: 'kg',    label: 'Fish / Seafood' },
    eggs:              { factor: 4.5,  unit: 'dozen', label: 'Eggs (dozen)' },
    dairy:             { factor: 3.2,  unit: 'liter', label: 'Dairy / Milk' },
    vegetables:        { factor: 0.5,  unit: 'kg',    label: 'Vegetables' },
    vegan_meal:        { factor: 0.9,  unit: 'meal',  label: 'Vegan Meal' },
    vegetarian_meal:   { factor: 1.5,  unit: 'meal',  label: 'Vegetarian Meal' },
    meat_meal:         { factor: 4.0,  unit: 'meal',  label: 'Non-Veg Meal' },
    food_waste:        { factor: 2.5,  unit: 'kg',    label: 'Food Waste' },
  },
  energy: {
    electricity_in:  { factor: 0.82,  unit: 'kWh',   label: 'Electricity (India)' },
    electricity_us:  { factor: 0.386, unit: 'kWh',   label: 'Electricity (US)' },
    electricity_eu:  { factor: 0.276, unit: 'kWh',   label: 'Electricity (EU)' },
    electricity_uk:  { factor: 0.233, unit: 'kWh',   label: 'Electricity (UK)' },
    natural_gas:     { factor: 0.202, unit: 'kWh',   label: 'Natural Gas' },
    lpg:             { factor: 1.51,  unit: 'liter', label: 'LPG / Cylinder' },
    diesel_gen:      { factor: 2.68,  unit: 'liter', label: 'Diesel Generator' },
    solar:           { factor: 0.05,  unit: 'kWh',   label: 'Solar (lifecycle)' },
  },
  shopping: {
    clothing:        { factor: 10.0,  unit: 'item',   label: 'Clothing Item' },
    electronics:     { factor: 70.0,  unit: 'item',   label: 'Electronics' },
    smartphone:      { factor: 70.0,  unit: 'item',   label: 'Smartphone' },
    laptop:          { factor: 422.0, unit: 'item',   label: 'Laptop' },
    furniture:       { factor: 50.0,  unit: 'item',   label: 'Furniture Piece' },
    online_delivery: { factor: 0.5,   unit: 'parcel', label: 'Online Delivery' },
    plastic_bag:     { factor: 0.002, unit: 'bag',    label: 'Plastic Bag' },
  },
  offset: {
    tree_planted:  { factor: -21.0, unit: 'tree', label: 'Tree Planted (annual)' },
    renewable_kwh: { factor: -0.82, unit: 'kWh',  label: 'Renewable Energy Credit' },
  },
} as const;

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type Category = keyof typeof EMISSION_FACTORS;
export type ActivityType<C extends Category> = keyof (typeof EMISSION_FACTORS)[C];

/** The shape of a single emission factor entry */
export interface EmissionFactorEntry {
  factor: number;
  unit: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Emission calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the carbon emission (in kg CO₂e) for a given activity.
 *
 * @param category     One of the top-level keys in `EMISSION_FACTORS`.
 * @param activityType A sub-key within that category.
 * @param quantity     Amount of the unit consumed (must be a positive number).
 * @returns            Rounded kg CO₂e value, or `0` for unknown inputs.
 *
 * @example
 *   calculateEmission('transport', 'car_petrol', 50)
 *   // → 10.5  (50 km × 0.21 kg/km)
 *
 *   calculateEmission('offset', 'tree_planted', 2)
 *   // → -42   (2 trees × -21 kg/tree — a negative offset)
 */
export function calculateEmission(
  category: string,
  activityType: string,
  quantity: number,
): number {
  const cat = EMISSION_FACTORS[category as Category];
  if (!cat) return 0;

  const entry = (cat as Record<string, EmissionFactorEntry>)[activityType];
  if (!entry) return 0;

  return Math.round(entry.factor * quantity * 100) / 100;
}

/**
 * Returns the `EmissionFactorEntry` for a given category + type pair, or
 * `undefined` if the combination is not recognised.
 *
 * Prefer this over direct object indexing so callers don't need to cast.
 */
export function getEmissionFactor(
  category: string,
  activityType: string,
): EmissionFactorEntry | undefined {
  const cat = EMISSION_FACTORS[category as Category];
  if (!cat) return undefined;
  return (cat as Record<string, EmissionFactorEntry>)[activityType];
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

/**
 * Per-capita CO₂ benchmarks used for comparison charts and streak logic.
 *
 * - `india_daily` / `india_annual`: India average (~1.9 t/yr → ~5.2 kg/day)
 * - `global_daily` / `global_annual`: World average (~4.5 t/yr → ~12.3 kg/day)
 * - `paris_target_annual`: 2-tonne annual budget required for Paris 2 °C goal
 */
export const BENCHMARKS = {
  india_daily: 5.2,
  india_annual: 1900,
  global_daily: 12.3,
  global_annual: 4500,
  /** 2,000 kg/yr = 2 tonnes — the Paris Agreement 2 °C pathway target */
  paris_target_annual: 2000,
} as const;
