export const PROPERTY_TYPE_OPTIONS = [
  { value: 'RESIDENTIAL_APARTMENT', label: 'Apartment' },
  { value: 'RESIDENTIAL_VILLA', label: 'Villa / House' },
  { value: 'RESIDENTIAL_PLOT', label: 'Plot / Land' },
  { value: 'COMMERCIAL_OFFICE', label: 'Commercial Office' },
  { value: 'COMMERCIAL_SHOP', label: 'Commercial Shop' },
  { value: 'AGRICULTURAL_LAND', label: 'Agricultural' }
];

export const getPropertyTypeLabel = (val?: string | null): string => {
  if (!val) return 'Not set';
  const match = PROPERTY_TYPE_OPTIONS.find(o => o.value === val);
  return match ? match.label : val;
};
