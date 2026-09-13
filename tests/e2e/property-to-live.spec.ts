import { test, expect } from '@playwright/test';
import { prisma } from '../../apps/api/src/lib/prisma';
import { PropertyService } from '../../apps/api/src/services/property.service';
import { login } from './helpers';
import { Roles, Permissions } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Phase 5.2 smoke test: walks a standalone property from creation to LIVE.
//
// Scope decision (documented, not silent): the multi-step AddPropertyWizard
// UI was already extensively exercised by Phase 2.16's dedicated Jest tests
// AND by live browser verification during this session's Property/Project
// redesign work (2.16-2.20) — re-walking its many steps here would be
// duplicative, not novel coverage. This smoke test instead calls the exact
// same PropertyService entry points that wizard ultimately calls (creation,
// PM verification, DM polish, MD approval) to drive the full approval
// pipeline end to end in one continuous run, then verifies the REAL
// Properties page — where an actual user would look to confirm a listing
// went live — reflects the final state.
test.describe('Phase 5.2 - Property journey: creation through LIVE', () => {
  let propertyId: number;
  let mdUser: TokenPayload;
  const title = `E2E Property ${Date.now()}`;

  test.beforeAll(async () => {
    const md = await prisma.employee.findFirst({ where: { employee_code: 'RRH-TST-000' } });
    if (!md)
      throw new Error('Deterministic MD test user (RRH-TST-000) not found — did global-setup run?');
    mdUser = {
      employeeId: md.id,
      employeeCode: md.employee_code,
      companyId: md.company_id,
      branchId: null,
      roles: [Roles.MD],
      permissions: Object.values(Permissions),
    };
  });

  test.afterAll(async () => {
    if (propertyId) {
      await prisma.propertyVerificationLog.deleteMany({ where: { property_id: propertyId } });
      await prisma.propertyImage.deleteMany({ where: { property_id: propertyId } });
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
  });

  test('creates and approves a property through the real pipeline to LIVE', async () => {
    const created = await PropertyService.createProperty(mdUser, {
      title,
      brand_type: 'SONTHILLU',
      category: 'APARTMENT',
      base_rate: 3800,
      area_sqft: 1450,
      location: 'E2E Test Location',
    });
    propertyId = created.id;
    expect(created.status).toBe('PENDING_VERIFICATION');

    // PM verification requires at least one photo uploaded by the verifying
    // PM plus an on-site location confirmation — seed both directly, the
    // same real preconditions verifyProperty() itself enforces.
    await prisma.propertyImage.create({
      data: {
        property_id: propertyId,
        image_url: 'https://example.com/e2e-test-photo.jpg',
        uploaded_by_id: mdUser.employeeId,
        is_primary: true,
      },
    });
    await prisma.property.update({
      where: { id: propertyId },
      data: { location_confirmed_by_pm: true },
    });

    const verified = await PropertyService.verifyProperty(mdUser, propertyId, {
      approved: true,
      notes: 'On-site check passed.',
    });
    expect(verified.status).toBe('PENDING_DM_POLISH');

    const polished = await PropertyService.dmVerifyAsIsProperty(mdUser, propertyId, {
      notes: 'Listing content already accurate as submitted.',
    });
    expect(polished.status).toBe('PENDING_MD_APPROVAL');

    const approved = await PropertyService.mdApproveProperty(mdUser, propertyId, {
      approved: true,
      comments: 'Approved for listing.',
    });
    expect(approved.status).toBe('LIVE');
  });

  test('the real Properties page reflects the final LIVE state', async ({ page }) => {
    await login(page, 'RRH-TST-000');
    await page.goto('/properties');
    await page.getByPlaceholder('Search title, code, location...').fill(title);

    await expect(page.getByText(title).last()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('LIVE', { exact: true }).last()).toBeVisible({ timeout: 10000 });
  });
});
