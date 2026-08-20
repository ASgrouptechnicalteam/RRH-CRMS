import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sonthillu E2E Local Fixtures
 *
 * Deterministic development fixtures for the Sonthillu website team's E2E testing.
 * Guards against production execution and requires SONTHILLU_LOCAL_API_KEY env var.
 *
 * Idempotent (upsert-based): safe to re-run without creating duplicates.
 */

// Production guard — never run this in production
if (process.env.NODE_ENV === 'production') {
  console.error('🚨 sonthillu-e2e fixtures aborted: NODE_ENV is production. ' +
    'Set NODE_ENV=development (or unset) to run local fixtures.');
  process.exit(1);
}

// Runtime guard — require the local API key env var
if (!process.env.SONTHILLU_LOCAL_API_KEY) {
  console.error('🚨 sonthillu-e2e fixtures aborted: missing SONTHILLU_LOCAL_API_KEY env var.');
  process.exit(1);
}

async function main() {
  console.log('🏗️  Running Sonthillu E2E local fixtures...');

  // --- Step 1: Fetch existing org (no creates — avoid duplicates) ---
  const company = await prisma.company.findFirst({
    where: { code: 'RRH' },
  });
  if (!company) {
    console.error('🚨 Could not find company with code=RRH. Run seed.ts first.');
    process.exit(1);
  }

  const branch = await prisma.branch.findFirst({
    where: { company_id: company.id },
  });
  if (!branch) {
    console.error('🚨 No branches found for company_id', company.id);
    process.exit(1);
  }

  const admin = await prisma.employee.findFirst({
    where: {
      company_id: company.id,
      role: { hasSome: ['Admin (Technical)'] }, // prisma Role relation
      // fallback: just check role_name via raw if needed
    },
  });
  if (!admin) {
    console.error('🚨 No admin employee found for company_id', company.id);
    process.exit(1);
  }

  // --- Step 2: Upsert API Key mapped to the primary company ---
  await prisma.publicApiKey.upsert({
    where: { api_key: process.env.SONTHILLU_LOCAL_API_KEY },
    update: { is_active: true, company_id: company.id },
    create: {
      api_key: process.env.SONTHILLU_LOCAL_API_KEY,
      company_id: company.id,
      is_active: true,
    },
  });
  console.log(`✅ API key upserted for company_id=${company.id}`);

  // --- Step 3: Upsert exactly 3 Sonthillu properties ---
  const propertiesData = [
    {
      property_code: 'SONTHILLU-E2E-LOC-001',
      company_id: company.id,
      brand_type: 'SONTHILLU',
      category: 'APARTMENT',
      title: 'Hyderabad Banjara Hills Villa',
      description: 'Luxury 2BHK apartment in Banjara Hills',
      price: 10000000,
      area_sqft: 2000,
      location: 'Banjara Hills',
      city: 'Hyderabad',
      locality: 'Banjara Hills',
      bedrooms: 2,
      bathrooms: 2,
      facing: 'EAST',
      listing_type: 'NEW',
      possession_status: 'READY_TO_MOVE',
      status: 'LIVE',
    },
    {
      property_code: 'SONTHILLU-E2E-LOC-002',
      company_id: company.id,
      brand_type: 'SONTHILLU',
      category: 'APARTMENT',
      title: 'Secunderabad Miyapur Apartment',
      description: '2BHK apartment in Miyapur',
      price: 5000000,
      area_sqft: 1200,
      location: 'Miyapur',
      city: 'Secunderabad',
      locality: 'Miyapur',
      bedrooms: 2,
      bathrooms: 2,
      facing: 'WEST',
      listing_type: 'NEW',
      possession_status: 'READY_TO_MOVE',
      status: 'LIVE',
    },
    {
      property_code: 'SONTHILLU-E2E-LOC-003',
      company_id: company.id,
      brand_type: 'SONTHILLU',
      category: 'APARTMENT',
      title: 'Hyderabad Miyapur Apartment',
      description: '2BHK apartment in Miyapur',
      price: 7500000,
      area_sqft: 1500,
      location: 'Miyapur, Hyderabad',
      city: 'Hyderabad',
      locality: 'Miyapur',
      bedrooms: 2,
      bathrooms: 2,
      facing: 'SOUTH',
      listing_type: 'NEW',
      possession_status: 'READY_TO_MOVE',
      status: 'LIVE',
    },
  ] as const;

  const createdProps: any[] = [];
  for (const pd of propertiesData) {
    const prop = await prisma.property.upsert({
      where: { property_code: pd.property_code },
      update: pd,
      create: pd,
    });
    createdProps.push(prop);
    console.log(`✅ Property upserted: ${prop.property_code}`);
  }

  // --- Step 4: Upsert PropertyPublication records for all 3 properties ---
  for (const prop of createdProps) {
    await prisma.propertyPublication.upsert({
      where: { property_id_company_id: { property_id: prop.id, company_id: company.id } },
      update: { is_published: true, published_at: new Date() },
      create: {
        property_id: prop.id,
        company_id: company.id,
        is_published: true,
        published_at: new Date(),
      },
    });
    console.log(`✅ Publication upserted for property_id=${prop.id}`);
  }

  console.log('🏗️  Sonthillu E2E local fixtures completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ sonthillu-e2e fixtures error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });