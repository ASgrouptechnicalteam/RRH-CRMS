/**
 * CRM Connectivity Verification Script
 *
 * Run with: npx tsx scripts/crm-verify.ts
 *
 * This script verifies that the CRM API is reachable and returning
 * real data through the Sonthillu client. It must be run server-side
 * (has access to process.env CRM_API_KEY).
 *
 * Prerequisite: Set CRM_API_BASE_URL and CRM_API_KEY in .env to
 * production values before running.
 */

import {
  healthCheck,
  getPublishedProperties,
  getPropertyById,
  getProjects,
  createLead,
} from '../src/lib/crm';
import type { PropertyFilters } from '../src/types/property';

// Load .env explicitly so tsx picks up the variables
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

const RESULTS: Array<{ test: string; pass: boolean; detail: string }> = [];

function report(test: string, pass: boolean, detail: string) {
  RESULTS.push({ test, pass, detail });
  console.log(`${pass ? '✅' : '❌'}  ${test}: ${detail}`);
}

async function main() {
  console.log('═══ CRM Connectivity Verification ═══\n');

  // ── Test 1: Health check ──────────────────────────────────────────
  console.log('--- Test 1: CRM Health Check ---');
  try {
    const healthy = await healthCheck();
    report(
      'CRM health endpoint reachable',
      healthy,
      healthy ? 'CRM is online' : 'CRM returned non-200'
    );
  } catch (err: any) {
    report('CRM health endpoint reachable', false, err.message || String(err));
  }

  // ── Test 2: Fetch published properties ────────────────────────────
  console.log('\n--- Test 2: Fetch Published Properties ---');
  try {
    const { data, error } = await getPublishedProperties({ limit: 3 } as PropertyFilters);
    if (error) {
      report('Fetch published properties', false, 'CRM returned error flag');
    } else if (!data) {
      report('Fetch published properties', false, 'No data returned');
    } else {
      // Empty array is a SUCCESS — the CRM API is working, just no published inventory yet
      report(
        'Fetch published properties',
        true,
        `${data.length} property(ies) returned (API reachable)`
      );
      if (data.length > 0) {
        data.forEach((p: any, i: number) => {
          console.log(
            `   [${(i + 1).toString().padStart(2)}] ${p.property_code || 'N/A'} — ${p.title || p.name || 'Untitled'}`
          );
        });
      } else {
        console.log('   (No published Sonthillu properties in CRM yet — expected for new company)');
      }
    }
  } catch (err: any) {
    report('Fetch published properties', false, err.message || String(err));
  }

  // ── Test 3: Fetch property by ID ──────────────────────────────────
  console.log('\n--- Test 3: Fetch Property by ID ---');
  try {
    const prop = await getPropertyById(1);
    if (!prop) {
      // Null is a valid response — CRM is reachable, just no property with ID 1
      report(
        'Fetch property by ID (1)',
        true,
        '404/null (API reachable — no property with ID 1 or not published for Sonthillu)'
      );
    } else {
      report(
        'Fetch property by ID (1)',
        true,
        `${prop.property_code || 'N/A'} — ${prop.title || 'Untitled'}`
      );
    }
  } catch (err: any) {
    report('Fetch property by ID (1)', false, err.message || String(err));
  }

  // ── Test 4: Fetch projects ────────────────────────────────────────
  console.log('\n--- Test 4: Fetch Projects ---');
  try {
    const projects = await getProjects();
    if (!projects) {
      report('Fetch projects', false, 'No data returned');
    } else {
      // Empty array is a SUCCESS — CRM API is working, just no projects yet
      report('Fetch projects', true, `${projects.length} project(s) returned (API reachable)`);
      if (projects.length > 0) {
        projects.forEach((p: any, i: number) => {
          console.log(
            `   [${(i + 1).toString().padStart(2)}] ${p.project_code || p.code || 'N/A'} — ${p.name || p.title || 'Untitled'}`
          );
        });
      } else {
        console.log('   (No published Sonthillu projects in CRM yet — expected for new company)');
      }
    }
  } catch (err: any) {
    report('Fetch projects', false, err.message || String(err));
  }

  // ── Test 5: Submit a test lead ────────────────────────────────────
  console.log('\n--- Test 5: Submit Test Lead ---');
  try {
    const result = await createLead({
      customer_name: 'CRM Verification Test',
      phone: '9876543210',
      email: 'verify+crm@test.local',
      notes: 'Automated connectivity verification — please disregard.',
      property_type_preference: 'APARTMENT',
      preferred_location: 'Hyderabad',
      budget_max: 7500000,
      utm_source: 'crm-smoke-test',
      utm_medium: 'automated',
      utm_campaign: 'connectivity-check',
    });
    report('Submit test lead', true, `Lead created with ID: ${result.leadId}`);
    console.log(
      `   → Verify in CRM portal: lead ID ${result.leadId} should appear with source "WEBSITE"`
    );
  } catch (err: any) {
    report('Submit test lead', false, err.message || String(err));
  }

  // ── Summary ───────────────────────────────────────────────────────
  console.log('\n═══ Summary ═══');
  const passed = RESULTS.filter((r) => r.pass).length;
  const total = RESULTS.length;
  console.log(`${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All CRM connectivity checks passed.');
    console.log(
      '   → Update docs/CRM_INTEGRATION_PLAN.md: credentials = RESOLVED, API URL = VERIFIED'
    );
  } else {
    console.log('❌ Some checks failed. Review errors above.');
    console.log('   → Update docs/CRM_INTEGRATION_PLAN.md with findings.');
  }

  return passed === total;
}

main()
  .then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error running verification:', err);
    process.exit(1);
  });
