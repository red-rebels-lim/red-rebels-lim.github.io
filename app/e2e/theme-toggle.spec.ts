import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('theme toggle button is visible in MobileHeader', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    await expect(themeBtn).toBeVisible();
  });

  test('clicking theme toggle switches the html class from dark to light', async ({ page }) => {
    // Default is dark mode
    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveClass(/dark/);

    // Click theme toggle
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    await themeBtn.click();
    await page.waitForTimeout(300);

    // Should now have light class
    await expect(htmlEl).toHaveClass(/light/);
    await expect(htmlEl).not.toHaveClass(/dark/);
  });

  test('clicking theme toggle twice returns to dark mode', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    const htmlEl = page.locator('html');

    await expect(htmlEl).toHaveClass(/dark/);

    // Toggle to light
    await themeBtn.click();
    await page.waitForTimeout(300);
    await expect(htmlEl).toHaveClass(/light/);

    // Toggle back to dark
    await themeBtn.click();
    await page.waitForTimeout(300);
    await expect(htmlEl).toHaveClass(/dark/);
  });

  test('theme persists in localStorage', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });

    // Toggle to light
    await themeBtn.click();
    await page.waitForTimeout(300);

    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('light');

    // Toggle back to dark
    await themeBtn.click();
    await page.waitForTimeout(300);

    const storedThemeDark = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedThemeDark).toBe('dark');
  });

  test('theme persists across page reload', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });

    // Toggle to light
    await themeBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveClass(/light/);

    // Reload and check persistence
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await expect(page.locator('html')).toHaveClass(/light/);

    // Clean up: restore dark mode
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  });

  test('theme toggle on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveClass(/dark/);

    // Theme toggle is always in MobileHeader
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(300);

    // Should switch to light
    await expect(htmlEl).toHaveClass(/light/);
  });
});
