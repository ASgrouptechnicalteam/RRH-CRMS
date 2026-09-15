import React from 'react';
import {
  Building2,
  Home,
  Layout,
  Building,
  Warehouse,
  Tent,
  Tractor,
  Map,
  Cpu,
} from 'lucide-react';

// Shared between AddPropertyWizard.tsx (standalone properties) and
// BulkUnitWizard.tsx (project units) — extracted in Phase 2.20 so both
// wizards use one definition instead of two copies drifting apart.

/** A single unit row when adding multiple units to a project */
export interface UnitRow {
  id: string;
  unit_label: string; // Plot 1, Unit A-101, etc.
  plot_number: string;
  survey_number: string;
  area: number | '';
  facing: string;
  is_corner: boolean;
  is_park_facing: boolean;
  is_road_facing: boolean;
  is_main_road_facing: boolean;
  extra_charges: number; // sum of selected premiums for this specific unit
  base_price: number;
  final_price: number;
}

export const PROPERTY_CATEGORIES = [
  { id: 'APARTMENT', label: 'Apartment / Flat', icon: Building2, group: 'RESIDENTIAL' },
  { id: 'INDEPENDENT_HOUSE', label: 'Independent House', icon: Home, group: 'RESIDENTIAL' },
  { id: 'DUPLEX', label: 'Duplex', icon: Layout, group: 'RESIDENTIAL' },
  { id: 'INDEPENDENT_FLOOR', label: 'Independent Floor', icon: Building, group: 'RESIDENTIAL' },
  { id: 'VILLA', label: 'Villa', icon: Home, group: 'RESIDENTIAL' },
  { id: 'PENTHOUSE', label: 'Penthouse', icon: Building, group: 'RESIDENTIAL' },
  { id: 'STUDIO', label: 'Studio / 1RK', icon: Warehouse, group: 'RESIDENTIAL' },
  { id: 'PLOT', label: 'Residential Plot', icon: Map, group: 'LAND' },
  { id: 'FARM_HOUSE', label: 'Farm House', icon: Tent, group: 'LAND' },
  { id: 'AGRICULTURAL_LAND', label: 'Agricultural / Farm Land', icon: Tractor, group: 'LAND' },
  { id: 'COMMERCIAL_SHOP', label: 'Commercial Shop', icon: Building, group: 'COMMERCIAL' },
  { id: 'COMMERCIAL_OFFICE', label: 'Commercial Office', icon: Cpu, group: 'COMMERCIAL' },
];

export const AMENITIES_BY_TYPE: Record<string, { label: string; icon: string }[]> = {
  RESIDENTIAL: [
    { label: '24/7 Security', icon: '🔒' },
    { label: 'Power Backup', icon: '⚡' },
    { label: 'Lift / Elevator', icon: '🛗' },
    { label: 'Club House', icon: '🏛️' },
    { label: 'Swimming Pool', icon: '🏊' },
    { label: 'Gymnasium', icon: '💪' },
    { label: 'Park / Garden', icon: '🌳' },
    { label: 'Reserved Parking', icon: '🅿️' },
    { label: 'Visitor Parking', icon: '🚗' },
    { label: 'Maintenance Staff', icon: '👷' },
    { label: 'Children Play Area', icon: '🛝' },
    { label: 'Jogging Track', icon: '🏃' },
    { label: 'Indoor Games', icon: '🎮' },
    { label: 'CCTV Surveillance', icon: '📹' },
    { label: 'Water Purifier', icon: '💧' },
    { label: 'Rainwater Harvesting', icon: '🌧️' },
    { label: 'Solar Lighting', icon: '☀️' },
    { label: 'EV Charging', icon: '🔋' },
    { label: 'Wi-Fi Zone', icon: '📶' },
    { label: 'Landscaped Gardens', icon: '🌿' },
  ],
  LAND: [
    { label: 'Compound Wall', icon: '🧱' },
    { label: 'Corner Plot', icon: '📐' },
    { label: 'Water Connection', icon: '💧' },
    { label: 'Electricity Connection', icon: '⚡' },
    { label: 'Sewage / Drainage', icon: '🚰' },
    { label: '40ft Road', icon: '🛤️' },
    { label: '60ft Road', icon: '🛤️' },
    { label: '80ft Road', icon: '🛤️' },
    { label: 'Fencing', icon: '🌿' },
    { label: 'Bore Well', icon: '🪣' },
    { label: 'Parks', icon: '🌳' },
    { label: 'Street Lights', icon: '💡' },
    { label: 'Underground Electricity', icon: '⚡' },
    { label: 'Underground Drainage', icon: '🚰' },
    { label: 'Overhead Tank', icon: '🏗️' },
    { label: 'Jogging Track', icon: '🏃' },
    { label: 'Clubhouse', icon: '🏛️' },
    { label: 'CCTV', icon: '📹' },
    { label: 'Security', icon: '🔒' },
    { label: 'Solar Lighting', icon: '☀️' },
  ],
  COMMERCIAL: [
    { label: 'Parking', icon: '🅿️' },
    { label: 'Power Backup', icon: '⚡' },
    { label: 'Lift', icon: '🛗' },
    { label: 'Security', icon: '🔒' },
    { label: 'Fire Safety', icon: '🧯' },
    { label: 'HVAC', icon: '❄️' },
    { label: 'Internet / Wi-Fi', icon: '📶' },
    { label: 'EV Charging', icon: '🔋' },
    { label: 'Signage Space', icon: '📋' },
    { label: 'High Footfall', icon: '👥' },
  ],
};

export const AREA_UNITS = [
  { value: 'SQFT', label: 'Sq.Ft' },
  { value: 'SQYD', label: 'Sq.Yd' },
  { value: 'ACRE', label: 'Acres' },
  { value: 'GUNTA', label: 'Guntas' },
];

