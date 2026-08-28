// Diagnostic: inspect XAMPP test_db — what tables exist, are §1/§2 applied?
const { PrismaClient } = require('@prisma/client');
const TEST_DSN = 'mysql://root:@127.0.0.1:3306/test_db';

async function main() {
  const p = new PrismaClient({ datasources: { db: { url: TEST_DSN } } });
  try {
    const info = await p.$queryRaw<{ TABLE_NAME: string }[]>`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' ORDER BY TABLE_NAME`;
    const names = info.map(r => r.TABLE_NAME);
    console.log(`Tables in test_db (${names.length}):`);
    names.forEach(n => console.log('  - ' + n));

    // §1 Lead fields
    const leadCols = await p.$queryRaw<{ COLUMN_NAME: string }[]>`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME='lead' ORDER BY ORDINAL_POSITION`;
    console.log('\nLead table columns:');
    leadCols.forEach(c => console.log('  - ' + c.COLUMN_NAME));

    const hasExitReason = leadCols.some(r => r.COLUMN_NAME === 'exit_reason');
    const hasExitedFrom = leadCols.some(r => r.COLUMN_NAME === 'exited_from_status');
    const hasDemoSched = leadCols.some(r => r.COLUMN_NAME === 'demo_scheduled_at');
    const hasDemoHandler = leadCols.some(r => r.COLUMN_NAME === 'demo_handler_id');

    console.log('\n§1 Lead fields check:');
    console.log('  exit_reason:         ' + (hasExitReason ? 'PRESENT' : 'MISSING'));
    console.log('  exited_from_status:  ' + (hasExitedFrom ? 'PRESENT' : 'MISSING'));
    console.log('  demo_scheduled_at:   ' + (hasDemoSched ? 'PRESENT' : 'MISSING'));
    console.log('  demo_handler_id:     ' + (hasDemoHandler ? 'PRESENT' : 'MISSING'));

    // §2 site visit booking status default
    const svCols = await p.$queryRaw<{ COLUMN_NAME: string; COLUMN_DEFAULT: string | null }[]>`SELECT COLUMN_NAME, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME='sitevisitbooking' AND COLUMN_NAME='status'`;    svCols.forEach(c => console.log('\nSiteVisitBooking.status default: ' + (c.COLUMN_DEFAULT ?? 'NULL')));

    // New tables
    console.log('\nNew tables check:');
    for (const t of ['sitevisitproperty', 'sitevisitreassignment', 'messagetemplate']) {
      const r = await p.$queryRaw<{ cnt: number }[]>`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME=${t}`;
      console.log('  ' + t + ': ' + (r[0].cnt === 1 ? 'EXISTS' : 'MISSING'));
    }
    // §7 Document tables
    for (const t of ['document', 'documentsignature']) {
      const r = await p.$queryRaw<{ cnt: number }[]>`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME=${t}`;
      console.log('  ' + t + ': ' + (r[0].cnt === 1 ? 'PRESENT (§7 not applied)' : 'ABSENT'));
    }

    // Migrations table
    const first = await p.$queryRaw<{ cnt: number }[]>`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME='_prisma_migrations'`;
    console.log('\n_prisma_migrations table: ' + (first[0].cnt === 1 ? 'EXISTS' : 'MISSING'));

  } catch (e) {
    console.log('ERROR:', e.code, String(e).slice(0, 300));
  } finally {
    await p.$disconnect();
  }
}
main().then(() => process.exit(0)).catch(() => process.exit(1));
