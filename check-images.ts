import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  const imgs = await p.propertyImage.findMany({ select: { image_url: true } });
  const unique = new Set(imgs.map(i => i.image_url));
  console.log('--- UNIQUE IMAGE URLS ---');
  console.log([...unique]);
  await p.$disconnect();
}

run().catch(console.error);
