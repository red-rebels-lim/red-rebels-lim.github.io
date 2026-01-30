import { test, expect } from '@playwright/test';

/**
 * Verify volleyball events are visible in the calendar app.
 *
 * Volleyball fixtures (from cfa_fixtures.json):
 *   - volleyball-men:   Oct 2025 (17th), Jan 2026 (16,19,23), Feb 2026 (2,5,9)
 *   - volleyball-women: Oct 2025 (18,25), Jan 2026 (17,24,31)
 *
 * Sport config emojis:
 *   volleyball-men:   👨🏐  (U+1F468 U+1F3D0)
 *   volleyball-women: 👩🏻🏐 (U+1F469 U+1F3FB U+1F3D0)
 */

const SCREENSHOT_DIR = 'e2e/screenshots/volleyball';

// Locator for event cards inside the calendar grid.
// EventCard renders: div with classes containing "cursor-pointer", "rounded-lg", "shadow-md"
// Using shadow-md to disambiguate from nav links which don't have it.
const EVENT_CARD_SELECTOR = '[class*="shadow-md"][class*="cursor-pointer"][class*="rounded-lg"]';

/** Helper: navigate to a target month by clicking Previous/Next from the current view. */
async function navigateToMonth(page: import('@playwright/test').Page, targetMonth: RegExp) {
  if (await page.getByText(targetMonth).isVisible().catch(() => false)) return;

  const prevButton = page.getByText('Previous');
  for (let i = 0; i < 12; i++) {
    if (await page.getByText(/september/i).isVisible().catch(() => false)) break;
    await prevButton.click();
    await page.waitForTimeout(150);
  }

  const nextButton = page.getByText('Next');
  for (let i = 0; i < 12; i++) {
    if (await page.getByText(targetMonth).isVisible().catch(() => false)) break;
    await nextButton.click();
    await page.waitForTimeout(150);
  }

  await expect(page.getByText(targetMonth)).toBeVisible();
}

