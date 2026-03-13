import { test, expect } from '@playwright/test';

test.describe('Toolbar Actions - Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/settings');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Export Calendar button is visible on Settings page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export calendar/i })).toBeVisible();
  });

  test('Print Calendar button is visible on Settings page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /print calendar/i })).toBeVisible();
  });

  test('Export triggers ICS file download', async ({ page }) => {
    // Navigate to calendar first (export only works on calendar page)
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Open settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export calendar/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('red-rebels-calendar-2025.ics');
  });

  test('Print triggers window.print', async ({ page }) => {
    // Intercept window.print to prevent actual print dialog
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__printCalled = false;
      window.print = () => {
        (window as unknown as Record<string, unknown>).__printCalled = true;
      };
    });

    await page.getByRole('button', { name: /print calendar/i }).click();
    await page.waitForTimeout(300);

    const printCalled = await page.evaluate(() => (window as unknown as Record<string, boolean>).__printCalled);
    expect(printCalled).toBe(true);
  });
});
