// Canonical area/measurement logic for the frontend — mirrors
// apps/api/src/shared/measurement.ts EXACTLY (same constants, same function
// names). This is for display and live-typing feedback only; the server
// remains the sole source of truth for any persisted or priced number. If you
// ever need to change a conversion factor, change it in both files together —
// letting them drift apart is exactly the bug this rebuild fixed (the old
// AddPropertyWizard and BulkUnitWizard each had their own incompatible
// AREA_UNITS table).

export const AreaUnit = {
  SQFT: 'SQFT',
  SQYD: 'SQYD',
  SQM: 'SQM',
  ACRE: 'ACRE',
  GUNTA: 'GUNTA',
  CENT: 'CENT',
  ANKANAM: 'ANKANAM',
  HECTARE: 'HECTARE',
} as const;

export type AreaUnitType = (typeof AreaUnit)[keyof typeof AreaUnit];

export const SQFT_PER_UNIT: Record<AreaUnitType, number> = {
  SQFT: 1,
  SQYD: 9,
  SQM: 10.763910416709722,
  ACRE: 43560,
  GUNTA: 1089,
  CENT: 435.6,
  ANKANAM: 72,
  HECTARE: 107639.10416709722,
};

export const AREA_UNIT_LABELS: Record<AreaUnitType, string> = {
  SQFT: 'Sq.Ft',
  SQYD: 'Sq.Yds',
  SQM: 'Sq.M',
  ACRE: 'Acres',
  GUNTA: 'Guntas',
  CENT: 'Cents',
  ANKANAM: 'Ankanams',
  HECTARE: 'Hectares',
};

export const PriceBasis = {
  CARPET: 'CARPET',
  BUILT_UP: 'BUILT_UP',
  SUPER_BUILT_UP: 'SUPER_BUILT_UP',
  PLOT_AREA: 'PLOT_AREA',
  LUMPSUM: 'LUMPSUM',
} as const;

export type PriceBasisType = (typeof PriceBasis)[keyof typeof PriceBasis];

export const PRICE_BASIS_LABELS: Record<PriceBasisType, string> = {
  CARPET: 'Carpet Area',
  BUILT_UP: 'Built-up Area',
  SUPER_BUILT_UP: 'Super Built-up Area',
  PLOT_AREA: 'Plot Area',
  LUMPSUM: 'Lump Sum (not area-based)',
};

const CONVERSION_DP = 8;

function round(value: number, dp = 2): number {
  const f = Math.pow(10, dp);
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function toSqft(value: number, unit: AreaUnitType): number {
  if (!Number.isFinite(value)) return 0;
  return round(value * SQFT_PER_UNIT[unit], CONVERSION_DP);
}

export function fromSqft(sqft: number, unit: AreaUnitType): number {
  if (!Number.isFinite(sqft)) return 0;
  return round(sqft / SQFT_PER_UNIT[unit], CONVERSION_DP);
}

export function convertArea(value: number, from: AreaUnitType, to: AreaUnitType): number {
  if (from === to) return round(value, CONVERSION_DP);
  return fromSqft(toSqft(value, from), to);
}

export function normalizeArea(value: number, unit: AreaUnitType) {
  const sqft = toSqft(value, unit);
  return {
    area_value: round(value, 4),
    area_unit: unit,
    area_sqft: round(sqft, 2),
    area_sqyd: round(sqft / SQFT_PER_UNIT.SQYD, 2),
  };
}

export function areaFromDimensions(lengthFt: number, widthFt: number) {
  const sqft = round((lengthFt || 0) * (widthFt || 0), 2);
  return { area_sqft: sqft, area_sqyd: round(sqft / SQFT_PER_UNIT.SQYD, 2) };
}

export function dimensionsDisagree(
  enteredSqft: number,
  lengthFt: number,
  widthFt: number,
  tolerance = 0.02,
): boolean {
  if (!enteredSqft || !lengthFt || !widthFt) return false;
  const derived = lengthFt * widthFt;
  if (derived <= 0) return false;
  return Math.abs(derived - enteredSqft) / enteredSqft > tolerance;
}

export function loadingFactor(
  carpetSqft?: number | null,
  superBuiltUpSqft?: number | null,
): number | null {
  if (!carpetSqft || !superBuiltUpSqft || carpetSqft <= 0) return null;
  return round((superBuiltUpSqft - carpetSqft) / carpetSqft, 4);
}

export interface AreaValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateFlatAreas(areas: {
  carpet_area_sqft?: number | null;
  built_up_area_sqft?: number | null;
  super_built_up_area_sqft?: number | null;
}): AreaValidationIssue[] {
  const issues: AreaValidationIssue[] = [];
  const {
    carpet_area_sqft: carpet,
    built_up_area_sqft: builtUp,
    super_built_up_area_sqft: sbua,
  } = areas;

  if (carpet && builtUp && carpet >= builtUp) {
    issues.push({
      field: 'built_up_area_sqft',
      message: 'Built-up area must be greater than carpet area.',
      severity: 'error',
    });
  }
  if (builtUp && sbua && builtUp >= sbua) {
    issues.push({
      field: 'super_built_up_area_sqft',
      message: 'Super built-up area must be greater than built-up area.',
      severity: 'error',
    });
  }
  if (carpet && sbua && !builtUp && carpet >= sbua) {
    issues.push({
      field: 'super_built_up_area_sqft',
      message: 'Super built-up area must be greater than carpet area.',
      severity: 'error',
    });
  }

  const lf = loadingFactor(carpet, sbua);
  if (lf !== null && lf > 0.6) {
    issues.push({
      field: 'super_built_up_area_sqft',
      message: `Loading factor is ${(lf * 100).toFixed(0)}% — unusually high. Check the areas.`,
      severity: 'warning',
    });
  }

  return issues;
}

export function formatAreaDual(
  areaSqft?: number | null,
  preferredUnit: AreaUnitType = 'SQYD',
): string {
  if (!areaSqft) return '—';
  const sqftStr = `${Math.round(areaSqft).toLocaleString('en-IN')} ${AREA_UNIT_LABELS.SQFT}`;
  if (preferredUnit === 'SQFT') return sqftStr;
  const converted = fromSqft(areaSqft, preferredUnit);
  const convertedStr = `${round(converted, 2).toLocaleString('en-IN')} ${AREA_UNIT_LABELS[preferredUnit]}`;
  return `${convertedStr} (${sqftStr})`;
}
