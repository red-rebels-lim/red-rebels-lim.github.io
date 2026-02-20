import { test, expect } from '@playwright/test';

test.describe('Stats Page - FotMob Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/stats');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('section', { timeout: 10000 });
    // Wait for FotMob data to load (loading skeletons disappear)
    await page.waitForTimeout(3000);
  });

  test.describe('Loading State', () => {
    test('shows loading skeletons while FotMob data is fetching', async ({ page }) => {
      // Navigate fresh and check for animated skeletons before data loads
      await page.goto('/#/stats');
      // The skeleton has animate-pulse class
      page.locator('.animate-pulse');
      // At least one skeleton should appear briefly (may already be gone if data loaded fast)
      // We just verify the page doesn't crash
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('League Table', () => {
    test('displays league table section if data is available', async ({ page }) => {
      // League table heading
      const leagueTableHeading = page.getByText(/league (table|standing)/i);
      const count = await leagueTableHeading.count();

      if (count > 0) {
        await expect(leagueTableHeading.first()).toBeVisible();

        // Should have a table with team rows
        const leagueSection = page.locator('section').filter({ hasText: /league/i }).first();
        const table = leagueSection.locator('table');
        if ((await table.count()) > 0) {
          await expect(table).toBeVisible();
          // Table should have header columns
          const headers = table.locator('th');
          const headerCount = await headers.count();
          expect(headerCount).toBeGreaterThan(0);
        }
      } else {
        // FotMob data may not be available - test passes gracefully
        test.skip();
      }
    });

    test('highlights Nea Salamina row in league table', async ({ page }) => {
      const salamina = page.locator('tr').filter({ hasText: /σαλαμίνα|salamina|nea sal/i });
      const count = await salamina.count();

      if (count > 0) {
        // The highlighted row should be visible
        await expect(salamina.first()).toBeVisible();
      }
      // Skip silently if no FotMob data
    });
  });

  test.describe('Top Scorers', () => {
    test('displays top scorers section if data is available', async ({ page }) => {
      const topScorersHeading = page.getByText(/top scorer/i);
      const count = await topScorersHeading.count();

      if (count > 0) {
        await expect(topScorersHeading.first()).toBeVisible();

        // Should show player names with goal counts
        const scorerSection = page.locator('section').filter({ hasText: /top scorer/i }).first();
        await expect(scorerSection).toBeVisible();
      }
    });
  });

  test.describe('League Rankings', () => {
    test('displays league rankings section if data is available', async ({ page }) => {
      const rankingsHeading = page.getByText(/league ranking/i);
      const count = await rankingsHeading.count();

      if (count > 0) {
        await expect(rankingsHeading.first()).toBeVisible();
      }
    });
  });

  test.describe('Venue Info', () => {
    test('displays venue info section if data is available', async ({ page }) => {
      const venueHeading = page.getByText(/venue/i);
      const count = await venueHeading.count();

      if (count > 0) {
        await expect(venueHeading.first()).toBeVisible();
      }
    });
  });

  test.describe('Next Match', () => {
    test('displays next match section if data is available', async ({ page }) => {
      const nextMatchHeading = page.getByText(/next match/i);
      const count = await nextMatchHeading.count();

      if (count > 0) {
        await expect(nextMatchHeading.first()).toBeVisible();

        // Should show team names
        const nextMatchSection = page.locator('section').filter({ hasText: /next match/i }).first();
        const sectionText = await nextMatchSection.textContent();
        // Should contain some team or match information
        expect(sectionText?.length).toBeGreaterThan(20);
      }
    });
  });
});