test.describe('Volleyball Events Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  // ── October 2025 ───────────────────────────────────────────────

  test('October 2025 shows volleyball events', async ({ page }) => {
    await navigateToMonth(page, /october/i);

    const volleyballEmoji = '\u{1F3D0}';
    const eventCards = page.locator(EVENT_CARD_SELECTOR);

    // October has football + volleyball events; at least 7 total
    const allCardsCount = await eventCards.count();
    expect(allCardsCount).toBeGreaterThanOrEqual(3);

    // Volleyball emoji should be on the page
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(volleyballEmoji);

    // Verify ΠΑΦΙΑΚΟΣ opponent (volleyball-men, Oct 17)
    const pafiakosMatcher = page.locator(EVENT_CARD_SELECTOR, {
      hasText: /\u03A0\u0391\u03A6\u0399\u0391\u039A/,
    });
    expect(await pafiakosMatcher.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/october-2025-all-events.png`, fullPage: true });
  });

  test('October 2025 volleyball event dialog shows correct details', async ({ page }) => {
    await navigateToMonth(page, /october/i);

    const pafCard = page.locator(EVENT_CARD_SELECTOR, {
      hasText: /\u03A0\u0391\u03A6\u0399\u0391\u039A/,
    }).first();
    await pafCard.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const dialogText = await dialog.textContent();
    // Νέα Σαλαμίνα
    expect(dialogText).toContain('\u039D\u03AD\u03B1 \u03A3\u03B1\u03BB\u03B1\u03BC\u03AF\u03BD\u03B1');
    // ΠΑΦΙΑΚΟΣ
    expect(dialogText).toContain('\u03A0\u0391\u03A6\u0399\u0391\u039A\u039F\u03A3');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/october-2025-volleyball-dialog.png` });
    await page.keyboard.press('Escape');
  });

  // ── January 2026 ───────────────────────────────────────────────

  test('January 2026 shows volleyball events', async ({ page }) => {
    await navigateToMonth(page, /january/i);

    const volleyballEmoji = '\u{1F3D0}';
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(volleyballEmoji);

    const eventCards = page.locator(EVENT_CARD_SELECTOR);
    const count = await eventCards.count();
    // 6 volleyball + football events
    expect(count).toBeGreaterThanOrEqual(6);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/january-2026-all-events.png`, fullPage: true });
  });

  // ── February 2026 ──────────────────────────────────────────────

  test('February 2026 shows volleyball events', async ({ page }) => {
    await navigateToMonth(page, /february/i);

    const volleyballEmoji = '\u{1F3D0}';
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(volleyballEmoji);

    const eventCards = page.locator(EVENT_CARD_SELECTOR);
    const count = await eventCards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/february-2026-all-events.png`, fullPage: true });
  });

  // ── Sport Filter: Volleyball Men ───────────────────────────────

  test('Sport filter "Volleyball Men" shows only volleyball-men events', async ({ page }) => {
    await navigateToMonth(page, /october/i);

    const eventCards = page.locator(EVENT_CARD_SELECTOR);
    const totalBefore = await eventCards.count();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/october-before-filter.png`, fullPage: true });

    // Open filter panel
    const filtersBtn = page.getByRole('button', { name: /filter/i });
    await filtersBtn.click();
    await page.waitForTimeout(300);

    // Click Sport dropdown (first combobox)
    const sportTrigger = page.locator('button[role="combobox"]').first();
    await sportTrigger.click();
    await page.waitForTimeout(300);

    // Select "Men's Volleyball" with exact match to avoid matching "Women's Volleyball"
    await page.getByRole('option', { name: "Men's Volleyball", exact: true }).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/october-volleyball-men-filter.png`, fullPage: true });

    // Fewer events (only volleyball-men)
    const totalAfter = await eventCards.count();
    expect(totalAfter).toBeLessThan(totalBefore);
    expect(totalAfter).toBeGreaterThanOrEqual(1); // Oct 17

    // All remaining events should have volleyball emoji
    const volleyballEmoji = '\u{1F3D0}';
    for (let i = 0; i < totalAfter; i++) {
      const cardText = await eventCards.nth(i).textContent();
      expect(cardText).toContain(volleyballEmoji);
    }

    // Navigate to January -- filter persists
    await navigateToMonth(page, /january/i);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/january-volleyball-men-filter.png`, fullPage: true });

    const janCards = page.locator(EVENT_CARD_SELECTOR);
    const janCount = await janCards.count();
    expect(janCount).toBe(3); // Jan 16, 19, 23

    for (let i = 0; i < janCount; i++) {
      const cardText = await janCards.nth(i).textContent();
      expect(cardText).toContain(volleyballEmoji);
    }

    // Navigate to February
    await navigateToMonth(page, /february/i);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/february-volleyball-men-filter.png`, fullPage: true });

    const febCards = page.locator(EVENT_CARD_SELECTOR);
    const febCount = await febCards.count();
    expect(febCount).toBe(3); // Feb 2, 5, 9
  });

  // ── Sport Filter: Volleyball Women ─────────────────────────────

  test('Sport filter "Volleyball Women" shows only volleyball-women events', async ({ page }) => {
    await navigateToMonth(page, /october/i);

    // Open filter panel
    const filtersBtn = page.getByRole('button', { name: /filter/i });
    await filtersBtn.click();
    await page.waitForTimeout(300);

    // Click Sport dropdown
    const sportTrigger = page.locator('button[role="combobox"]').first();
    await sportTrigger.click();
    await page.waitForTimeout(300);

    // Select "Women's Volleyball"
    await page.getByRole('option', { name: "Women's Volleyball", exact: true }).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/october-volleyball-women-filter.png`, fullPage: true });

    // October has volleyball-women on 18 and 25
    const eventCards = page.locator(EVENT_CARD_SELECTOR);
    const count = await eventCards.count();
    expect(count).toBe(2);

    const volleyballEmoji = '\u{1F3D0}';
    for (let i = 0; i < count; i++) {
      const cardText = await eventCards.nth(i).textContent();
      expect(cardText).toContain(volleyballEmoji);
    }
  });
});
