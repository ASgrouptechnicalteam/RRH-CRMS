import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATABASE VERIFICATION ---');

  try {
    // 1 & 2. Verify Project table and columns
    const projectCount = await prisma.project.count();
    console.log(`Project table exists. Rows: ${projectCount}`);

    // 4 & 8 & 9. Verify Property.project_id and existing rows
    const propertyCount = await prisma.property.count();
    const propertyWithNullProject = await prisma.property.count({
      where: { project_id: null }
    });
    console.log(`Property table exists. Total rows: ${propertyCount}. Rows with project_id=NULL: ${propertyWithNullProject}`);
    if (propertyCount !== propertyWithNullProject) {
      console.error('WARNING: Not all properties have project_id=NULL');
    }

    // 10. Verify Booking rows
    // const bookingCount = await prisma.booking.count();
    // console.log(`Booking rows intact: ${bookingCount}`);

    // 11. Verify SiteVisitBooking rows
    const siteVisitCount = await prisma.siteVisitBooking.count();
    console.log(`SiteVisitBooking rows intact: ${siteVisitCount}`);

    // Query indexes and constraints from information_schema
    const dbNameResult: any = await prisma.$queryRaw`SELECT DATABASE() as db`;
    const dbName = dbNameResult[0].db;
    
    console.log(`\nChecking schema constraints for DB: ${dbName}`);
    
    const constraints: any = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, TABLE_NAME, CONSTRAINT_TYPE 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ${dbName} 
      AND TABLE_NAME IN ('Project', 'Property')
    `;

    const expectedConstraints = [
      'Project_project_code_key',
      'Project_company_id_fkey',
      'Project_branch_id_fkey',
      'Project_assigned_pm_id_fkey',
      'Property_project_id_fkey'
    ];

    expectedConstraints.forEach(expected => {
      const found = constraints.find((c: any) => c.CONSTRAINT_NAME === expected);
      console.log(`${expected}: ${found ? 'EXISTS' : 'MISSING'}`);
    });

    const indexes: any = await prisma.$queryRaw`
      SELECT INDEX_NAME, TABLE_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ${dbName} 
      AND TABLE_NAME IN ('Project', 'Property')
    `;

    const expectedIndexes = [
      'Project_company_id_idx',
      'Project_branch_id_idx',
      'Project_assigned_pm_id_idx',
      'Property_project_id_idx'
    ];

    expectedIndexes.forEach(expected => {
      const found = indexes.find((i: any) => i.INDEX_NAME === expected);
      console.log(`${expected}: ${found ? 'EXISTS' : 'MISSING'}`);
    });

    console.log('--- VERIFICATION COMPLETE ---');
  } catch (error: any) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
