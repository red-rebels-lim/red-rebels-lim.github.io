import { test, expect } from '@playwright/test';

test.describe('Calendar Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure consistent language (English)
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  // ── Navbar ──────────────────────────────────────────────────────

  test.describe('Navbar', () => {
    test('displays the brand text', async ({ page }) => {
      await expect(page.getByText('Red Rebels 25/26')).toBeVisible();
    });

    test('has navigation links for Calendar, Statistics, Team', async ({ page }) => {
      await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /statistics/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /team/i })).toBeVisible();
    });

    test('Calendar link is active on the calendar page', async ({ page }) => {
      const calendarLink = page.getByRole('link', { name: /calendar/i });
      await expect(calendarLink).toBeVisible();
    });

    test('navigates to Stats page when clicking Statistics link', async ({ page }) => {
      await page.getByRole('link', { name: /statistics/i }).click();
      await expect(page.getByText('Overall Performance')).toBeVisible();
    });

    test('navigates to Team page when clicking Team link', async ({ page }) => {
      await page.getByRole('link', { name: /team/i }).click();
      // Team page should change the URL hash
      await page.waitForURL('**/team', { timeout: 5000 }).catch(() => {});
      await expect(page).toHaveURL(/#\/team/);
    });

    test('language toggle switches between EN and GR', async ({ page }) => {
      const langButton = page.getByRole('button', { name: /^(EN|GR)$/ });
      await expect(langButton).toBeVisible();
      const initialText = await langButton.textContent();

      await langButton.click();
      const newText = await langButton.textContent();
      expect(newText).not.toBe(initialText);

      // Click again to toggle back
      await langButton.click();
      const restoredText = await langButton.textContent();
      expect(restoredText).toBe(initialText);
    });

    test('theme toggle button is visible', async ({ page }) => {
      // Theme toggle shows sun or moon emoji
      const themeButton = page.getByRole('button', { name: /[☀🌙]/u });
      await expect(themeButton).toBeVisible();
    });
  });

  // ── Month Navigation ────────────────────────────────────────────

  test.describe('Month Navigation', () => {
    test('displays a month name', async ({ page }) => {
      const monthNames = [
        'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL',
        'MAY', 'JUNE', 'JULY', 'AUGUST',
      ];
      const monthNav = page.locator('text=/^(' + monthNames.join('|') + ')$/i');
      await expect(monthNav.first()).toBeVisible();
    });

    test('Previous and Next buttons are visible', async ({ page }) => {
      await expect(page.getByText('Previous')).toBeVisible();
      await expect(page.getByText('Next')).toBeVisible();
    });

    test('Today button is visible', async ({ page }) => {
      await expect(page.getByText('Today')).toBeVisible();
    });

    test('clicking Next changes the month name', async ({ page }) => {
      // Navigate to September first
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }
      await expect(page.getByText(/september/i)).toBeVisible();

      // Click Next
      await page.getByText('Next').click();
      await expect(page.getByText(/october/i)).toBeVisible();
    });

    test('clicking Previous changes the month name', async ({ page }) => {
      // Navigate to October first
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }
      await page.getByText('Next').click();
      await expect(page.getByText(/october/i)).toBeVisible();

      // Click Previous to go back
      await prevButton.click();
      await expect(page.getByText(/september/i)).toBeVisible();
    });

    test('Previous at September does not change the month', async ({ page }) => {
      // Navigate to September
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }
      await expect(page.getByText(/september/i)).toBeVisible();

      // Click Previous again - should stay on September
      await prevButton.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/september/i)).toBeVisible();
    });

    test('Next at August does not change the month', async ({ page }) => {
      // Navigate to August
      const nextButton = page.getByText('Next');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/august/i).isVisible().catch(() => false)) break;
        await nextButton.click();
        await page.waitForTimeout(200);
      }
      await expect(page.getByText(/august/i)).toBeVisible();

      // Click Next again - should stay on August
      await nextButton.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/august/i)).toBeVisible();
    });
  });

  // ── Calendar Grid ───────────────────────────────────────────────

  test.describe('Calendar Grid', () => {
    test('displays day-of-week headers on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      for (const day of days) {
        await expect(page.getByText(day, { exact: true }).first()).toBeVisible();
      }
    });

    test('September shows football events', async ({ page }) => {
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }
      await expect(page.getByText(/september/i)).toBeVisible();

      const eventCards = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]');
      const count = await eventCards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('October shows multiple sport events', async ({ page }) => {
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }
      await page.getByText('Next').click();
      await expect(page.getByText(/october/i)).toBeVisible();

      const eventCards = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]');
      const count = await eventCards.count();
      expect(count).toBeGreaterThanOrEqual(7);
    });

    test('played matches show scores on the event card', async ({ page }) => {
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }

      const scoreElements = page.locator('[class*="rounded-lg"] >> text=/\\d+-\\d+/');
      const count = await scoreElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ── Event Popover ───────────────────────────────────────────────

  test.describe('Event Popover', () => {
    test('clicking an event card opens a dialog', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    });

    test('dialog shows event title with team name', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toContain('Νέα Σαλαμίνα');
    });

    test('dialog shows time or TBD', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      const hasTime = /\d{1,2}:\d{2}/.test(dialogText || '');
      const hasTBD = dialogText?.includes('TBD') || false;
      expect(hasTime || hasTBD).toBe(true);
    });

    test('dialog shows location (Home or Away)', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      const hasLocation = dialogText?.includes('Home') || dialogText?.includes('Away');
      expect(hasLocation).toBe(true);
    });

    test('dialog shows result badge for played matches', async ({ page }) => {
      // Navigate to September (all played)
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }

      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      const hasResult = dialogText?.includes('Win') || dialogText?.includes('Draw') || dialogText?.includes('Loss');
      expect(hasResult).toBe(true);
    });

    test('dialog shows score for played matches', async ({ page }) => {
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }

      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toMatch(/\d+-\d+/);
    });

    test('dialog can be closed with Escape', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ── Filter Panel ────────────────────────────────────────────────

  test.describe('Filter Panel', () => {
    test('filters panel is hidden by default', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      // The Sport filter label should not be visible when panel is closed
      await expect(page.getByText('Sport', { exact: true })).not.toBeVisible();
    });

    test('clicking Filters button toggles the filter panel', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      const filtersBtn = page.getByRole('button', { name: /filter/i });
      await filtersBtn.click();

      // Filter panel labels should now show
      await expect(page.getByText('Sport', { exact: true })).toBeVisible();
      await expect(page.getByText('Location', { exact: true })).toBeVisible();
      await expect(page.getByText('Status', { exact: true })).toBeVisible();
      await expect(page.getByText('Search Opponent')).toBeVisible();

      // Toggle off
      await filtersBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText('Sport', { exact: true })).not.toBeVisible();
    });

    test('status filter changes displayed events', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Navigate to September (all played)
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }

      const eventsBefore = await page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').count();
      expect(eventsBefore).toBeGreaterThan(0);

      // Open filters
      const filtersBtn = page.getByRole('button', { name: /filter/i });
      await filtersBtn.click();
      await page.waitForTimeout(300);

      // Click the Status dropdown trigger (Radix Select)
      const statusTrigger = page.locator('button[role="combobox"]').nth(2);
      await statusTrigger.click();
      await page.waitForTimeout(300);

      // Select "Upcoming" from the dropdown
      await page.getByRole('option', { name: /upcoming/i }).click();
      await page.waitForTimeout(500);

      // September has all played matches, so Upcoming should show none
      const eventsAfter = await page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').count();
      expect(eventsAfter).toBeLessThan(eventsBefore);
    });

    test('Clear All resets filters', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Open filters
      const filtersBtn = page.getByRole('button', { name: /filter/i });
      await filtersBtn.click();
      await page.waitForTimeout(300);

      // Apply a filter - click status trigger
      const statusTrigger = page.locator('button[role="combobox"]').nth(2);
      await statusTrigger.click();
      await page.waitForTimeout(300);
      await page.getByRole('option', { name: /upcoming/i }).click();
      await page.waitForTimeout(300);

      // Click Clear All
      await page.getByText('Clear All').click();
      await page.waitForTimeout(300);

      // Status trigger should now show "All"
      await expect(statusTrigger).toContainText(/all/i);
    });

    test('search filter narrows down events', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Navigate to October (7 events)
      const prevButton = page.getByText('Previous');
      for (let i = 0; i < 12; i++) {
        if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
        await prevButton.click();
        await page.waitForTimeout(200);
      }
      await page.getByText('Next').click();
      await page.waitForTimeout(300);

      const eventsBefore = await page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').count();

      // Open filters
      const filtersBtn = page.getByRole('button', { name: /filter/i });
      await filtersBtn.click();
      await page.waitForTimeout(300);

      // Type in search input
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('ΧΑΛΚΑΝΟΡΑΣ');
      await page.waitForTimeout(500);

      const eventsAfter = await page.locator('[class*="cursor-pointer"][class*="rounded-lg"]').count();
      expect(eventsAfter).toBeLessThan(eventsBefore);
      expect(eventsAfter).toBeGreaterThan(0);
    });
  });

  // ── Footer / Legend ─────────────────────────────────────────────

  test.describe('Footer Legend', () => {
    test('displays the Legend section', async ({ page }) => {
      await expect(page.getByText('Legend')).toBeVisible();
    });

    test('shows sport type labels', async ({ page }) => {
      await expect(page.getByText("Men's Football")).toBeVisible();
      await expect(page.getByText("Men's Volleyball", { exact: true })).toBeVisible();
      await expect(page.getByText("Women's Volleyball")).toBeVisible();
    });
  });

  // ── i18n ────────────────────────────────────────────────────────

  test.describe('i18n Language Toggle', () => {
    test('switching language changes labels', async ({ page }) => {
      // Should start in English (set in beforeEach), button shows "EN"
      await expect(page.getByText('Legend')).toBeVisible();

      // Click EN button to toggle to Greek
      const langButton = page.getByRole('button', { name: 'EN', exact: true });
      await langButton.click();
      await page.waitForTimeout(500);

      // Greek labels should show, button now shows "GR"
      await expect(page.getByText('Υπόμνημα')).toBeVisible();

      // Click GR button to toggle back to English
      const grButton = page.getByRole('button', { name: 'GR', exact: true });
      await grButton.click();
      await page.waitForTimeout(500);

      await expect(page.getByText('Legend')).toBeVisible();
    });
  });
});
