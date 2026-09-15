import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  await prisma.siteVisitBooking.update({ where: { id: 1269 }, data: { project_manager_id: 8884309 } });
  await prisma.lead.update({ where: { id: 22343 }, data: { status: 'SITE_VISIT_SCHEDULED' } });
  console.log('prepped');
  await prisma.$disconnect();
})();
