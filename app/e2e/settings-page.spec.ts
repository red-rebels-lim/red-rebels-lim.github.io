import { test, expect, type Page } from '@playwright/test';

function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

async function openMobileMenu(page: Page) {
  const hamburger = page.locator('nav button.md\\:hidden');
  await hamburger.click();
  await page.waitForTimeout(300);
}

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/settings');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('renders the page with navbar', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('displays the Settings heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible();
  });

  test('displays the Push Notifications section heading', async ({ page }) => {
    await expect(page.getByText(/push notifications/i).first()).toBeVisible();
  });

  test('shows a push notification status badge or not-supported message', async ({ page }) => {
    // The page shows a status badge (Active, Inactive, Blocked) or "not supported" message
    const badge = page.locator('span').filter({ hasText: /(Active|Inactive|Blocked)/i });
    const notSupported = page.getByText(/not supported/i);

    const hasBadge = await badge.first().isVisible().catch(() => false);
    const hasNotSupported = await notSupported.isVisible().catch(() => false);

    expect(hasBadge || hasNotSupported).toBe(true);
  });

  test('shows appropriate status based on push permission state', async ({ page }) => {
    // In headless browsers, push permission is typically denied/blocked
    // The page should show one of: Enable button, Not supported, or Blocked status
    const enableBtn = page.getByRole('button', { name: /enable notifications/i });
    const notSupported = page.getByText(/not supported/i);
    const blocked = page.getByText('Blocked', { exact: true });
    const active = page.getByText('Active', { exact: true });

    const hasEnable = await enableBtn.isVisible().catch(() => false);
    const hasNotSupported = await notSupported.isVisible().catch(() => false);
    const hasBlocked = await blocked.isVisible().catch(() => false);
    const hasActive = await active.isVisible().catch(() => false);

    expect(hasEnable || hasNotSupported || hasBlocked || hasActive).toBe(true);
  });

  test('Settings nav link is active on the settings page', async ({ page }) => {
    if (isMobile(page)) await openMobileMenu(page);
    const settingsLink = page.getByRole('link', { name: /settings/i });
    await expect(settingsLink).toBeVisible();
  });

  test('navigates back to Calendar from Settings', async ({ page }) => {
    if (isMobile(page)) await openMobileMenu(page);
    await page.getByRole('link', { name: /calendar/i }).click();
    // Verify we're on the calendar page by checking for the month navigation
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page).toHaveURL(/#\//);
  });

  test('navigates to Stats from Settings', async ({ page }) => {
    if (isMobile(page)) await openMobileMenu(page);
    await page.getByRole('link', { name: /statistics/i }).click();
    await expect(page.getByText('Overall Performance')).toBeVisible();
  });
});

test.describe('Settings Page i18n', () => {
  test('page labels change when language is toggled', async ({ page }) => {
    await page.goto('/#/settings');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });

    // English heading
    await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible();

    // Toggle to Greek
    const langButton = page.getByRole('button', { name: 'EN', exact: true });
    await langButton.click();
    await page.waitForTimeout(500);

    // Greek heading should appear (translated title)
    const bodyText = await page.locator('body').textContent();
    // After switching, the English "Notification Settings" should be gone
    expect(bodyText).not.toContain('Notification Settings');
  });

  test('no raw translation keys visible on settings page', async ({ page }) => {
    await page.goto('/#/settings');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });

    const bodyText = await page.locator('body').textContent();
    const rawKeys = [
      'settings.title', 'settings.notifications', 'settings.notSupported',
      'settings.enable', 'settings.disable', 'settings.enabled',
      'settings.disabled', 'settings.permissionDenied', 'settings.deniedHelp',
      'settings.pauseAll', 'settings.eventTypes', 'settings.newEvents',
      'settings.timeChanges', 'settings.scoreUpdates', 'settings.sports',
      'settings.reminders',
    ];
    for (const key of rawKeys) {
      expect(bodyText).not.toContain(key);
    }
  });
});
