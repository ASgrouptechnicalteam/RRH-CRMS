import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const updated = await prisma.siteVisitBooking.update({
    where: { id: 1266 },
    data: { project_manager_id: 8884309 },
  });
  console.log('updated pm:', updated.project_manager_id);
  await prisma.$disconnect();
})();
