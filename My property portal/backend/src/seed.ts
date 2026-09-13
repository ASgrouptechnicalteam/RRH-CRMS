import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const HASH_ROUNDS = 10; // Reduced for seeding speed

const main = async () => {
  console.log('Starting seed...');

  // ─── Roles ──────────────────────────────────────────────────────────────
  const mdRole = await prisma.role.upsert({
    where: { name: 'MD' },
    update: {},
    create: { name: 'MD', description: 'Managing Director' },
  });
  const pmRole = await prisma.role.upsert({
    where: { name: 'PM' },
    update: {},
    create: { name: 'PM', description: 'Project Manager' },
  });
  const fmRole = await prisma.role.upsert({
    where: { name: 'FM' },
    update: {},
    create: { name: 'FM', description: 'Field Manager' },
  });
  const demRole = await prisma.role.upsert({
    where: { name: 'DEM' },
    update: {},
    create: { name: 'DEM', description: 'Data Entry Manager' },
  });
  console.log('✓ Roles:', [mdRole, pmRole, fmRole, demRole].map((r) => r.name).join(', '));

  // ─── Employees ──────────────────────────────────────────────────────────
  const pw = await bcrypt.hash('Test@1234', HASH_ROUNDS);
  const md = await prisma.employee.upsert({
    where: { employeeId: 'EMP-MD-001' },
    update: {},
    create: {
      employeeId: 'EMP-MD-001',
      name: 'Rajesh Kumar (MD)',
      phone: '9876543210',
      email: 'md@myportal.com',
      passwordHash: pw,
      roleId: mdRole.id,
    },
  });
  const pm = await prisma.employee.upsert({
    where: { employeeId: 'EMP-PM-001' },
    update: {},
    create: {
      employeeId: 'EMP-PM-001',
      name: 'Priya Sharma (PM)',
      phone: '9876543211',
      email: 'pm@myportal.com',
      passwordHash: pw,
      roleId: pmRole.id,
    },
  });
  const fm = await prisma.employee.upsert({
    where: { employeeId: 'EMP-FM-001' },
    update: {},
    create: {
      employeeId: 'EMP-FM-001',
      name: 'Mohan Singh (FM)',
      phone: '9876543212',
      email: 'fm@myportal.com',
      passwordHash: pw,
      roleId: fmRole.id,
    },
  });
  const dem = await prisma.employee.upsert({
    where: { employeeId: 'EMP-DEM-001' },
    update: {},
    create: {
      employeeId: 'EMP-DEM-001',
      name: 'Sunita Devi (DEM)',
      phone: '9876543213',
      email: 'dem@myportal.com',
      passwordHash: pw,
      roleId: demRole.id,
    },
  });
  console.log('✓ Employees:', [md, pm, fm, dem].map((e) => e.name).join(', '));

  // ─── Company ────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { code: 'MYPROP' },
    update: {},
    create: { code: 'MYPROP', name: 'My Property Developers Pvt. Ltd.' },
  });
  console.log('✓ Company:', company.name);

  // ─── Projects ───────────────────────────────────────────────────────────
  const projectA = await prisma.project.upsert({
    where: { code: 'ALPHA-001' },
    update: {},
    create: {
      code: 'ALPHA-001',
      name: 'Alpha Residency',
      companyId: company.id,
      location: 'Electronic City, Bangalore',
      status: 'Under Construction',
      totalUnits: 100,
      developmentStatus: 'Active',
      constructionStatus: '45%',
      description: 'Premium 2BHK and 3BHK apartments in Electronic City Phase 2.',
    },
  });
  const projectB = await prisma.project.upsert({
    where: { code: 'BETA-001' },
    update: {},
    create: {
      code: 'BETA-001',
      name: 'Beta Heights',
      companyId: company.id,
      location: 'Whitefield, Bangalore',
      status: 'Planning',
      totalUnits: 50,
      developmentStatus: 'Planning',
      description: 'Luxury villas in Whitefield with clubhouse amenities.',
    },
  });
  console.log('✓ Projects:', projectA.name, '&', projectB.name);

  // ─── Assignments ────────────────────────────────────────────────────────
  await prisma.assignment.upsert({
    where: { id: 'assign-pm-alpha' },
    update: {},
    create: { id: 'assign-pm-alpha', employeeId: pm.id, projectId: projectA.id },
  });
  await prisma.assignment.upsert({
    where: { id: 'assign-fm-alpha' },
    update: {},
    create: { id: 'assign-fm-alpha', employeeId: fm.id, projectId: projectA.id },
  });
  console.log('✓ Assignments: PM & FM → Alpha Residency');

  // ─── Properties ─────────────────────────────────────────────────────────
  const propA = await prisma.property.upsert({
    where: { id: 'prop-a101' },
    update: {},
    create: {
      id: 'prop-a101',
      projectId: projectA.id,
      propertyNumber: 'A-101',
      type: '2BHK',
      area: 1200,
      price: 6000000,
      status: 'Booked',
    },
  });
  const propB = await prisma.property.upsert({
    where: { id: 'prop-a102' },
    update: {},
    create: {
      id: 'prop-a102',
      projectId: projectA.id,
      propertyNumber: 'A-102',
      type: '3BHK',
      area: 1600,
      price: 8000000,
      status: 'Available',
    },
  });
  const propBeta = await prisma.property.upsert({
    where: { id: 'prop-b201' },
    update: {},
    create: {
      id: 'prop-b201',
      projectId: projectB.id,
      propertyNumber: 'B-201',
      type: 'Villa',
      area: 3000,
      price: 15000000,
      status: 'Available',
    },
  });
  console.log('✓ Properties: A-101, A-102, B-201');

  // ─── Customers ──────────────────────────────────────────────────────────
  const custPw = await bcrypt.hash('Customer@1234', HASH_ROUNDS);
  const custA = await prisma.customer.upsert({
    where: { phone: '9000000001' },
    update: {},
    create: {
      name: 'Arjun Reddy (Cust A)',
      phone: '9000000001',
      email: 'arjun@example.com',
      passwordHash: custPw,
      address: '45 HSR Layout, Bangalore',
      status: 'Active',
    },
  });
  const custB = await prisma.customer.upsert({
    where: { phone: '9000000002' },
    update: {},
    create: {
      name: 'Meena Patel (Cust B)',
      phone: '9000000002',
      email: 'meena@example.com',
      passwordHash: custPw,
      address: '22 Koramangala, Bangalore',
      status: 'Active',
    },
  });
  console.log('✓ Customers:', custA.name, '&', custB.name);

  // ─── Policy & Acceptance ─────────────────────────────────────────────────
  // PolicyAcceptance uses version string, not policyId relation
  const policyExists = await prisma.policyAcceptance.findFirst({
    where: { customerId: custA.id, version: '1.0' },
  });
  if (!policyExists) {
    await prisma.policyAcceptance.create({ data: { customerId: custA.id, version: '1.0' } });
    await prisma.policyAcceptance.create({ data: { customerId: custB.id, version: '1.0' } });
  }
  console.log('✓ Policy acceptances created');

  // ─── Link Property to Customer A ────────────────────────────────────────
  await prisma.property.update({ where: { id: propA.id }, data: { customerId: custA.id } });

  // ─── Booking ────────────────────────────────────────────────────────────
  await prisma.booking.upsert({
    where: { id: 'booking-001' },
    update: {},
    create: {
      id: 'booking-001',
      customerId: custA.id,
      propertyId: propA.id,
      date: new Date('2024-03-01'),
      status: 'Active',
    },
  });
  console.log('✓ Booking created for Customer A → A-101');

  // ─── EMI Schedule ───────────────────────────────────────────────────────
  const emi = await prisma.eMISchedule.upsert({
    where: { id: 'emi-001' },
    update: {},
    create: {
      id: 'emi-001',
      propertyId: propA.id,
      totalAmount: 6000000,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      status: 'Active',
    },
  });
  // Create 3 installments
  const instDates = ['2024-04-01', '2024-05-01', '2024-06-01'];
  const insts = [];
  for (let i = 0; i < 3; i++) {
    const inst = await prisma.installment.upsert({
      where: { id: `inst-00${i + 1}` },
      update: {},
      create: {
        id: `inst-00${i + 1}`,
        emiScheduleId: emi.id,
        amountDue: 500000,
        dueDate: new Date(instDates[i]),
        status: i === 0 ? 'Paid' : 'Pending',
      },
    });
    insts.push(inst);
  }
  console.log('✓ EMI schedule with 3 installments created');

  // ─── Approved payment (installment 1) ───────────────────────────────────
  await prisma.payment.upsert({
    where: { id: 'payment-001' },
    update: {},
    create: {
      id: 'payment-001',
      installmentId: insts[0].id,
      amount: 500000,
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'UTR202403010001',
      verificationStatus: 'Approved',
    },
  });

  // ─── Pending payment (installment 2, partial) ───────────────────────────
  await prisma.payment.upsert({
    where: { id: 'payment-002' },
    update: {},
    create: {
      id: 'payment-002',
      installmentId: insts[1].id,
      amount: 250000,
      paymentMethod: 'NEFT',
      referenceNumber: 'UTR202404010001',
      verificationStatus: 'Pending Verification',
    },
  });
  console.log('✓ Payments: 1 approved (inst-1), 1 pending (inst-2 partial)');

  // ─── Content ────────────────────────────────────────────────────────────
  await prisma.carousel.upsert({
    where: { id: 'carousel-001' },
    update: {},
    create: {
      id: 'carousel-001',
      title: 'Alpha Residency — Pre-Launch Offer',
      description: 'Book your dream home and save up to 15% before April 30.',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
      priority: 1,
      status: 'Published',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 90),
      createdBy: md.id,
    },
  });
  await prisma.popup.upsert({
    where: { id: 'popup-001' },
    update: {},
    create: {
      id: 'popup-001',
      title: 'Limited Offer!',
      message: 'Book any 2BHK before April 30 and get free modular kitchen worth ₹2,00,000.',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      priority: 1,
      status: 'Published',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      createdBy: md.id,
    },
  });
  await prisma.offer.upsert({
    where: { id: 'offer-001' },
    update: {},
    create: {
      id: 'offer-001',
      title: '15% Early Bird Discount',
      description: 'Book before April 2024 and save 15% on base price.',
      offerType: 'Discount',
      status: 'Published',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 60),
      createdBy: md.id,
    },
  });
  await prisma.announcement.upsert({
    where: { id: 'announcement-001' },
    update: {},
    create: {
      id: 'announcement-001',
      title: 'Welcome to My Property Portal',
      content:
        'We have launched our new customer portal! Track your property, payments, and documents online.',
      status: 'Published',
      createdBy: md.id,
    },
  });
  console.log('✓ Content: Carousel, Popup, Offer, Announcement');

  // ─── Notifications for Customer A ───────────────────────────────────────
  const existingNotif = await prisma.notification.findFirst({
    where: { userId: custA.id, type: 'WELCOME' },
  });
  if (!existingNotif) {
    await prisma.notification.create({
      data: {
        userId: custA.id,
        userType: 'Customer',
        type: 'WELCOME',
        title: 'Welcome to My Property!',
        message: 'Your account has been activated. Track your property and payments here.',
        isRead: false,
      },
    });
    await prisma.notification.create({
      data: {
        userId: custA.id,
        userType: 'Customer',
        type: 'PAYMENT_APPROVED',
        title: 'Payment Approved',
        message: 'Your payment of ₹5,00,000 for Installment 1 has been approved.',
        isRead: false,
      },
    });
  }
  console.log('✓ Notifications created for Customer A');

  // ─── Property & Construction Updates ────────────────────────────────────
  const existUpdate = await prisma.propertyUpdate.findFirst({ where: { propertyId: propA.id } });
  if (!existUpdate) {
    await prisma.propertyUpdate.create({
      data: {
        propertyId: propA.id,
        stage: 'Foundation Complete',
        details: 'Pile foundation work completed. Ready for superstructure.',
        createdBy: fm.id,
      },
    });
    await prisma.constructionUpdate.create({
      data: {
        projectId: projectA.id,
        stage: 'Structural Work',
        percentage: 45,
        remarks: 'Floors 1-5 slabs complete. Floor 6 in progress.',
        createdBy: fm.id,
      },
    });
  }
  console.log('✓ Property & Construction updates added');

  console.log('\n===== SEED COMPLETE =====');
  console.log('─────────────────────────────────────────');
  console.log('Login credentials:');
  console.log('  MD:       EMP-MD-001  | Test@1234');
  console.log('  PM:       EMP-PM-001  | Test@1234');
  console.log('  FM:       EMP-FM-001  | Test@1234');
  console.log('  DEM:      EMP-DEM-001 | Test@1234');
  console.log('  Cust A:   9000000001  | Customer@1234  → A-101 property');
  console.log('  Cust B:   9000000002  | Customer@1234  → no properties');
  console.log('─────────────────────────────────────────');
  console.log('Assignments:');
  console.log('  PM (EMP-PM-001) → Alpha Residency ONLY');
  console.log('  FM (EMP-FM-001) → Alpha Residency ONLY');
  console.log('  Neither has access to Beta Heights');
};

main()
  .catch((e) => {
    console.error('SEED FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
