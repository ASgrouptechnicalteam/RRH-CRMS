import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('DmTest@123', 12);
  await prisma.employee.update({ where: { id: 8884345 }, data: { password_hash: hash, first_login_done: true } });
  console.log('password set');
  await prisma.$disconnect();
})();
