import { prisma } from '../lib/prisma';


const p = prisma;

export interface PropertyMatchResult {
  propertyId: number;
  propertyCode: string;
  title: string;
  brandType: string;
  category: string;
  price: number;
  areaSqft: number;
  location: string;
  bedrooms?: number;
  facing?: string;
  matchScore: number; // 0 to 100
  matchBreakdown: {
    locationMatch: boolean;
    budgetMatch: boolean;
    categoryMatch: boolean;
  };
  whatsAppUrl?: string;
  whatsAppText?: string;
}

export const findMatchingPropertiesForLead = async (leadId: number): Promise<PropertyMatchResult[]> => {
  const lead = await p.lead.findUnique({
    where: { id: leadId },
    include: { assigned_to: true },
  });

  if (!lead) return [];

  // Fetch all LIVE properties for lead's company
  const liveProperties = await p.property.findMany({
    where: {
      company_id: lead.company_id,
      status: 'LIVE',
    },
  });

  const results: PropertyMatchResult[] = [];

  for (const prop of liveProperties) {
    let score = 0;
    let locationMatch = false;
    let budgetMatch = false;
    let categoryMatch = false;

    // 1. Location Match (Weight: 40 points)
    if (lead.preferred_location && prop.location) {
      const prefLoc = lead.preferred_location.toLowerCase();
      const propLoc = prop.location.toLowerCase();

      if (prefLoc.includes(propLoc) || propLoc.includes(prefLoc)) {
        score += 40;
        locationMatch = true;
      } else {
        // Partial word match check
        const prefWords = prefLoc.split(/[\s,/]+/);
        const hasWordMatch = prefWords.some((w: string) => w.length > 3 && propLoc.includes(w));
        if (hasWordMatch) {
          score += 25;
          locationMatch = true;
        }
      }
    } else {
      score += 20; // neutral fallback
    }

    // 2. Budget Fit (Weight: 40 points)
    if (lead.budget_max && lead.budget_max > 0) {
      if (prop.price <= lead.budget_max) {
        score += 40;
        budgetMatch = true;
      } else if (prop.price <= lead.budget_max * 1.15) {
        score += 20; // 15% budget flex match
        budgetMatch = true;
      }
    } else {
      score += 20; // fallback if no budget max set
    }

    // 3. Category & BHK Fit (Weight: 20 points)
    if (lead.property_type_preference) {
      const prefType = lead.property_type_preference.toLowerCase();
      const propCat = prop.category.toLowerCase();
      const propBrand = prop.brand_type.toLowerCase();

      if (prefType.includes(propCat) || propCat.includes(prefType) || prefType.includes(propBrand)) {
        score += 20;
        categoryMatch = true;
      }
    } else {
      score += 10;
    }

    // Format WhatsApp text payload
    const text = generateWhatsAppText(lead, prop, lead.assigned_to);
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(text)}`;

    results.push({
      propertyId: prop.id,
      propertyCode: prop.property_code,
      title: prop.title,
      brandType: prop.brand_type,
      category: prop.category,
      price: prop.price,
      areaSqft: prop.area_sqft,
      location: prop.location,
      bedrooms: (prop.bedrooms ?? undefined) as number | undefined,
      facing: (prop.facing ?? undefined) as string | undefined,
      matchScore: Math.min(100, score),
      matchBreakdown: {
        locationMatch,
        budgetMatch,
        categoryMatch,
      },
      whatsAppText: text,
      whatsAppUrl,
    });
  }

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
};

export const generateWhatsAppText = (lead: any, prop: any, agent: any): string => {
  const brandName = prop.brand_type === 'SONTHILLU' ? 'SONTHILLU RESIDENTIAL' : 'RADHA REAL HOMES';

  return `🏡 *EXCLUSIVE PROPERTY PROPOSAL FROM ${brandName}*

Dear *${lead.customer_name}*,

We found a premium property matching your exact requirements!

📌 *Title*: ${prop.title}
📍 *Location*: ${prop.location}
📐 *Area*: ${prop.area_sqft} sq.ft (${prop.bedrooms ? prop.bedrooms + ' BHK' : prop.category})
🧭 *Facing*: ${prop.facing || 'East'}
💰 *Asking Price*: ₹${(prop.price / 100000).toFixed(1)} Lakhs

📝 *Highlights*: ${prop.description || 'Prime location with high growth potential and immediate registration.'}

📞 *Your Dedicated Relationship Manager*:
${agent ? agent.full_name : 'Radha Real Homes Advisory Desk'} (${agent ? agent.phone : '+91 99000 11222'})

Reply to this message or call us directly to schedule an exclusive site visit!`;
};