// #16: BHK was free text ("3 BHK", "3bhk", "3 Bed" — every variant meaning
// the same thing) so nothing could filter or group by it reliably. A fixed
// list plus "Other" (per #14's escape-hatch audit) fixes the data without
// blocking the rare non-standard unit.
export const BHK_OPTIONS = [
  'Studio / 1RK',
  '1 BHK',
  '1.5 BHK',
  '2 BHK',
  '2.5 BHK',
  '3 BHK',
  '3.5 BHK',
  '4 BHK',
  '4.5 BHK',
  '5 BHK',
  '5+ BHK',
];

// #12: mirrors Property.listing_type.
export const LISTING_TYPE_OPTIONS: { value: 'NEW' | 'RESALE'; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'RESALE', label: 'Resale' },
];

export const FACING_OPTIONS = [
  { value: 'EAST', label: 'East' },
  { value: 'WEST', label: 'West' },
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'NORTH_EAST', label: 'North-East' },
  { value: 'NORTH_WEST', label: 'North-West' },
  { value: 'SOUTH_EAST', label: 'South-East' },
  { value: 'SOUTH_WEST', label: 'South-West' },
];

export const PINCODE_API_BASE = 'https://api.postalpincode.in/pincode';

export const convertToSqft = (val: number | '', unit: string) => {
  if (!val) return 0;
  const v = Number(val);
  switch (unit) {
    case 'SQYD':
      return v * 9;
    case 'ACRE':
      return v * 43560;
    case 'GUNTA':
      return v * 1089;
    default:
      return v;
  }
};

export const groupForCategory = (catId: string) =>
  PROPERTY_CATEGORIES.find((c) => c.id === catId)?.group || 'RESIDENTIAL';

// A second, more granular grouping used for the Properties list's category
// tabs and PropertyForm.tsx's type-branched fields (Rebuild Phase 5, plan
// section 8.3: "All/Land/Villas/Houses/Flats/Commercial/Other" — the
// RESIDENTIAL/LAND/COMMERCIAL split above is too coarse for that: it lumps
// villas, houses and flats together, which need different field sets).
export type CategoryTabGroup = 'LAND' | 'VILLA' | 'HOUSE' | 'FLAT' | 'COMMERCIAL' | 'OTHER';

export const CATEGORY_TAB_GROUPS: { key: CategoryTabGroup; label: string }[] = [
  { key: 'LAND', label: 'Land' },
  { key: 'VILLA', label: 'Villas' },
  { key: 'HOUSE', label: 'Houses' },
  { key: 'FLAT', label: 'Flats' },
  { key: 'COMMERCIAL', label: 'Commercial' },
  { key: 'OTHER', label: 'Other' },
];

export function categoryTabGroupOf(category: string): CategoryTabGroup {
  if (['PLOT', 'FARM_HOUSE', 'AGRICULTURAL_LAND'].includes(category)) return 'LAND';
  if (category === 'VILLA') return 'VILLA';
  if (['INDEPENDENT_HOUSE', 'DUPLEX', 'INDEPENDENT_FLOOR'].includes(category)) return 'HOUSE';
  if (['APARTMENT', 'PENTHOUSE', 'STUDIO'].includes(category)) return 'FLAT';
  if (['COMMERCIAL_SHOP', 'COMMERCIAL_OFFICE'].includes(category)) return 'COMMERCIAL';
  return 'OTHER';
}

// PropertyCreateSchema requires brand_type ('SONTHILLU' | 'RADHA_REAL_HOMES') but neither
// wizard has a dedicated control for it — derive it from the category group, matching
// the business split confirmed in the implementation plan: Sonthillu = residential/land,
// Radha Real Homes = commercial.
export const brandForCategory = (catId: string): 'SONTHILLU' | 'RADHA_REAL_HOMES' =>
  groupForCategory(catId) === 'COMMERCIAL' ? 'RADHA_REAL_HOMES' : 'SONTHILLU';

export const formatINR = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(1)} L`
      : `₹${n.toLocaleString('en-IN')}`;

/** Looks up state/district/locality from an Indian pincode via the public postal API. */
export async function lookupPincode(
  pc: string,
  onFound: (state: string, city: string, locality: string, fullLocation: string) => void,
  showError: (e: { message: string }) => void,
  showToast: (msg: string, type: 'success' | 'error') => void,
): Promise<void> {
  const pin = pc.trim();
  if (!/^\d{6}$/.test(pin)) {
    showError({ message: 'Please enter a valid 6-digit pincode' });
    return;
  }

  const fetchWithTimeout = async (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const attemptFetch = async (retries = 1): Promise<void> => {
    try {
      const res = await fetchWithTimeout(`${PINCODE_API_BASE}/${pin}`, 8000);
      const data = await res.json();
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        onFound(po.State, po.District, po.Name, `${po.Name}, ${po.District}, ${po.State}`);
        showToast('Location auto-filled from pincode', 'success');
      } else {
        showError({ message: 'Invalid pincode or no details found. Please enter manually.' });
      }
    } catch (err) {
      if (retries > 0) {
        await attemptFetch(retries - 1);
      } else {
        showError({ message: 'Failed to fetch pincode details. Please enter manually.' });
      }
    }
  };

  await attemptFetch();
}

export const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
    <div className="px-4 py-3 bg-white border-b border-slate-100">
      <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">
    {children}
    {required && <span className="text-rose-500 ml-0.5">*</span>}
  </label>
);

export const inputCls =
  'w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-400 text-sm bg-white transition-colors';
export const selectCls =
  'w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 bg-white text-sm';
