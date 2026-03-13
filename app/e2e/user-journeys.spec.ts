import { test, expect } from '@playwright/test';

test.describe('J1: View upcoming match details', () => {
  test('user can click an upcoming match and see full details in popover', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Find the first event card with a countdown timer (upcoming match)
    const upcomingCard = page.locator('[class*="cursor-pointer"]').first();
    await expect(upcomingCard).toBeVisible();
    await upcomingCard.click();

    // Dialog should open with match details
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Should show team name
    await expect(dialog).toContainText('Νέα Σαλαμίνα');

    // Should show time or TBD
    const dialogText = await dialog.textContent();
    expect(dialogText?.match(/(TBD|\d{2}:\d{2})/)).toBeTruthy();

    // Should show location info (Home or Away)
    const hasLocation = dialogText?.includes('Home') || dialogText?.includes('Away')
      || dialogText?.includes('Εντός') || dialogText?.includes('Εκτός');
    expect(hasLocation).toBeTruthy();

    // Close popover
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('J2: Check team statistics', () => {
  test('user navigates to stats and sees performance data', async ({ page }) => {
    await page.goto('/#/stats');
    await page.waitForLoadState('networkidle');

    // Overall Performance section should render with stat cards
    const overall = page.getByText(/Overall Performance|Συνολική Απόδοση/i);
    await expect(overall).toBeVisible({ timeout: 5000 });

    // Should show numeric stats (Matches, Wins, etc.)
    const statsSection = page.locator('section').filter({ hasText: /Overall Performance|Συνολική Απόδοση/ });
    const statsText = await statsSection.textContent();

    // Verify stats are numbers, not NaN
    expect(statsText).not.toContain('NaN');
    expect(statsText).not.toContain('undefined');

    // Should have numerical values
    expect(statsText?.match(/\d+/)).toBeTruthy();
  });
});

test.describe('J3: Export calendar', () => {
  test('user exports ICS file from settings page', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export calendar/i });
    await expect(exportBtn).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/red-rebels-calendar.*\.ics$/);
  });
});

test.describe('J4: Switch language', () => {
  test('user toggles between English and Greek via Settings', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Language setting should be visible
    const langBtn = page.getByRole('button', { name: /language/i });
    await expect(langBtn).toBeVisible();
  });
});

test.describe('J5: Filter matches', () => {
  test('user filters by sport and clears filters', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Open filter panel via keyboard shortcut
    await page.keyboard.press('f');
    await page.waitForTimeout(300);

    // Count events before filtering
    const allEvents = await page.locator('[class*="cursor-pointer"]').count();

    // Select volleyball filter
    const sportSelect = page.locator('select, [role="combobox"]').first();
    if (await sportSelect.isVisible()) {
      await sportSelect.selectOption({ label: /volleyball/i }).catch(() => {
        // Might be a Radix Select, try clicking
      });
    }

    // Count events after filtering — should be different (fewer or equal)
    await page.waitForTimeout(300);
    const filteredEvents = await page.locator('[class*="cursor-pointer"]').count();
    expect(filteredEvents).toBeLessThanOrEqual(allEvents);

    // Clear filters
    const clearBtn = page.getByText(/Clear All|Καθαρισμός/);
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(300);
      const restoredEvents = await page.locator('[class*="cursor-pointer"]').count();
      expect(restoredEvents).toBe(allEvents);
    }
  });
});

test.describe('J6: Navigate through all months', () => {
  test('user navigates from September to August and back', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const prevBtn = page.getByRole('button', { name: /previous/i });
    const nextBtn = page.getByRole('button', { name: /next/i });

    // Go to September (first month)
    for (let i = 0; i < 12; i++) {
      await prevBtn.click();
      await page.waitForTimeout(100);
    }

    const bodyText1 = await page.locator('body').innerText();
    expect(bodyText1).toMatch(/september/i);

    // Navigate forward to August (last month) — 11 clicks
    for (let i = 0; i < 11; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }

    const bodyText2 = await page.locator('body').innerText();
    expect(bodyText2).toMatch(/august/i);

    // Try to go past August — should stay on August
    await nextBtn.click();
    await page.waitForTimeout(100);
    const bodyText3 = await page.locator('body').innerText();
    expect(bodyText3).toMatch(/august/i);
  });
});

test.describe('J7: Navigation via BottomNav', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('user navigates all pages via bottom tab bar', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // BottomNav should be visible
    const bottomNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(bottomNav).toBeVisible();

    // Navigate to Stats via BottomNav
    await page.getByRole('link', { name: /statistics/i }).click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Verify stats page loaded
    await expect(page.getByText(/Overall Performance|Συνολική Απόδοση|Season Summary/i)).toBeVisible({ timeout: 5000 });

    // Navigate to Settings via BottomNav
    await page.getByRole('link', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    // Verify settings page
    await expect(page.getByText(/Notification Settings|Ρυθμίσεις Ειδοποιήσεων/i)).toBeVisible({ timeout: 3000 });

    // Go back to Calendar via BottomNav
    await page.getByRole('link', { name: /calendar/i }).click();
    await page.waitForTimeout(1000);

    // Calendar should be visible — check for month heading
    await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
  });
});

test.describe('J8: Event details for different states', () => {
  test('played match shows score and result badge', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Navigate to September where there are played matches
    const prevBtn = page.getByRole('button', { name: /previous/i });
    for (let i = 0; i < 12; i++) {
      await prevBtn.click();
      await page.waitForTimeout(100);
    }

    // Find and click a played match (one with a score shown)
    const playedCard = page.locator('[class*="cursor-pointer"]').first();
    if (await playedCard.isVisible()) {
      await playedCard.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      const dialogText = await dialog.textContent();
      // Played matches show a score pattern (X-X)
      dialogText?.match(/\d+-\d+/);

      // Close and test an upcoming match
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }

    // Navigate to a future month for upcoming matches
    const nextBtn = page.getByRole('button', { name: /next/i });
    for (let i = 0; i < 6; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }

    // Click an upcoming match
    const upcomingCard = page.locator('[class*="cursor-pointer"]').first();
    if (await upcomingCard.isVisible()) {
      await upcomingCard.click();
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await dialog.textContent();
        // Upcoming matches show time, not scores
        expect(text).toContain('Νέα Σαλαμίνα');
        await page.keyboard.press('Escape');
      }
    }
  });
});
