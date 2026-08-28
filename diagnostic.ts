// Diagnostic: what's actually in the XAMPP test_db?
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'mysql://root:@127.0.0.1:3306/test_db' } } });

(async () => {
  console.log('=== TABLES IN test_db ===');
  const tables = await p.$queryRaw`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' ORDER BY TABLE_NAME`;
  const names = tables.map(t => t.TABLE_NAME).filter(Boolean);
  names.forEach(n => console.log('  ' + n));
  console.log(`Total: ${names.length} tables\n`);

  console.log('=== §1/§2 LEAD COLUMNS ===');
  const leadCols = await p.$queryRaw`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME='lead' ORDER BY ORDINAL_POSITION`;
  console.log('Lead table columns:');
  leadCols.forEach(c => console.log(`  ${c.COLUMN_NAME}  [${c.DATA_TYPE}]  nullable=${c.IS_NULLABLE}`));
  const hasExitReason = leadCols.some(c => String(c.COLUMN_NAME).toLowerCase() === 'exit_reason');
  const hasDemoSched = leadCols.some(c => String(c.COLUMN_NAME).toLowerCase() === 'demo_scheduled_at');
  const hasDemoHandler = leadCols.some(c => String(c.COLUMN_NAME).toLowerCase() === 'demo_handler_id');
  const hasExitedFrom = leadCols.some(c => String(c.COLUMN_NAME).toLowerCase() === 'exited_from_status');
  console.log(`\nNew §1 Lead fields present?:\n  exit_reason         = ${hasExitReason}\n  exited_from_status  = ${hasExitedFrom}\n  demo_scheduled_at   = ${hasDemoSched}\n  demo_handler_id     = ${hasDemoHandler}\n`);

  console.log('=== §2 SITE VISIT BOOKING STATUS DEFAULT ===');
  const svCols = await p.$queryRaw`SELECT COLUMN_NAME, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME='sitevisitbooking' AND COLUMN_NAME='status'`;
  svCols.forEach(c => console.log(`  sitevisitbooking.status default = ${c.COLUMN_DEFAULT}`));

  console.log('=== §1/§2 NEW TABLES ===');
  const newTables = ['sitevisitproperty', 'sitevisitreassignment', 'messagetemplate'];
  for (const t of newTables) {
    const exists = await p.$queryRaw`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME=${t}`;
    console.log(`  ${t}: ${exists[0].cnt === 1 ? 'EXISTS' : 'MISSING'}`);
  }

  console.log('=== §7 DOCUMENT TABLES (should be gone) ===');
  const docTables = ['document', 'documentsignature'];
  for (const t of docTables) {
    const exists = await p.$queryRaw`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME=${t}`;
    console.log(`  ${t}: ${exists[0].cnt === 1 ? 'STILL PRESENT (§7 not applied)' : 'REMOVED'}`);
  }

  console.log('=== _prisma_migrations ===');
  const migExists = await p.$queryRaw`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='test_db' AND TABLE_NAME='_prisma_migrations'`;
  console.log(`  _prisma_migrations: ${migExists[0].cnt === 1 ? 'EXISTS' : 'MISSING (baseline not set)'}`);

  console.log('\n=== SCHEMA VALIDATION ===');
  const { execSync } = require('child_process');
  execSync('npx prisma validate', { cwd: process.cwd(), encoding: 'utf8' })
    .split('\n').filter(l => l.includes('Validation') || l.includes('Error'))
    .forEach(l => console.log(l));
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.code, e.message.slice(0, 200)); process.exit(1); });


¯\_(ツ)_/¯
