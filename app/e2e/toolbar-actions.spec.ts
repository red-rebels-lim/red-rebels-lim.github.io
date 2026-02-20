import { test, expect, type Page } from '@playwright/test';

function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

test.describe('Toolbar Actions - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('Options dropdown button is visible on desktop', async ({ page }) => {
    const optionsBtn = page.getByRole('button', { name: /tools/i });
    await expect(optionsBtn).toBeVisible();
  });

  test('Options dropdown shows Export and Print items', async ({ page }) => {
    const optionsBtn = page.getByRole('button', { name: /tools/i });
    await optionsBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('menuitem', { name: /export/i }).first()).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^print$/i })).toBeVisible();
  });

  test('Export triggers ICS file download', async ({ page }) => {
    const optionsBtn = page.getByRole('button', { name: /tools/i });
    await optionsBtn.click();
    await page.waitForTimeout(300);

    // Listen for download event
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: /export/i }).first().click();
    const download = await downloadPromise;

    // Verify the downloaded file name
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

    const optionsBtn = page.getByRole('button', { name: /tools/i });
    await optionsBtn.click();
    await page.waitForTimeout(300);

    await page.getByRole('menuitem', { name: /print/i }).click();
    await page.waitForTimeout(300);

    const printCalled = await page.evaluate(() => (window as unknown as Record<string, boolean>).__printCalled);
    expect(printCalled).toBe(true);
  });

  test('Export item only appears on Calendar page', async ({ page }) => {
    // On calendar page, Export should be visible
    const optionsBtn = page.getByRole('button', { name: /tools/i });
    await optionsBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('menuitem', { name: /export/i }).first()).toBeVisible();

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Navigate to Stats page
    await page.getByRole('link', { name: /statistics/i }).click();
    await page.waitForTimeout(500);

    // On Stats page, Options button should still be there
    const optionsBtnStats = page.getByRole('button', { name: /tools/i });
    await optionsBtnStats.click();
    await page.waitForTimeout(300);

    // Export should NOT be visible on Stats page
    const exportItems = page.getByRole('menuitem', { name: /export/i });
    await expect(exportItems).toHaveCount(0);
    // Print should still be visible
    await expect(page.getByRole('menuitem', { name: /^print$/i })).toBeVisible();
  });
});

test.describe('Toolbar Actions - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Options dropdown is hidden on mobile', async ({ page }) => {
    const optionsBtn = page.getByRole('button', { name: /tools/i });
    await expect(optionsBtn).not.toBeVisible();
  });

  test('Export and Print buttons are in mobile hamburger menu', async ({ page }) => {
    const hamburger = page.locator('nav button.md\\:hidden');
    await hamburger.click();
    await page.waitForTimeout(300);

    // Mobile menu should show Export and Print as separate buttons
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /print/i })).toBeVisible();
  });

  test('Mobile Export triggers ICS file download', async ({ page }) => {
    const hamburger = page.locator('nav button.md\\:hidden');
    await hamburger.click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('red-rebels-calendar-2025.ics');
  });
});
