import { test, expect } from '@playwright/test';

test.describe('MD End-to-End Acceptance: Projects & Properties', () => {
  // Use sequential mode so we can reuse state or at least not have overlapping DB writes
  test.describe.configure({ mode: 'serial' });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Login as MD', async () => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'EMP-MD-001');
    await page.fill('input[type="password"]', 'Test@1234');
    await page.click('button:has-text("Login")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/md\/dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('Projects: Create Company and Project', async () => {
    await page.click('a:has-text("Projects")');
    await expect(page).toHaveURL(/.*\/md\/projects/);

    // Create Company
    await page.click('button:has-text("Add Company")');
    await expect(page.locator('h3:has-text("Add Company")')).toBeVisible();

    const companyName = `Test Co ${Date.now()}`;
    await page.fill('input:below(:text("Company Name *"))', companyName);
    await page.fill('input:below(:text("Address"))', '123 E2E St');

    // Listen for network response to ensure successful API call
    const createCompanyRes = page.waitForResponse(
      (response: any) =>
        response.url().includes('/md/companies') && response.request().method() === 'POST',
    );

    await page.click('button:has-text("Create")');
    const companyResponse = await createCompanyRes;
    expect(companyResponse.status()).toBe(200);

    // Wait for the modal to close and the new company to appear
    await expect(page.locator(`text=${companyName}`)).toBeVisible();

    // Create Project
    await page.click('button:has-text("Add Project")');
    await expect(page.locator('h3:has-text("Add Project")')).toBeVisible();

    // Select the company we just created
    await page.locator('select').selectOption({ label: companyName });

    const projectName = `Test Proj ${Date.now()}`;
    // The inputs need to be selected carefully. Let's use more specific selectors.
    await page.locator('text=Project Name * >> xpath=following-sibling::input').fill(projectName);
    await page.locator('text=Location >> xpath=following-sibling::input').fill('North E2E');
    await page.locator('text=Total Units >> xpath=following-sibling::input').fill('10');

    const createProjectRes = page.waitForResponse(
      (response: any) =>
        response.url().includes('/md/projects') && response.request().method() === 'POST',
    );

    await page.click('button:has-text("Create")');
    const projectResponse = await createProjectRes;
    expect(projectResponse.status()).toBe(200);

    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test('Properties: Create Property', async () => {
    await page.click('a:has-text("Properties")');
    await expect(page).toHaveURL(/.*\/md\/properties/);

    await page.click('button:has-text("Add Property")');
    await expect(page.locator('h3:has-text("Add Property")')).toBeVisible();

    // Select the first project in the list (since we just created one, it should be there)
    await page.locator('select').first().selectOption({ index: 1 });

    await page.locator('text=Plot Number * >> xpath=following-sibling::input').fill('TEST-PLOT-01');
    await page.locator('text=Area (SqFt) * >> xpath=following-sibling::input').fill('1200');
    await page.locator('text=Value/SqFt (₹) * >> xpath=following-sibling::input').fill('1500');

    const createPropertyRes = page.waitForResponse(
      (response: any) =>
        response.url().includes('/md/properties') && response.request().method() === 'POST',
    );

    await page.click('button:has-text("Create")');
    const propertyResponse = await createPropertyRes;
    expect(propertyResponse.status()).toBe(200);

    await expect(page.locator('text=TEST-PLOT-01')).toBeVisible();
  });
});
