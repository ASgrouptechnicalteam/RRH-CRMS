import { test, expect } from '@playwright/test';
import { prisma } from '../../apps/api/src/lib/prisma';
import { login } from './helpers';
import { Roles, Permissions } from '@rrh-ems/shared';
import { TokenPayload } from '../../apps/api/src/utils/jwt';

// Phase 5.2 smoke test: walks a lead from creation all the way to BOOKED.
//
// Scope decision (documented, not silent): the highest-value, most-fragile,
// most-frequently-touched part of the funnel — lead creation and
// qualification — is driven through the REAL UI with real clicks. The
// deeper middle section (Demo/Site Visit lifecycle, Negotiation, Booking)
// involves several distinct actor roles (PM acceptance, day-before
// reconfirmation, MD approval) across multiple screens that each deserve
// their own dedicated manual QA pass (Phase 5.3) rather than a brittle,
// hard-to-debug chain of automated clicks bolted on here. That middle
// section is advanced by calling the exact same backend service functions
// production code calls (not raw SQL, not a shortcut) — the same functions
// Phase 5.1's Jest suite already unit-tests in isolation. The final state is
// then verified by reloading the lead in the REAL UI and asserting what a
// real user would see.
//
// This same investigation is what surfaced two previously-unknown,
// permanently-blocking bugs in this exact path (see lead-negotiation-guard
// .test.ts and site-visit-complete-no-property.test.ts) — this smoke test
// would have failed loudly on both before they were fixed.
test.describe('Phase 5.2 - Lead journey: creation through BOOKED', () => {
  let leadId: number;
  let visitId: number;
  let propertyId: number;
  let mdUser: TokenPayload;
  const customerName = `E2E Lead ${Date.now()}`;

  test.beforeAll(async () => {
    const md = await prisma.employee.findFirst({ where: { employee_code: 'RRH-TST-000' } });
    if (!md)
      throw new Error('Deterministic MD test user (RRH-TST-000) not found — did global-setup run?');
    // The backend-driven middle section (see the scope decision above) calls
    // service functions directly, bypassing the login/JWT flow that would
    // normally populate `permissions` on the token from RolePermissionsMatrix
    // — so it's supplied explicitly here. MD legitimately has every
    // permission in production (RolePermissionsMatrix[Roles.MD] =
    // ALL_PERMISSIONS in apps/api/src/shared/auth.ts); this just skips
    // re-deriving that lookup for a token built by hand.
    mdUser = {
      employeeId: md.id,
      employeeCode: md.employee_code,
      companyId: md.company_id,
      branchId: null,
      roles: [Roles.MD],
      permissions: Object.values(Permissions),
    };
    const property = await prisma.property.findFirst({
      where: { company_id: md.company_id, status: 'LIVE' },
    });
    if (!property)
      throw new Error(
        `No LIVE property found for company ${md.company_id} — needed to attach to the site visit.`,
      );
    propertyId = property.id;
  });

  test.afterAll(async () => {
    if (visitId) {
      await prisma.siteVisitProperty.deleteMany({ where: { visit_id: visitId } });
      await prisma.siteVisitBooking.deleteMany({ where: { id: visitId } });
    }
    if (leadId) {
      await prisma.opportunity.deleteMany({ where: { lead_id: leadId } });
      await prisma.leadActivity.deleteMany({ where: { lead_id: leadId } });
      await prisma.demo.deleteMany({ where: { lead_id: leadId } });
      await prisma.lead.deleteMany({ where: { id: leadId } });
    }
  });

  test('creates and qualifies a lead through the real UI', async ({ page }) => {
    await login(page, 'RRH-TST-000');

    await page.goto('/leads');
    await page.getByRole('button', { name: 'Add New Lead' }).click();

    await page.getByPlaceholder('e.g. John Doe').fill(customerName);
    await page.getByPlaceholder('e.g. 9876543210').fill(`9${Date.now().toString().slice(-9)}`);
    await page.getByRole('button', { name: 'Add as My Lead' }).click();
    await page.getByRole('button', { name: 'Quick Add' }).click();

    await expect(page.getByPlaceholder('e.g. John Doe')).not.toBeVisible({ timeout: 10000 });

    const lead = await prisma.lead.findFirst({ where: { customer_name: customerName } });
    expect(lead).not.toBeNull();
    leadId = lead!.id;
    expect(lead!.status).toBe('ASSIGNED');

    // Open the lead's detail dossier from the pipeline list.
    // LeadManagement's DataTable renders both a `md:hidden` mobile-card copy
    // and a `hidden md:block` desktop-table copy of every row simultaneously
    // — at Playwright's default desktop viewport the mobile copy matches by
    // text but is CSS-hidden (not "visible"), so .first() flakes. The
    // desktop table copy renders later in the DOM.
    await page.getByText(customerName).last().click();
    await expect(page.getByRole('button', { name: /Mark Contacted/ })).toBeVisible({
      timeout: 10000,
    });

    // ASSIGNED -> CONTACTED
    await page.getByRole('button', { name: /Mark Contacted/ }).click();
    await expect(page.getByRole('button', { name: /Mark Qualified/ })).toBeVisible({
      timeout: 10000,
    });

    // Fill qualification fields (required before QUALIFIED is a legal transition).
    // QualificationFormModal's InputField/SelectField never pass an `id`, so
    // their <label htmlFor={id}> never associates with anything — getByLabel
    // can't find them. Scoped to the form's own stable id instead.
    await page.getByRole('button', { name: 'Edit' }).first().click();
    const qualForm = page.locator('#qualification-form');
    await qualForm.locator('input[type="number"]').nth(0).fill('4000000');
    await qualForm.locator('input[type="number"]').nth(1).fill('6000000');
    await qualForm.locator('select').selectOption({ index: 1 });
    await qualForm.locator('input[type="text"]').fill('E2E Test Location');
    await page.getByRole('button', { name: 'Save & Confirm' }).click();
    await expect(page.getByRole('button', { name: 'Save & Confirm' })).not.toBeVisible({
      timeout: 10000,
    });

    // CONTACTED -> QUALIFIED
    await page.getByRole('button', { name: /Mark Qualified/ }).click();
    await expect(page.getByRole('button', { name: /Schedule Site Visit/ })).toBeVisible({
      timeout: 10000,
    });

    const qualified = await prisma.lead.findUnique({ where: { id: leadId } });
    expect(qualified?.status).toBe('QUALIFIED');
  });

  test('advances the lead through the real site-visit lifecycle to BOOKED', async () => {
    if (!leadId) {
      const lead = await prisma.lead.findFirst({ where: { customer_name: customerName } });
      if (!lead)
        throw new Error(
          `Lead "${customerName}" not found — did the creation test run first and succeed?`,
        );
      leadId = lead.id;
    }
    const { bookVisit } = require('../../apps/api/src/services/siteVisit/booking');
    const {
      acceptVisit,
      reconfirmCustomer,
      confirmVisit,
      startVisit,
      completeVisit,
    } = require('../../apps/api/src/services/siteVisit/lifecycle');
    const { updateLeadStatus } = require('../../apps/api/src/services/lead/status');

    const visit = await bookVisit(mdUser, {
      lead_id: leadId,
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      property_id: propertyId,
    });
    visitId = visit.id;

    await updateLeadStatus(mdUser, leadId, 'SITE_VISIT_SCHEDULED');

    // Real bookings get auto-routed to a specific PM/Agent based on the
    // project's location assignment (a separate, already-covered concern —
    // see resolveVisitProject/PMLocationAssignment). acceptVisit()'s policy
    // strictly requires the accepting actor to BE that routed person, so
    // point routing at mdUser directly for a deterministic smoke test rather
    // than depending on whatever PM the location lottery assigned.
    await prisma.siteVisitBooking.update({
      where: { id: visitId },
      data: { project_manager_id: mdUser.employeeId },
    });

    await acceptVisit(mdUser, visitId);
    await reconfirmCustomer(mdUser, visitId);
    await confirmVisit(mdUser, visitId);
    await startVisit(mdUser, visitId);
    const completed = await completeVisit(
      mdUser,
      visitId,
      [{ property_id: propertyId, outcome: 'INTERESTED' }],
      'Customer loved the location and layout.',
    );
    expect(completed.status).toBe('COMPLETED');

    await updateLeadStatus(mdUser, leadId, 'SITE_VISIT_COMPLETED');
    await updateLeadStatus(mdUser, leadId, 'NEGOTIATION');

    const opp = await prisma.opportunity.findFirst({ where: { lead_id: leadId } });
    expect(opp).not.toBeNull();
    expect(opp!.expected_value).not.toBeNull();

    await updateLeadStatus(mdUser, leadId, 'BOOKING_INITIATED');
    const booked = await updateLeadStatus(mdUser, leadId, 'BOOKED');
    expect(booked.status).toBe('BOOKED');
  });

  test('the real UI reflects the final BOOKED state', async ({ page }) => {
    await login(page, 'RRH-TST-000');
    await page.goto('/leads');
    // LeadManagement's DataTable renders both a `md:hidden` mobile-card copy
    // and a `hidden md:block` desktop-table copy of every row simultaneously
    // — at Playwright's default desktop viewport the mobile copy matches by
    // text but is CSS-hidden (not "visible"), so .first() flakes. The
    // desktop table copy renders later in the DOM.
    await page.getByText(customerName).last().click();

    // Scoped to the StatusPill's own span class — a plain getByText('BOOKED')
    // also matches a hidden <option value="BOOKED"> in a status filter
    // <select>, and (same md:hidden/hidden md:block DataTable duplication as
    // above) the first DOM match is the CSS-hidden mobile-card copy.
    await expect(page.locator('span.rounded-full', { hasText: 'BOOKED' }).last()).toBeVisible({
      timeout: 10000,
    });
    // A BOOKED lead is terminal-won — no further pipeline action buttons.
    await expect(page.getByRole('button', { name: /Mark as Booked/ })).not.toBeVisible();
  });
});
