import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    // Force desktop viewport for theme button visibility
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('theme toggle button is visible on desktop', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /[☀🌙]/u });
    await expect(themeButton).toBeVisible();
  });

  test('clicking theme toggle switches the html class from dark to light', async ({ page }) => {
    // Default is dark mode
    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveClass(/dark/);

    // Click theme toggle
    const themeButton = page.getByRole('button', { name: /[☀🌙]/u });
    await themeButton.click();
    await page.waitForTimeout(300);

    // Should now have light class
    await expect(htmlEl).toHaveClass(/light/);
    await expect(htmlEl).not.toHaveClass(/dark/);
  });

  test('clicking theme toggle twice returns to dark mode', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /[☀🌙]/u });
    const htmlEl = page.locator('html');

    await expect(htmlEl).toHaveClass(/dark/);

    // Toggle to light
    await themeButton.click();
    await page.waitForTimeout(300);
    await expect(htmlEl).toHaveClass(/light/);

    // Toggle back to dark
    await themeButton.click();
    await page.waitForTimeout(300);
    await expect(htmlEl).toHaveClass(/dark/);
  });

  test('theme persists in localStorage', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /[☀🌙]/u });

    // Toggle to light
    await themeButton.click();
    await page.waitForTimeout(300);

    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('light');

    // Toggle back to dark
    await themeButton.click();
    await page.waitForTimeout(300);

    const storedThemeDark = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedThemeDark).toBe('dark');
  });

  test('theme persists across page reload', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /[☀🌙]/u });

    // Toggle to light
    await themeButton.click();
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveClass(/light/);

    // Reload and check persistence
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await expect(page.locator('html')).toHaveClass(/light/);

    // Clean up: restore dark mode
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  });

  test('theme toggle button icon changes between moon and sun', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /[☀🌙]/u });
    const initialIcon = await themeButton.textContent();

    await themeButton.click();
    await page.waitForTimeout(300);

    const newIcon = await themeButton.textContent();
    expect(newIcon).not.toBe(initialIcon);
  });
});

test.describe('Theme Toggle - Mobile', () => {
  test('theme toggle is in mobile hamburger menu', async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.setViewportSize({ width: 390, height: 844 });

    // Open mobile menu
    const hamburger = page.locator('nav button.md\\:hidden');
    await hamburger.click();
    await page.waitForTimeout(300);

    // Theme toggle button with mode label should be in the sheet
    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    await expect(themeBtn).toBeVisible();
  });

  test('mobile theme toggle switches theme', async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.setViewportSize({ width: 390, height: 844 });

    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveClass(/dark/);

    // Open mobile menu and click theme toggle
    const hamburger = page.locator('nav button.md\\:hidden');
    await hamburger.click();
    await page.waitForTimeout(300);

    const themeBtn = page.getByRole('button', { name: /(light mode|dark mode)/i });
    await themeBtn.click();
    await page.waitForTimeout(300);

    // Should switch to light
    await expect(htmlEl).toHaveClass(/light/);
  });
});
