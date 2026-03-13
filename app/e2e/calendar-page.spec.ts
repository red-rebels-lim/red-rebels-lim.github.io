import { test, expect, type Page } from '@playwright/test';

/** Check if a month name is currently visible on the page (respects CSS visibility). */
async function isMonthVisible(page: Page, month: RegExp): Promise<boolean> {
  const text = await page.locator('body').innerText();
  return month.test(text);
}

/** Navigate to a target month by clicking Previous/Next from the current view. */
async function navigateToMonth(page: Page, targetMonth: RegExp) {
  if (await isMonthVisible(page, targetMonth)) return;

  const prevButton = page.getByRole('button', { name: /previous/i });
  for (let i = 0; i < 12; i++) {
    if (await isMonthVisible(page, /september/i)) break;
    await prevButton.click();
    await page.waitForTimeout(200);
  }

  const nextButton = page.getByRole('button', { name: /next/i });
  for (let i = 0; i < 12; i++) {
    if (await isMonthVisible(page, targetMonth)) break;
    await nextButton.click();
    await page.waitForTimeout(200);
  }

  expect(await isMonthVisible(page, targetMonth)).toBe(true);
}

test.describe('Calendar Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure consistent language (English)
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  // ── Header & Navigation ──────────────────────────────────────

  test.describe('Header & Navigation', () => {
    test('displays the app title', async ({ page }) => {
      await expect(page.getByText('Red Rebels Calendar')).toBeVisible();
    });

    test('BottomNav has links for Calendar, Statistics, and Settings', async ({ page }) => {
      await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /statistics/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    });

    test('navigates to Stats page via BottomNav', async ({ page }) => {
      await page.getByRole('link', { name: /statistics/i }).click();
      await expect(page.getByText(/Overall Performance|Season Summary/i)).toBeVisible({ timeout: 5000 });
    });

    test('navigates back to Calendar from Stats page', async ({ page }) => {
      await page.getByRole('link', { name: /statistics/i }).click();
      await expect(page.getByText(/Overall Performance|Season Summary/i)).toBeVisible({ timeout: 5000 });

      await page.getByRole('link', { name: /calendar/i }).click();
      await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
      await expect(page).toHaveURL(/#\//);
    });

    test('theme toggle button is visible', async ({ page }) => {
      const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
      await expect(themeBtn).toBeVisible();
    });
  });

  // ── Month Navigation ────────────────────────────────────────────

  test.describe('Month Navigation', () => {
    test('displays a month name', async ({ page }) => {
      const monthPattern = /\b(september|october|november|december|january|february|march|april|may|june|july|august)\b/i;
      const bodyText = await page.locator('body').innerText();
      expect(monthPattern.test(bodyText)).toBe(true);
    });

    test('Previous and Next buttons are visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    });

    test('clicking Next changes the month name', async ({ page }) => {
      // Navigate to September first
      await navigateToMonth(page, /september/i);
      expect(await isMonthVisible(page, /september/i)).toBe(true);

      // Click Next
      await page.getByRole('button', { name: /next/i }).click();
      expect(await isMonthVisible(page, /october/i)).toBe(true);
    });

    test('clicking Previous changes the month name', async ({ page }) => {
      // Navigate to October first
      await navigateToMonth(page, /october/i);
      expect(await isMonthVisible(page, /october/i)).toBe(true);

      // Click Previous to go back
      await page.getByRole('button', { name: /previous/i }).click();
      expect(await isMonthVisible(page, /september/i)).toBe(true);
    });

    test('Previous at September does not change the month', async ({ page }) => {
      await navigateToMonth(page, /september/i);
      expect(await isMonthVisible(page, /september/i)).toBe(true);

      await page.getByRole('button', { name: /previous/i }).click();
      await page.waitForTimeout(300);
      expect(await isMonthVisible(page, /september/i)).toBe(true);
    });

    test('Next at August does not change the month', async ({ page }) => {
      await navigateToMonth(page, /august/i);
      expect(await isMonthVisible(page, /august/i)).toBe(true);

      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);
      expect(await isMonthVisible(page, /august/i)).toBe(true);
    });
  });

  // ── Calendar Grid ───────────────────────────────────────────────

  test.describe('Calendar Grid', () => {
    test('displays abbreviated day-of-week headers', async ({ page }) => {
      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      for (const day of days) {
        await expect(page.getByText(day, { exact: true }).first()).toBeVisible();
      }
    });

    test('September shows football events', async ({ page }) => {
      await navigateToMonth(page, /september/i);

      const eventCards = page.locator('[class*="cursor-pointer"][class*="rounded"]');
      const count = await eventCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('October shows multiple sport events', async ({ page }) => {
      await navigateToMonth(page, /october/i);

      const eventCards = page.locator('[class*="cursor-pointer"][class*="rounded"]');
      const count = await eventCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Event Popover ───────────────────────────────────────────────

  test.describe('Event Popover', () => {
    test('clicking an event card opens a dialog', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    });

    test('dialog shows event title with team name', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toContain('Νέα Σαλαμίνα');
    });

    test('dialog shows time or TBD', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      const hasTime = /\d{1,2}:\d{2}/.test(dialogText || '');
      const hasTBD = dialogText?.includes('TBD') || false;
      expect(hasTime || hasTBD).toBe(true);
    });

    test('dialog shows location (Home or Away)', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      const hasLocation = dialogText?.includes('Home') || dialogText?.includes('Away');
      expect(hasLocation).toBe(true);
    });

    test('dialog shows result badge for played matches', async ({ page }) => {
      await navigateToMonth(page, /september/i);

      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      const hasResult = dialogText?.includes('Win') || dialogText?.includes('Draw') || dialogText?.includes('Loss');
      expect(hasResult).toBe(true);
    });

    test('dialog shows score for played matches', async ({ page }) => {
      await navigateToMonth(page, /september/i);

      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
      await eventCard.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toMatch(/\d+-\d+/);
    });

    test('dialog can be closed with Escape', async ({ page }) => {
      const eventCard = page.locator('[class*="cursor-pointer"][class*="rounded"]').first();
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
      // The Sport filter label should not be visible when panel is closed
      await expect(page.getByText('Sport', { exact: true })).not.toBeVisible();
    });

    test('status filter changes displayed events', async ({ page }) => {
      // Navigate to September (all played)
      await navigateToMonth(page, /september/i);

      const eventsBefore = await page.locator('[class*="cursor-pointer"][class*="rounded"]').count();
      expect(eventsBefore).toBeGreaterThan(0);

      // Open filters via keyboard shortcut (f key)
      await page.keyboard.press('f');
      await page.waitForTimeout(300);

      // Click the Status dropdown trigger (Radix Select)
      const statusTrigger = page.locator('button[role="combobox"]').nth(2);
      await statusTrigger.click();
      await page.waitForTimeout(300);

      // Select "Upcoming" from the dropdown
      await page.getByRole('option', { name: /upcoming/i }).click();
      await page.waitForTimeout(500);

      // September has all played matches, so Upcoming should show none
      const eventsAfter = await page.locator('[class*="cursor-pointer"][class*="rounded"]').count();
      expect(eventsAfter).toBeLessThan(eventsBefore);
    });

    test('Clear All resets filters', async ({ page }) => {
      // Open filters via keyboard shortcut
      await page.keyboard.press('f');
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
      // Navigate to October (7 events)
      await navigateToMonth(page, /october/i);

      const eventsBefore = await page.locator('[class*="cursor-pointer"][class*="rounded"]').count();

      // Open filters via keyboard shortcut
      await page.keyboard.press('f');
      await page.waitForTimeout(300);

      // Type in search input
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('ΧΑΛΚΑΝΟΡΑΣ');
      await page.waitForTimeout(500);

      const eventsAfter = await page.locator('[class*="cursor-pointer"][class*="rounded"]').count();
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
});
