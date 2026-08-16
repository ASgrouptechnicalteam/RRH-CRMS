export const SALES_STAGE_LABELS: Record<string, string> = {
  PROSPECT_QUALIFIED: 'Qualified Prospect',
  REQUIREMENT_CAPTURED: 'Requirement Captured',
  PROPERTY_SHORTLISTED: 'Property Shortlisted',
  SITE_VISIT_PLANNED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Site Visit Completed',
  PROPERTY_INTEREST_CONFIRMED: 'Property Interest Confirmed',
  NEGOTIATION: 'Price & Terms Negotiation',
  BOOKING_INITIATED: 'Booking Initiated',
  BOOKED: 'Booked',
  DROPPED: 'Dropped'
};

export const SALES_STAGE_COLORS: Record<string, string> = {
  PROSPECT_QUALIFIED: 'bg-slate-100 text-slate-700 border-slate-200',
  REQUIREMENT_CAPTURED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  PROPERTY_SHORTLISTED: 'bg-blue-100 text-blue-700 border-blue-200',
  SITE_VISIT_PLANNED: 'bg-amber-100 text-amber-700 border-amber-200',
  SITE_VISIT_COMPLETED: 'bg-orange-100 text-orange-700 border-orange-200',
  PROPERTY_INTEREST_CONFIRMED: 'bg-pink-100 text-pink-700 border-pink-200',
  NEGOTIATION: 'bg-purple-100 text-purple-700 border-purple-200',
  BOOKING_INITIATED: 'bg-teal-100 text-teal-700 border-teal-200',
  BOOKED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DROPPED: 'bg-rose-100 text-rose-700 border-rose-200'
};

export const SALES_STAGES_ORDER = [
  'PROSPECT_QUALIFIED',
  'REQUIREMENT_CAPTURED',
  'PROPERTY_SHORTLISTED',
  'SITE_VISIT_PLANNED',
  'SITE_VISIT_COMPLETED',
  'PROPERTY_INTEREST_CONFIRMED',
  'NEGOTIATION',
  'BOOKING_INITIATED',
  'BOOKED',
  'DROPPED'
];
