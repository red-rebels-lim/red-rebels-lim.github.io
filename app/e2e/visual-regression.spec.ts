import { test, expect } from '@playwright/test';

test.describe('Visual regression — Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Calendar page dark mode', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // let animations settle

    await expect(page).toHaveScreenshot('calendar-desktop-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Calendar page light mode', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Switch to light mode via MobileHeader theme toggle
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('calendar-desktop-light.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Stats page', async ({ page }) => {
    await page.goto('/#/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('stats-desktop-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Settings page', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('settings-desktop-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Calendar with event popover open', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="cursor-pointer"]').first();
    await card.click();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('calendar-popover-open.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Visual regression — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Calendar page mobile dark mode', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('calendar-mobile-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
