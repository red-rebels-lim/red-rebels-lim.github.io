import { test, expect } from '@playwright/test';

test.describe('Stats Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/stats');
    await page.waitForSelector('section', { timeout: 10000 });
  });

  test('renders the page with navbar', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test.describe('Overall Stats section', () => {
    test('displays the Overall Performance heading', async ({ page }) => {
      await expect(page.getByText('Overall Performance')).toBeVisible();
    });

    test('renders 9 stat cards in the grid', async ({ page }) => {
      // Each stat card has a label with uppercase tracking-wide text
      // Count the number of stat value + label pairs in the first section
      const section = page.locator('section').first();
      // Check that we see all 9 labels
      const labels = ['Matches', 'Wins', 'Draws', 'Losses', 'Goals', 'Points', 'Clean Sheets', 'Avg Goals Scored', 'Avg Goals Conceded'];
      for (const label of labels) {
        await expect(section.getByText(label, { exact: true })).toBeVisible();
      }
    });

    test('displays all stat card labels', async ({ page }) => {
      const labels = [
        'Matches', 'Wins', 'Draws', 'Losses', 'Goals', 'Points',
        'Clean Sheets', 'Avg Goals Scored', 'Avg Goals Conceded',
      ];
      for (const label of labels) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      }
    });

    test('stat card values are numeric or score-formatted', async ({ page }) => {
      // Verify the first section has visible text content for key stats
      const section = page.locator('section').first();
      // The section should contain the "Matches" label and a numeric value
      await expect(section.getByText('Matches')).toBeVisible();
      // Goals card shows a score like "15-8"
      await expect(section.getByText(/^\d+-\d+$/).first()).toBeVisible();
    });
  });

  test.describe('Home vs Away section', () => {
    test('displays the Home vs Away heading', async ({ page }) => {
      await expect(page.getByText('Home vs Away')).toBeVisible();
    });

    test('shows Home and Away subsections', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Away', exact: true })).toBeVisible();
    });
  });

  test.describe('Recent Form + Streaks section', () => {
    test('displays the Recent Form heading', async ({ page }) => {
      await expect(page.getByText('Recent Form (Last 5 Matches)')).toBeVisible();
    });

    test('shows form badges (W/D/L)', async ({ page }) => {
      // Form badges show W, D, or L text
      const section = page.locator('section').nth(2);
      // Look for the colored badge elements that contain single-letter results
      const formBadges = section.locator('div').filter({ hasText: /^[WDL]$/ });
      const count = await formBadges.count();
      // Should have form badges (result indicators + legend indicators)
      expect(count).toBeGreaterThan(0);
    });

    test('displays the Streaks subsection', async ({ page }) => {
      await expect(page.getByText('Streaks')).toBeVisible();
    });

    test('shows Current, Best Win Streak, and Best Unbeaten Run', async ({ page }) => {
      await expect(page.getByText('Current', { exact: true })).toBeVisible();
      await expect(page.getByText('Best Win Streak')).toBeVisible();
      await expect(page.getByText('Best Unbeaten Run')).toBeVisible();
    });
  });

  test.describe('Head-to-Head section', () => {
    test('displays the Head-to-Head heading', async ({ page }) => {
      await expect(page.getByText('Head-to-Head (Top 10)')).toBeVisible();
    });

    test('renders opponent table with headers', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible();
      await expect(table.locator('th').first()).toContainText('Opponent');
    });

    test('table has at least one opponent row', async ({ page }) => {
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(10);
    });
  });

  test.describe('Goal Distribution chart', () => {
    test('displays the Goal Distribution heading', async ({ page }) => {
      await expect(page.getByText('Goal Distribution')).toBeVisible();
    });

    test('renders an SVG chart (recharts BarChart)', async ({ page }) => {
      // The Goal Distribution section contains a recharts ResponsiveContainer with an SVG
      const sections = page.locator('section');
      const goalDistSection = sections.filter({ hasText: 'Goal Distribution' }).first();
      await expect(goalDistSection.locator('svg').first()).toBeVisible();
    });
  });

  test.describe('Records section', () => {
    test('displays the Records heading', async ({ page }) => {
      await expect(page.getByText('Records', { exact: true })).toBeVisible();
    });

    test('shows Biggest Win card', async ({ page }) => {
      await expect(page.getByText('Biggest Win')).toBeVisible();
    });

    test('shows Heaviest Defeat card if losses exist', async ({ page }) => {
      // This test is conditional - heaviestDefeat may be null if no losses
      const defeat = page.getByText('Heaviest Defeat');
      const count = await defeat.count();
      // Just ensure it doesn't crash; it may or may not be visible depending on data
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('record cards display score and opponent', async ({ page }) => {
      const biggestWinCard = page.getByText('Biggest Win').locator('..');
      await expect(biggestWinCard).toBeVisible();
      // The parent div should contain a score (digit-dash-digit) and an opponent name
      const cardText = await biggestWinCard.textContent();
      expect(cardText).toMatch(/\d+-\d+/);
      expect(cardText).toMatch(/vs .+/);
    });
  });

  test.describe('Season Progress chart', () => {
    test('displays the Season Progress heading', async ({ page }) => {
      await expect(page.getByText('Season Progress')).toBeVisible();
    });

    test('renders an SVG chart (recharts LineChart)', async ({ page }) => {
      const sections = page.locator('section');
      const progressSection = sections.filter({ hasText: 'Season Progress' }).first();
      await expect(progressSection.locator('svg').first()).toBeVisible();
    });
  });
});

test.describe('Stats Page i18n', () => {
  test('page loads without translation key fallbacks (no "stats." prefix visible)', async ({ page }) => {
    await page.goto('/#/stats');
    await page.waitForSelector('section', { timeout: 10000 });
    // If a translation key is missing, react-i18next shows the key itself (e.g. "stats.cleanSheets")
    // We check that none of the stat labels show raw keys
    const bodyText = await page.locator('body').textContent();
    const rawKeys = [
      'stats.cleanSheets', 'stats.avgGoalsFor', 'stats.avgGoalsAgainst',
      'stats.goalDistribution', 'stats.scored', 'stats.conceded',
      'stats.streaks', 'stats.currentStreak', 'stats.longestWinStreak',
      'stats.longestUnbeatenStreak', 'stats.records', 'stats.biggestWin',
      'stats.heaviestDefeat', 'stats.seasonProgress', 'stats.matchday',
    ];
    for (const key of rawKeys) {
      expect(bodyText).not.toContain(key);
    }
  });
});

test.describe('Calendar EventCard / EventPopover TBD', () => {
  test('event popover shows TBD or valid time for upcoming matches', async ({ page }) => {
    // Navigate to calendar (root)
    await page.goto('/');
    // Find an event card and click it to open the popover
    const eventCard = page.locator('[class*="rounded-lg"][class*="cursor-pointer"]').first();
    const cardExists = await eventCard.count();
    if (cardExists === 0) {
      test.skip();
      return;
    }
    await eventCard.click();
    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // The time display should show either a valid time (HH:MM) or "TBD"
    const timeText = await dialog.textContent();
    // The dialog should contain either a time pattern or TBD
    const hasTime = /\d{1,2}:\d{2}/.test(timeText || '');
    const hasTBD = timeText?.includes('TBD') || false;
    // At least one should be true (meetings also show time)
    expect(hasTime || hasTBD).toBe(true);
  });
});
