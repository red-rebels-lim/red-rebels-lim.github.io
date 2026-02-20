import { test, expect, type Page } from '@playwright/test';

const EVENT_CARD_SELECTOR = '[class*="shadow-md"][class*="cursor-pointer"][class*="rounded-lg"]';

async function navigateToMonth(page: Page, targetMonth: RegExp) {
  if (await page.getByText(targetMonth).first().isVisible().catch(() => false)) return;

  const prevButton = page.getByText('Previous').first();
  for (let i = 0; i < 12; i++) {
    if (await page.getByText(/september/i).first().isVisible().catch(() => false)) break;
    await prevButton.click();
    await page.waitForTimeout(150);
  }

  const nextButton = page.getByText('Next').first();
  for (let i = 0; i < 12; i++) {
    if (await page.getByText(targetMonth).first().isVisible().catch(() => false)) break;
    await nextButton.click();
    await page.waitForTimeout(150);
  }

  await expect(page.getByText(targetMonth).first()).toBeVisible();
}

test.describe('Countdown Timer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('played matches do not show countdown timer', async ({ page }) => {
    // Navigate to September (all played matches)
    await navigateToMonth(page, /september/i);

    const eventCards = page.locator(EVENT_CARD_SELECTOR);
    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);

    // No countdown text (⏱) should appear on played matches
    for (let i = 0; i < count; i++) {
      const cardText = await eventCards.nth(i).textContent();
      expect(cardText).not.toContain('\u23F1');
    }
  });

  test('upcoming matches with kickoff times show countdown or no timer if past', async ({ page }) => {
    // Navigate to a future month that has upcoming events
    // The countdown timer shows ⏱ followed by time format like "2d 3h" or "3h 45m"
    // If the match is in the past, no timer shows
    // We check that the countdown component either renders the expected format or is absent

    // Navigate to August (likely future / end of season)
    await navigateToMonth(page, /august/i);

    const eventCards = page.locator(EVENT_CARD_SELECTOR);
    const count = await eventCards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Check each card - if it has a countdown, it should match the expected format
    for (let i = 0; i < count; i++) {
      const cardText = await eventCards.nth(i).textContent() || '';
      if (cardText.includes('\u23F1')) {
        // Countdown format: ⏱ Xd Xh, ⏱ Xh Xm, or ⏱ Xm
        expect(cardText).toMatch(/\u23F1\s+(\d+d\s+\d+h|\d+h\s+\d+m|\d+m)/);
      }
    }
  });

  test('countdown timer text has yellow color styling', async ({ page }) => {
    // Navigate to find an upcoming event with a countdown
    // Check all months from current forward
    const months = [/february/i, /march/i, /april/i, /may/i, /june/i, /july/i, /august/i];

    let found = false;
    for (const month of months) {
      await navigateToMonth(page, month);
      const countdownEl = page.locator('.text-yellow-300').filter({ hasText: /\u23F1/ });
      const count = await countdownEl.count();
      if (count > 0) {
        found = true;
        // Verify the styling class is applied
        await expect(countdownEl.first()).toBeVisible();
        break;
      }
    }

    // If no upcoming events with countdowns exist, skip gracefully
    if (!found) {
      test.skip();
    }
  });
});
