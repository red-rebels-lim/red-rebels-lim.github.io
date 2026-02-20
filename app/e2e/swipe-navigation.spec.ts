import { test, expect, type Page } from '@playwright/test';

/** Check if a month name is currently visible on the page (respects CSS visibility). */
async function isMonthVisible(page: Page, month: RegExp): Promise<boolean> {
  const text = await page.locator('body').innerText();
  return month.test(text);
}

async function navigateToMonth(page: Page, targetMonth: RegExp) {
  if (await isMonthVisible(page, targetMonth)) return;

  // Click Previous to get to September first (Playwright auto-selects visible button)
  const prevButton = page.getByRole('button', { name: 'Previous' });
  for (let i = 0; i < 12; i++) {
    if (await isMonthVisible(page, /september/i)) break;
    await prevButton.click();
    await page.waitForTimeout(200);
  }

  // Click Next to reach the target month
  const nextButton = page.getByRole('button', { name: 'Next' });
  for (let i = 0; i < 12; i++) {
    if (await isMonthVisible(page, targetMonth)) break;
    await nextButton.click();
    await page.waitForTimeout(200);
  }

  expect(await isMonthVisible(page, targetMonth)).toBe(true);
}

/**
 * Simulate a swipe gesture by dispatching native TouchEvents on the calendar
 * container element which has React's onTouchStart/onTouchEnd handlers.
 */
async function swipe(page: Page, direction: 'left' | 'right') {
  const container = page.locator('div[class*="max-w-"]').first();
  const box = await container.boundingBox();
  if (!box) return;

  const startX = direction === 'left' ? box.x + box.width * 0.8 : box.x + box.width * 0.2;
  const endX = direction === 'left' ? box.x + box.width * 0.2 : box.x + box.width * 0.8;
  const y = box.y + box.height / 3;

  await page.evaluate(
    ({ startX, endX, y, selector }) => {
      const el = document.querySelector(selector);
      if (!el) return;

      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: Date.now(), target: el, screenX: startX, screenY: y, clientX: startX, clientY: y }),
        ],
      });
      el.dispatchEvent(touchStartEvent);

      const touchEndEvent = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [
          new Touch({ identifier: Date.now(), target: el, screenX: endX, screenY: y, clientX: endX, clientY: y }),
        ],
      });
      el.dispatchEvent(touchEndEvent);
    },
    { startX, endX, y, selector: 'div[class*="max-w-"]' }
  );

  await page.waitForTimeout(500);
}

test.describe('Swipe Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('swiping left navigates to next month', async ({ page }) => {
    await navigateToMonth(page, /october/i);
    expect(await isMonthVisible(page, /october/i)).toBe(true);

    await swipe(page, 'left');

    expect(await isMonthVisible(page, /november/i)).toBe(true);
  });

  test('swiping right navigates to previous month', async ({ page }) => {
    await navigateToMonth(page, /november/i);
    expect(await isMonthVisible(page, /november/i)).toBe(true);

    await swipe(page, 'right');

    expect(await isMonthVisible(page, /october/i)).toBe(true);
  });

  test('swipe at September boundary does not go before September', async ({ page }) => {
    await navigateToMonth(page, /september/i);
    expect(await isMonthVisible(page, /september/i)).toBe(true);

    await swipe(page, 'right');

    expect(await isMonthVisible(page, /september/i)).toBe(true);
  });

  test('swipe at August boundary does not go past August', async ({ page }) => {
    await navigateToMonth(page, /august/i);
    expect(await isMonthVisible(page, /august/i)).toBe(true);

    await swipe(page, 'left');

    expect(await isMonthVisible(page, /august/i)).toBe(true);
  });
});
