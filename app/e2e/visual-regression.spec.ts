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

    // Switch to light mode
    const themeBtn = page.getByRole('button', { name: /🌙/ });
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

  test('Calendar with filters open', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const filterBtn = page.getByRole('button', { name: /Event Filters/ });
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('calendar-filters-open.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    }
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

  test('Mobile hamburger menu open', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.getByRole('button', { name: 'Open menu' });
    await menuBtn.click();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('calendar-mobile-menu-open.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
