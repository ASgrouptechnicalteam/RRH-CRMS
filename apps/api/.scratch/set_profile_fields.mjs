import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  await prisma.employee.update({
    where: { id: 8884345 },
    data: {
      current_address: '123 Test Street, Kompally, Hyderabad',
      email: 'phase21test@example.com',
    },
  });
  console.log('updated');
  await prisma.$disconnect();
})();
