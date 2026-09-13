import { Page, expect } from '@playwright/test';

export async function login(page: Page, employeeCode: string, password = 'Password@123') {
  await page.goto('/');
  await page.getByPlaceholder('e.g. RRH-ADMIN-001').fill(employeeCode);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByPlaceholder('e.g. RRH-ADMIN-001')).not.toBeVisible({ timeout: 15000 });
}
