import { test, expect } from '@playwright/test';

test.describe('RRH EMS Web App E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to the local app
    await page.goto('http://localhost:5173/');
  });

  test('should successfully log in as MD and view dashboard', async ({ page }) => {
    // Check if the fast login buttons are available
    const quickLoginButton = page.locator('button:has-text("RRH-EX-001")').first();
    
    if (await quickLoginButton.isVisible()) {
      await quickLoginButton.click();
    } else {
      // Manual login
      await page.fill('input[placeholder*="Employee ID"]', 'RRH-EX-001');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Sign In")');
    }

    // Expect to be on the Dashboard
    await expect(page.locator('h1:has-text("Radha Real Homes")')).toBeVisible({ timeout: 10000 });
    
    // Check MD specific tabs exist
    await expect(page.locator('span:has-text("MD Dashboard")')).toBeVisible();
    await expect(page.locator('span:has-text("Leads & Distribution")')).toBeVisible();
    await expect(page.locator('span:has-text("Properties & Inventory")')).toBeVisible();
  });

  test('should navigate to Leads & Distribution and see leads', async ({ page }) => {
    // Login
    await page.locator('button:has-text("RRH-EX-001")').first().click();
    await expect(page.locator('h1:has-text("Radha Real Homes")')).toBeVisible();

    // Navigate to Leads
    await page.click('button:has-text("Leads & Distribution")');

    // Verify Leads Management UI loads
    await expect(page.locator('h2:has-text("Lead Distribution & Workflow")')).toBeVisible();
    
    // Check if "Add New Lead" button exists
    await expect(page.locator('button:has-text("Add New Lead")')).toBeVisible();
  });

  test('should navigate to Properties and verify UI', async ({ page }) => {
    // Login
    await page.locator('button:has-text("RRH-EX-001")').first().click();
    await expect(page.locator('h1:has-text("Radha Real Homes")')).toBeVisible();

    // Navigate to Properties
    await page.click('button:has-text("Properties & Inventory")');

    // Verify Properties Management UI loads
    await expect(page.locator('h2:has-text("Property Inventory & Verification Pipeline")')).toBeVisible();
    
    // Check if "Add Property Listing" button exists
    await expect(page.locator('button:has-text("Add Property Listing")')).toBeVisible();
  });
});
