/**
 * LOCAL DEMO DATA SEED SCRIPT
 *
 * Populates local MySQL (sonthillu_web) with demo data for admin analytics.
 *
 * ⚠️  LOCAL DEMO DATA ONLY — NEVER runs against production CRM.
 *    This script does NOT import or call any CRM functions.
 *    All data goes into the local Prisma-managed MySQL database.
 *
 * Run: npx tsx prisma/seed-demo.ts
 *
 * Idempotent: checks for existing data before creating.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hyderabad locations for realistic demo data
const LOCATIONS = [
  'Banjarahills',
  'Gachibowli',
  'HITEC City',
  'Jubilee Hills',
  'Madhapur',
  'Kondapur',
  'Financial District',
  'Nanakramguda',
  'Serilingampally',
  'Lanco Circle',
  'Manikonda',
  'Uppal',
  'Secunderabad',
  'Hitech City',
];

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE'];
const BHK_CONFIGS = [1, 2, 3, 4];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

function generateSearchContext(): string {
  return JSON.stringify({
    location: randomElement(LOCATIONS),
    propertyType: randomElement(PROPERTY_TYPES),
    bedrooms: randomElement(BHK_CONFIGS),
    minBudget: randomInt(30, 200) * 100000,
    maxBudget: randomInt(50, 500) * 100000,
    listingType: randomElement(['SALE', 'NEW_CONSTRUCTION']),
    possessionStatus:
      Math.random() > 0.3 ? randomElement(['IMMEDIATE', 'UND_CONSTRUCTION', 'PLANNED']) : null,
  });
}

function generateMetadata(resultCount: number): string {
  return JSON.stringify({
    resultCount,
    responseTimeMs: randomInt(200, 2000),
  });
}

function generateAiMetadata(): string {
  const locations = LOCATIONS.slice(0, 5);
  const types = ['APARTMENT', 'VILLA'];
  return JSON.stringify({
    parsedIntent: {
      location: randomElement(locations),
      propertyType: randomElement(types),
      bedrooms: randomElement(BHK_CONFIGS),
      budget: randomInt(50, 300) * 100000,
    },
    clarificationNeeded: Math.random() > 0.7,
    resultCount: Math.random() > 0.2 ? randomInt(1, 20) : 0,
  });
}

async function seedHeroSlides() {
  const existing = await prisma.heroSlide.findMany({ where: { active: true } });
  if (existing.length > 0) {
    console.log(`  Hero slides: ${existing.length} already exist, skipping.`);
    return;
  }

  console.log('  Creating 4 hero slides...');
  await prisma.heroSlide.createMany({
    data: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop',
        title: 'Find Your Dream Home in Hyderabad',
        subtitle: 'Premium apartments, villas & independent houses in prime locations',
        ctaLabel: 'Explore Properties',
        ctaUrl: '/properties',
        displayOrder: 1,
        active: true,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=600&fit=crop',
        title: 'Exclusive Villas in Gachibowli',
        subtitle: '3 & 4 BHK villas with modern amenities and private gardens',
        ctaLabel: 'View Villas',
        ctaUrl: '/properties?propertyType=VILLA',
        displayOrder: 2,
        active: true,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=600&fit=crop',
        title: 'Apartments in HITEC City',
        subtitle: '2 & 3 BHK flats near IT hubs — ideal for professionals',
        ctaLabel: 'Browse Apartments',
        ctaUrl: '/properties?propertyType=APARTMENT',
        displayOrder: 3,
        active: true,
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=600&fit=crop',
        title: 'Independent Houses in Jubilee Hills',
        subtitle: 'Luxury independent homes with spacious layouts and premium finishes',
        ctaLabel: 'See Properties',
        ctaUrl: '/properties?propertyType=INDEPENDENT_HOUSE',
        displayOrder: 4,
        active: true,
      },
    ],
  });
  console.log('  Created 4 hero slides.');
}

const CUSTOMER_DATA = [
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '9876543210',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@email.com',
    phone: '9876543211',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Suresh',
    lastName: 'Reddy',
    email: 'suresh.reddy@email.com',
    phone: '9876543212',
    sellerStatus: 'PENDING_VERIFICATION',
  },
  {
    firstName: 'Anjali',
    lastName: 'Patel',
    email: 'anjali.patel@email.com',
    phone: '9876543213',
    sellerStatus: 'PENDING_VERIFICATION',
  },
  {
    firstName: 'Venkatesh',
    lastName: 'Rao',
    email: 'venkatesh.rao@email.com',
    phone: '9876543214',
    sellerStatus: 'VERIFIED',
  },
  {
    firstName: 'Lakshmi',
    lastName: 'Nair',
    email: 'lakshmi.nair@email.com',
    phone: '9876543215',
    sellerStatus: 'VERIFIED',
  },
  {
    firstName: 'Mohan',
    lastName: 'Singh',
    email: 'mohan.singh@email.com',
    phone: '9876543216',
    sellerStatus: 'VERIFIED',
  },
  {
    firstName: 'Deepa',
    lastName: 'Iyer',
    email: 'deepa.iyer@email.com',
    phone: '9876543217',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Arun',
    lastName: 'Mehta',
    email: 'arun.mehta@email.com',
    phone: '9876543218',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Kavya',
    lastName: 'Raman',
    email: 'kavya.raman@email.com',
    phone: '9876543219',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Naveen',
    lastName: 'Krishna',
    email: 'naveen.krishna@email.com',
    phone: '9876543220',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Meera',
    lastName: 'Joshi',
    email: 'meera.joshi@email.com',
    phone: '9876543221',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Ravi',
    lastName: 'Kiran',
    email: 'ravi.kiran@email.com',
    phone: '9876543222',
    sellerStatus: 'SUSPENDED',
  },
  {
    firstName: 'Sneha',
    lastName: 'Reddy',
    email: 'sneha.reddy@email.com',
    phone: '9876543223',
    sellerStatus: 'NONE',
  },
  {
    firstName: 'Vikram',
    lastName: 'Malhotra',
    email: 'vikram.malhotra@email.com',
    phone: '9876543224',
    sellerStatus: 'NONE',
  },
];

const PASSWORD_HASH = bcrypt.hashSync('demo123', 12);

async function seedCustomers() {
  const existing = await prisma.customer.count();
  if (existing >= CUSTOMER_DATA.length) {
    console.log(`  Customers: ${existing} already exist, skipping.`);
    return;
  }

  console.log(`  Creating ${CUSTOMER_DATA.length} demo customers...`);
  for (const c of CUSTOMER_DATA) {
    await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        passwordHash: PASSWORD_HASH,
        sellerStatus: c.sellerStatus,
        emailVerifiedAt: new Date(),
      },
    });
  }
  console.log(`  Created ${CUSTOMER_DATA.length} customers.`);
}

async function seedActivityEvents() {
  // Check if we already have lots of events
  const existing = await prisma.activityEvent.count();
  if (existing > 200) {
    console.log(`  Activity events: ${existing} already exist, skipping.`);
    return;
  }

  console.log('  Seeding activity events...');
  const events: Prisma.ActivityEventCreateInput[] = [];
  const now = Date.now();

  // Helper to add an event
  const add = (
    eventName: string,
    customerIndex?: number,
    anonymousId?: string,
    searchContext?: string,
    metadata?: string,
    propertyId?: number,
    daysBack = 0
  ): void => {
    const occurredAt = new Date(now - randomInt(0, daysBack) * 24 * 60 * 60 * 1000);
    events.push({
      eventName,
      customer: customerIndex != null ? { connect: { id: customerIndex + 1 } } : undefined,
      anonymousId: anonymousId ?? `anon_${randomInt(1, 50)}`,
      searchContext: searchContext ?? undefined,
      metadata: metadata ?? undefined,
      propertyId: propertyId ?? undefined,
      occurredAt,
    });
  };

  // Generate 200 searches across 30 days
  for (let i = 0; i < 200; i++) {
    const resultCount = Math.random() > 0.25 ? randomInt(1, 30) : 0;
    add(
      'search_submitted',
      undefined,
      `anon_${randomInt(1, 50)}`,
      generateSearchContext(),
      generateMetadata(resultCount),
      undefined,
      30
    );
  }

  // 80 property views
  for (let i = 0; i < 80; i++) {
    add(
      'property_view',
      undefined,
      `anon_${randomInt(1, 50)}`,
      undefined,
      undefined,
      randomInt(1, 50),
      20
    );
  }

  // 50 shortlist adds
  for (let i = 0; i < 50; i++) {
    add('shortlist_added', randomInt(0, 5), undefined, undefined, undefined, randomInt(1, 50), 15);
  }

  // 30 compare adds
  for (let i = 0; i < 30; i++) {
    add('compare_added', randomInt(0, 5), undefined, undefined, undefined, randomInt(1, 50), 15);
  }

  // 60 AI searches
  for (let i = 0; i < 60; i++) {
    add(
      'ai_query_submitted',
      undefined,
      `anon_${randomInt(1, 50)}`,
      undefined,
      generateAiMetadata(),
      undefined,
      25
    );
  }

  // 30 AI interpretation successes
  for (let i = 0; i < 30; i++) {
    add('ai_interpretation_succeeded', undefined, `anon_${randomInt(1, 50)}`);
  }

  // 10 AI interpretation failures
  for (let i = 0; i < 10; i++) {
    add('ai_interpretation_failed', undefined, `anon_${randomInt(1, 50)}`);
  }

  // 15 AI result clicks
  for (let i = 0; i < 15; i++) {
    add('ai_result_clicked', undefined, `anon_${randomInt(1, 50)}`);
  }

  // 10 AI shortlists from AI
  for (let i = 0; i < 10; i++) {
    add('ai_shortlist_added', randomInt(0, 5), undefined, undefined, undefined, randomInt(1, 50));
  }

  // 5 AI compares from AI
  for (let i = 0; i < 5; i++) {
    add('ai_compare_added', randomInt(0, 5), undefined, undefined, undefined, randomInt(1, 50));
  }

  // 8 AI enquiries
  for (let i = 0; i < 8; i++) {
    add('ai_enquiry_submitted', randomInt(0, 5), undefined, undefined, undefined, randomInt(1, 50));
  }

  // 20 recommendation impressions
  for (let i = 0; i < 20; i++) {
    add(
      'recommendation_impression',
      undefined,
      `anon_${randomInt(1, 50)}`,
      undefined,
      undefined,
      randomInt(1, 50),
      10
    );
  }

  // 12 recommendation clicks
  for (let i = 0; i < 12; i++) {
    add(
      'recommendation_click',
      undefined,
      `anon_${randomInt(1, 50)}`,
      undefined,
      undefined,
      randomInt(1, 50),
      10
    );
  }

  // 15 enquiry submissions
  for (let i = 0; i < 15; i++) {
    add(
      'enquiry_submitted',
      randomInt(0, 8),
      undefined,
      undefined,
      undefined,
      randomInt(1, 50),
      20
    );
  }

  // 8 callback requests
  for (let i = 0; i < 8; i++) {
    add('callback_requested', randomInt(0, 5), undefined, undefined, undefined, undefined, 15);
  }

  // 5 consultation requests
  for (let i = 0; i < 5; i++) {
    add('consultation_requested', randomInt(0, 3), undefined, undefined, undefined, undefined, 15);
  }

  // 5 seller appraisal requests
  for (let i = 0; i < 5; i++) {
    add(
      'seller_appraisal_requested',
      randomInt(5, 7),
      undefined,
      undefined,
      undefined,
      undefined,
      15
    );
  }

  // 10 unsupported AI intents
  for (let i = 0; i < 10; i++) {
    add('ai_unsupported_intent', undefined, `anon_${randomInt(1, 50)}`);
  }

  // 8 clarification requests
  for (let i = 0; i < 8; i++) {
    add('ai_clarification_requested', undefined, `anon_${randomInt(1, 50)}`);
  }

  // 3 AI failures
  for (let i = 0; i < 3; i++) {
    add('ai_interpretation_failed', undefined, `anon_${randomInt(1, 50)}`);
  }

  console.log(`  Inserting ${events.length} activity events...`);
  // Insert in batches to avoid overwhelming the DB
  const BATCH_SIZE = 50;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    await prisma.activityEvent.createMany({ data: batch, skipDuplicates: true });
  }
  console.log(`  Inserted ${events.length} activity events.`);
}

async function main() {
  console.log('\n=== LOCAL DEMO DATA SEED ===');
  console.log('⚠️  This script ONLY writes to local MySQL. It does NOT touch the CRM.');
  console.log('');

  console.log('1. Seeding hero slides...');
  await seedHeroSlides();

  console.log('2. Seeding customers...');
  await seedCustomers();

  console.log('3. Seeding activity events...');
  await seedActivityEvents();

  console.log('\n=== Done ===');
  console.log('Demo data is now in local MySQL (sonthillu_web).');
  console.log('Admin analytics pages should show meaningful data.');
  console.log('NOTHING was written to the production CRM.');
}

main()
  .catch((err) => {
    console.error('\n[seed-demo] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
