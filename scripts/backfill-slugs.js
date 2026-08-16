const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(input) {
  if (!input || !input.trim()) return '';
  return input.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const props = await prisma.property.findMany({ where: { slug: null } });
  for (const p of props) {
    const base = slugify(`${p.title} ${p.location} ${p.category}`);
    let slug = base;
    let counter = 0;
    while (true) {
      const existing = await prisma.property.findFirst({ where: { slug, company_id: p.company_id } });
      if (!existing) break;
      counter++;
      slug = `${base}-${counter}`;
    }
    await prisma.property.update({ where: { id: p.id }, data: { slug } });
    console.log(`Updated property ${p.id}: ${slug}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());