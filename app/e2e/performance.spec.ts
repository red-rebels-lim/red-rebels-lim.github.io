import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Performance metrics', () => {
  test('Calendar page LCP is under 3 seconds', async ({ page }) => {
    // Set up LCP measurement before navigating
    await page.goto('/#/', { waitUntil: 'commit' });

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            lcpValue = entry.startTime;
          }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Wait for page to fully settle, then report
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 5000);
      });
    });

    // LCP should be under 3000ms (generous for dev server)
    expect(lcp).toBeLessThan(3000);
  });

  test('Calendar page has no layout shift (CLS check)', async ({ page }) => {
    await page.goto('/#/', { waitUntil: 'commit' });

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
              clsValue += (entry as PerformanceEntry & { value: number }).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });

    // CLS should be under 0.25 (lenient for dev mode)
    expect(cls).toBeLessThan(0.25);
  });

  test('Stats page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/#/stats');
    await page.waitForLoadState('networkidle');

    // Wait for actual content to appear
    await page.getByText(/Overall Performance|Συνολική Απόδοση/i).waitFor({ timeout: 10000 });
    const elapsed = Date.now() - start;

    // Should load within 5 seconds on dev server
    expect(elapsed).toBeLessThan(5000);
  });

  // eslint-disable-next-line no-empty-pattern
  test('Bundle size check (production build)', async ({}, testInfo) => {
    const fs = await import('fs');
    const distDir = resolve(__dirname, '../dist/assets');

    if (!fs.existsSync(distDir)) {
      testInfo.skip(true, 'No dist folder — run pnpm build first');
      return;
    }

    const files = fs.readdirSync(distDir);
    const jsFiles = files.filter((f: string) => f.endsWith('.js'));

    let totalJsSize = 0;
    for (const f of jsFiles) {
      const stat = fs.statSync(join(distDir, f));
      totalJsSize += stat.size;
    }

    // Total JS bundle should be under 2MB uncompressed (includes recharts, parse, react)
    // This threshold prevents accidental massive dependency additions
    expect(totalJsSize).toBeLessThan(2_000_000);
  });

  test('PWA manifest is valid', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('icons');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
