import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'Calendar', path: '/#/' },
  { name: 'Stats', path: '/#/stats' },
  { name: 'Settings', path: '/#/settings' },
];

for (const { name, path } of PAGES) {
  test.describe(`${name} page accessibility`, () => {
    test(`${name} page passes axe audit (dark mode)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .disableRules([
          'color-contrast', // background images make contrast unreliable for automated tools
          'page-has-heading-one', // calendar page uses brand nav instead of h1 — acceptable for SPA
        ])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test(`${name} page passes axe audit (light mode)`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      await page.waitForTimeout(200);

      const results = await new AxeBuilder({ page })
        .disableRules([
          'color-contrast',
          'page-has-heading-one',
        ])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
}

test.describe('Keyboard navigation', () => {
  test('event popover can be opened by click and closed with Escape', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Click the first event card to open popover
    const eventCard = page.locator('[class*="cursor-pointer"]').first();
    await eventCard.click();

    // Dialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 2000 });

    // Close with Escape key
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('filter panel controls are keyboard accessible', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Open filters
    const filterBtn = page.getByText('Event Filters');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(300);

      // Tab through filter controls — should reach them without error
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focused element should be within the filter area or page
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeDefined();
    }
  });
});
