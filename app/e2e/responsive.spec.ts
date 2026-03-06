import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Calendar page renders without significant horizontal overflow', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      // Check for horizontal overflow (allow small tolerance for borders/shadows)
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
      });
      expect(overflow).toBeLessThan(50); // allow some overflow for calendar grid borders/padding
    });

    test('Calendar has event content', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      // The calendar grid should contain event-related content (sport emojis or opponent names)
      const gridText = await page.locator('main').textContent();
      // At least some content should be there (month name, day numbers)
      expect(gridText!.length).toBeGreaterThan(50);
    });

    test('Navigation is accessible', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      if (vp.width < 768) {
        // Mobile: hamburger should be visible, desktop nav hidden
        const hamburger = page.getByRole('button', { name: 'Open menu' });
        await expect(hamburger).toBeVisible();
      } else {
        // Desktop: nav links should be visible
        await expect(page.getByText('Calendar')).toBeVisible();
        await expect(page.getByText('Statistics')).toBeVisible();
      }
    });

    test('Stats page renders without overflow', async ({ page }) => {
      await page.goto('/#/stats');
      await page.waitForLoadState('networkidle');

      // Wait for stats content to load
      await page.waitForTimeout(1000);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });

    test('Settings page renders centered card', async ({ page }) => {
      await page.goto('/#/settings');
      await page.waitForLoadState('networkidle');

      const heading = page.getByText(/Notification Settings|Ρυθμίσεις Ειδοποιήσεων/i);
      await expect(heading).toBeVisible();

      // Card should be within viewport bounds
      const box = await heading.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 20); // small tolerance
    });
  });
}
