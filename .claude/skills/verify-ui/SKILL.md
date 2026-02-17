---
name: verify-ui
description: |
  Visually verify UI changes using the Playwright MCP browser against the local dev environment.
  Use when:
  - User says "verify", "check the UI", "visual test", or "does it look right"
  - After implementing styling, layout, or component changes
  - Before creating a PR to confirm UI correctness
  - User wants to E2E test a specific page or flow
---

# Visual UI Verification Skill

Verify UI changes by navigating the running app in a real browser via Playwright MCP, inspecting DOM classes, testing interactions, and capturing screenshots.

## Arguments

- `$ARGUMENTS` (optional): URL hash path(s) to verify, or a description of what changed.
  - Path example: `/#/stats`
  - Description example: `calendar filter styling`
  - If omitted, infer what to verify from the recent conversation context (files edited, task in progress).

## Project Context

- **Project**: Red Rebels Calendar (Nea Salamina / Red Rebels Limassol sports calendar)
- **Tech stack**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Routing**: HashRouter — routes are `/#/` (Calendar) and `/#/stats` (Statistics)
- **Brand color**: `#E02520` (red)
- **Theme**: Dark mode default (`bg-[#0a1810]`), light mode toggle available
- **Font**: Montserrat
- **Styling**: Tailwind CSS with glassmorphism effects, custom CSS variables
- **i18n**: English/Greek (i18next)
- **Dev port**: 5173 (Vite dev server)
- **Docker dev port**: 5173 (via `docker-compose --profile dev up`)
- **Production port**: 80 (Nginx via `docker-compose up`)

## Prerequisites

Before running checks, ensure the environment is ready:

1. **Check if the dev server or Docker is running:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null
   ```
   If it doesn't return 200, also try port 80 (production Docker):
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:80/ 2>/dev/null
   ```
   Use whichever port responds. If neither responds, tell the user:
   > Dev server isn't running. Start it with:
   > - `cd app && npm run dev` (Vite dev server on port 5173)
   > - or `cd app && docker-compose --profile dev up` (Docker dev on port 5173)

2. **Retry up to 10 times with 2s delay** if the server is starting up. If it never returns 200, report the failure and stop.

## Verification Workflow

### Step 1: Determine What to Verify

Based on the arguments or conversation context, identify:
- **Target URL(s)**: Which page(s) to visit (remember HashRouter: `/#/` for calendar, `/#/stats` for stats)
- **Key elements**: What DOM elements/sections matter (calendar grid, filter panel, stats cards, header, etc.)
- **Expected styling**: Tailwind classes, brand colors, dark/light theme compliance
- **Interactions to test**: Filters, month navigation, language toggle, theme toggle, swipe gestures

If the user gave a path, use it directly. If they described changes, look at recently edited files in the conversation to figure out the URL and what to check.

### Step 2: Navigate to the Page

```
mcp__playwright__browser_navigate → http://localhost:5173/#/{path}
```

- Verify the page loads (check page title contains "Red Rebels" or is not an error page).
- If there's a Vite error overlay, report the error to the user and stop — don't try to work around build errors.

### Step 3: Remove Dev Overlays

Vite's error overlay can block interactions. Remove it if present:

```
mcp__playwright__browser_evaluate →
  () => { document.querySelectorAll('vite-error-overlay').forEach(el => el.remove()); }
```

### Step 4: Capture a Full-Page Screenshot

```
mcp__playwright__browser_take_screenshot → fullPage: true, type: png
```

Show the screenshot to the user so they can visually inspect.

### Step 5: Inspect DOM Classes

Use `mcp__playwright__browser_evaluate` to extract class names from key elements. Tailor the selectors to whatever was changed. General pattern:

```javascript
() => {
  const results = {};
  const elements = {
    body: 'body',
    header: 'header',
    h1: 'h1',
    main: 'main',
    filterPanel: '[data-testid="filter-panel"], .filter-panel, aside',
    calendarGrid: '[data-testid="calendar-grid"], .calendar-grid',
    footer: 'footer',
  };
  for (const [name, selector] of Object.entries(elements)) {
    const el = document.querySelector(selector);
    results[name] = el ? { classes: el.className, tag: el.tagName } : 'NOT FOUND';
  }
  // Check theme
  const html = document.documentElement;
  results.theme = html.classList.contains('dark') ? 'dark' : 'light';
  results.lang = html.lang || document.documentElement.getAttribute('lang') || 'unknown';
  return results;
}
```

Compare the actual classes against the expected ones from the implementation plan or the edited code.

### Step 6: Test Interactions

For each interactive element that was changed:

1. **Month navigation**: Click prev/next month buttons, verify calendar updates
2. **Filters**: Toggle sport filters (Football, Volleyball), verify events filter correctly
3. **Theme toggle**: Click theme switch, verify dark/light mode classes change
4. **Language toggle**: Switch EN/EL, verify text changes
5. **Match dialogs**: Click on a match event, verify dialog opens with details
6. **Navigation**: Click between Calendar (`/#/`) and Stats (`/#/stats`) pages
7. **Search**: Type in opponent search, verify filtering

After interactions, navigate back to the original page to continue testing.

### Step 7: Test Responsive Viewports

Test both mobile and desktop viewports.

1. **Mobile (iPhone 14 — 390x844):**
   ```
   mcp__playwright__browser_resize → width: 390, height: 844
   ```
   - Take a full-page screenshot (filename should include `mobile`, e.g. `verify-mobile-{page}.png`)
   - **Run the full Mobile Design Audit** (see Step 7a below)
   - Check mobile background image loads (`/images/mobile.jpeg`)

2. **Desktop (1280x720):**
   ```
   mcp__playwright__browser_resize → width: 1280, height: 720
   ```
   - Take a full-page screenshot (filename should include `desktop`, e.g. `verify-desktop-{page}.png`)
   - Verify desktop layout (wider calendar grid, expanded filter panel, stats grid columns)
   - Check desktop background image loads (`/images/main.jpeg`)

3. **Compare:** Flag any elements that look broken in one viewport but fine in the other (e.g., text overflow, missing spacing, collapsed grids).

Include both screenshots in the report so the user can visually compare.

### Step 7a: Mobile Design Audit

**Always run this audit at the mobile viewport (390x844).** Use `mcp__playwright__browser_evaluate` with the script below. This checks against industry standards (Apple HIG, Material Design, WCAG 2.1) and PWA best practices.

```javascript
() => {
  const results = { pass: [], fail: [], warn: [] };
  const add = (list, msg) => results[list].push(msg);

  // ─── 1. VIEWPORT META TAG ───
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    add('fail', 'VIEWPORT: No <meta name="viewport"> tag found');
  } else {
    const content = viewportMeta.getAttribute('content') || '';
    if (content.includes('width=device-width')) {
      add('pass', 'VIEWPORT: width=device-width is set');
    } else {
      add('fail', 'VIEWPORT: Missing width=device-width');
    }
    if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
      add('warn', 'VIEWPORT: Zoom is disabled — may hurt accessibility');
    }
  }

  // ─── 2. HORIZONTAL OVERFLOW ───
  const hasOverflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth;
  if (hasOverflowX) {
    add('fail', `OVERFLOW: Page has horizontal scroll (${document.documentElement.scrollWidth}px > ${document.documentElement.clientWidth}px)`);
  } else {
    add('pass', 'OVERFLOW: No horizontal overflow detected');
  }

  // ─── 3. TOUCH TARGET SIZES (min 44x44px per Apple HIG / WCAG 2.5.5) ───
  const interactiveSelectors = 'a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const interactiveEls = document.querySelectorAll(interactiveSelectors);
  let smallTargets = [];
  let totalInteractive = 0;
  interactiveEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    // Skip hidden/off-screen elements
    if (rect.width === 0 || rect.height === 0) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight * 3) return;
    totalInteractive++;
    if (rect.width < 44 || rect.height < 44) {
      const label = el.textContent?.trim().substring(0, 30) || el.tagName;
      smallTargets.push(`${label} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
    }
  });
  if (smallTargets.length === 0) {
    add('pass', `TOUCH TARGETS: All ${totalInteractive} interactive elements meet 44x44px minimum`);
  } else if (smallTargets.length <= 3) {
    add('warn', `TOUCH TARGETS: ${smallTargets.length}/${totalInteractive} elements below 44x44px: ${smallTargets.join(', ')}`);
  } else {
    add('fail', `TOUCH TARGETS: ${smallTargets.length}/${totalInteractive} elements below 44x44px minimum. Examples: ${smallTargets.slice(0, 5).join(', ')}`);
  }

  // ─── 4. FONT SIZE (min 16px to prevent iOS auto-zoom on inputs, min 12px for readability) ───
  const textEls = document.querySelectorAll('p, span, a, li, td, th, label, h1, h2, h3, h4, h5, h6, button');
  let tinyText = [];
  let inputZoomRisk = false;
  textEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
    if (fontSize < 12) {
      const label = el.textContent?.trim().substring(0, 25) || el.tagName;
      tinyText.push(`${label} (${fontSize}px)`);
    }
  });
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(el => {
    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
    if (fontSize < 16) inputZoomRisk = true;
  });
  if (tinyText.length === 0) {
    add('pass', 'FONT SIZE: All visible text >= 12px');
  } else {
    add('fail', `FONT SIZE: ${tinyText.length} elements below 12px: ${tinyText.slice(0, 5).join(', ')}`);
  }
  if (inputZoomRisk) {
    add('warn', 'FONT SIZE: Input fields < 16px — iOS Safari will auto-zoom on focus');
  }

  // ─── 5. SPACING BETWEEN INTERACTIVE ELEMENTS (min 8px gap) ───
  const interactiveArr = Array.from(interactiveEls).filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < window.innerHeight * 2;
  });
  let tooClose = 0;
  for (let i = 0; i < Math.min(interactiveArr.length, 50); i++) {
    const a = interactiveArr[i].getBoundingClientRect();
    for (let j = i + 1; j < Math.min(interactiveArr.length, 50); j++) {
      if (interactiveArr[j].contains(interactiveArr[i]) || interactiveArr[i].contains(interactiveArr[j])) continue;
      const b = interactiveArr[j].getBoundingClientRect();
      const gapX = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
      const gapY = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
      const gap = Math.sqrt(gapX * gapX + gapY * gapY);
      if (gap > 0 && gap < 8) tooClose++;
    }
  }
  if (tooClose === 0) {
    add('pass', 'SPACING: Interactive elements have adequate spacing (>= 8px)');
  } else {
    add('warn', `SPACING: ${tooClose} pairs of interactive elements are closer than 8px — risk of mis-taps`);
  }

  // ─── 6. CONTRAST RATIO (check key text elements against their backgrounds) ───
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  function getContrastRatio(rgb1, rgb2) {
    const l1 = getLuminance(...rgb1);
    const l2 = getLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  function parseColor(color) {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
  }
  let lowContrast = [];
  const sampleEls = document.querySelectorAll('h1, h2, h3, p, a, button, span');
  const checked = new Set();
  sampleEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    if (checked.size > 30) return;
    const style = window.getComputedStyle(el);
    const fg = parseColor(style.color);
    const bg = parseColor(style.backgroundColor);
    if (!fg || !bg || bg[0] === 0 && bg[1] === 0 && bg[2] === 0 && style.backgroundColor.includes('0)')) return;
    const key = `${fg.join(',')}-${bg.join(',')}`;
    if (checked.has(key)) return;
    checked.add(key);
    const ratio = getContrastRatio(fg, bg);
    const fontSize = parseFloat(style.fontSize);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && style.fontWeight >= 700);
    const minRatio = isLargeText ? 3 : 4.5;
    if (ratio < minRatio) {
      const label = el.textContent?.trim().substring(0, 20) || el.tagName;
      lowContrast.push(`${label} (${ratio.toFixed(1)}:1, needs ${minRatio}:1)`);
    }
  });
  if (lowContrast.length === 0) {
    add('pass', 'CONTRAST: Sampled text elements meet WCAG AA contrast ratios');
  } else {
    add('warn', `CONTRAST: ${lowContrast.length} elements may have low contrast: ${lowContrast.slice(0, 3).join(', ')}`);
  }

  // ─── 7. IMAGE OPTIMIZATION ───
  const images = document.querySelectorAll('img');
  let missingAlt = 0;
  let missingLazy = 0;
  let oversized = 0;
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-hidden') && !img.getAttribute('role')) missingAlt++;
    if (!img.loading && !img.getAttribute('loading')) missingLazy++;
    const rect = img.getBoundingClientRect();
    if (img.naturalWidth > rect.width * 3 && rect.width > 0) oversized++;
  });
  if (missingAlt === 0) {
    add('pass', `IMAGES: All ${images.length} images have alt text`);
  } else {
    add('warn', `IMAGES: ${missingAlt}/${images.length} images missing alt text`);
  }
  if (missingLazy > images.length * 0.5 && images.length > 5) {
    add('warn', `IMAGES: ${missingLazy}/${images.length} images lack lazy loading — consider loading="lazy" for offscreen images`);
  }
  if (oversized > 0) {
    add('warn', `IMAGES: ${oversized} images are significantly larger than their display size — consider responsive srcset`);
  }

  // ─── 8. CONTENT WIDTH & TEXT READABILITY ───
  const bodyWidth = document.body.scrollWidth;
  const viewportWidth = window.innerWidth;
  const paragraphs = document.querySelectorAll('p');
  let longLines = 0;
  paragraphs.forEach(p => {
    const style = window.getComputedStyle(p);
    const charWidth = parseFloat(style.fontSize) * 0.5;
    const lineLength = p.clientWidth / charWidth;
    if (lineLength > 80) longLines++;
  });
  if (longLines > 0) {
    add('warn', `READABILITY: ${longLines} paragraphs exceed ~80 characters per line — consider max-width for better readability`);
  } else {
    add('pass', 'READABILITY: Text line lengths are within readable range');
  }

  // ─── 9. SAFE AREA / NOTCH HANDLING ───
  const html = document.documentElement;
  const bodyStyle = window.getComputedStyle(document.body);
  const htmlStyle = window.getComputedStyle(html);
  const usesEnv = document.head.innerHTML.includes('env(safe-area') ||
                  document.body.innerHTML.includes('env(safe-area') ||
                  bodyStyle.paddingTop.includes('env') ||
                  htmlStyle.getPropertyValue('--safe-area-inset-top') !== '';
  const viewportFit = viewportMeta?.getAttribute('content')?.includes('viewport-fit=cover');
  if (viewportFit && !usesEnv) {
    add('warn', 'SAFE AREA: viewport-fit=cover is set but env(safe-area-inset-*) may not be used — content could be hidden behind notch');
  } else {
    add('pass', 'SAFE AREA: No notch/safe-area conflicts detected');
  }

  // ─── 10. FIXED/STICKY ELEMENTS ───
  // Exclude decorative background layers (z-index < 0 or pointer-events-none)
  let fixedEls = [];
  document.querySelectorAll('*').forEach(el => {
    const pos = window.getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        const isDecorative = zIndex < 0 || style.pointerEvents === 'none';
        if (!isDecorative) {
          fixedEls.push({
            tag: el.tagName,
            classes: el.className?.toString().substring(0, 40),
            height: Math.round(rect.height),
            position: pos
          });
        }
      }
    }
  });
  const fixedHeight = fixedEls.reduce((sum, el) => sum + el.height, 0);
  if (fixedHeight > window.innerHeight * 0.3) {
    add('fail', `FIXED ELEMENTS: Fixed/sticky elements consume ${fixedHeight}px (${Math.round(fixedHeight / window.innerHeight * 100)}% of viewport) — too much space on mobile`);
  } else if (fixedEls.length > 0) {
    add('pass', `FIXED ELEMENTS: ${fixedEls.length} fixed/sticky elements using ${fixedHeight}px (${Math.round(fixedHeight / window.innerHeight * 100)}% of viewport) — acceptable`);
  } else {
    add('pass', 'FIXED ELEMENTS: No fixed/sticky elements detected');
  }

  // ─── 11. SCROLLABLE CONTENT CHECK ───
  const scrollableEls = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 5) {
      scrollableEls.push(el.tagName + (el.className ? '.' + el.className.toString().split(' ')[0] : ''));
    }
  });
  if (scrollableEls.length > 0) {
    add('warn', `SCROLL: ${scrollableEls.length} horizontally scrollable containers detected: ${scrollableEls.slice(0, 3).join(', ')} — ensure scroll indicators are visible`);
  } else {
    add('pass', 'SCROLL: No hidden horizontal scroll containers');
  }

  // ─── 12. PWA META TAGS ───
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const manifest = document.querySelector('link[rel="manifest"]');
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (manifest) add('pass', 'PWA: Web app manifest is linked');
  else add('warn', 'PWA: No web app manifest found');
  if (themeColor) add('pass', `PWA: theme-color is set (${themeColor.getAttribute('content')})`);
  else add('warn', 'PWA: No theme-color meta tag — browser chrome won\'t be branded');
  if (appleIcon) add('pass', 'PWA: Apple touch icon is set');
  else add('warn', 'PWA: No apple-touch-icon — iOS home screen icon will be generic');

  // ─── SUMMARY ───
  results.summary = {
    pass: results.pass.length,
    fail: results.fail.length,
    warn: results.warn.length,
    total: results.pass.length + results.fail.length + results.warn.length
  };

  return results;
}
```

Include the full audit results in the **Mobile Design Audit** section of the report table. Each item maps to a row:

```
## Mobile Design Audit Results

| # | Category         | Check                                      | Status |
|---|------------------|--------------------------------------------|--------|
| 1 | Viewport         | width=device-width is set                  | PASS   |
| 2 | Overflow         | No horizontal overflow                     | PASS   |
| 3 | Touch Targets    | All elements >= 44x44px                    | PASS   |
| 4 | Font Size        | All text >= 12px, inputs >= 16px           | PASS   |
| 5 | Spacing          | Interactive elements >= 8px apart          | PASS   |
| 6 | Contrast         | WCAG AA ratios met                         | WARN   |
| 7 | Images           | Alt text + lazy loading                    | PASS   |
| 8 | Readability      | Line lengths <= 80 chars                   | PASS   |
| 9 | Safe Area        | No notch conflicts                         | PASS   |
|10 | Fixed Elements   | <= 30% of viewport height                  | PASS   |
|11 | Scroll           | No hidden horizontal scroll                | PASS   |
|12 | PWA              | Manifest + theme-color + apple-touch-icon  | PASS   |

Mobile audit: X PASS, Y WARN, Z FAIL
```

For any **FAIL** items, include the specific details and a suggested fix.
For any **WARN** items, include the details so the user can decide whether to address them.

### Step 8: Report Results

Present a summary table:

```
## Verification Results — {page path}

| Check                          | Expected              | Actual                | Status |
|--------------------------------|-----------------------|-----------------------|--------|
| Page loads                     | 200 + title present   | ...                   | PASS   |
| Theme applied                  | dark (default)        | dark                  | PASS   |
| Brand color present            | #E02520               | ...                   | PASS   |
| Calendar grid renders          | Monthly grid visible  | ...                   | PASS   |
| Filter panel works             | Filters toggle events | ...                   | PASS   |
| Stats page loads               | Charts + cards render | ...                   | PASS   |
| Mobile layout                  | Stacked, no overflow  | ...                   | PASS   |
| Mobile design audit            | See audit table below | X pass, Y warn, Z fail| PASS   |
| Desktop (1280x720) renders     | Grid layout correct   | ...                   | PASS   |
```

- Use **PASS** / **FAIL** / **WARN** status
- For FAILs, show expected vs actual and suggest the fix
- For WARNs, flag things like missing styles or slow-loading external data
- End with a count: `X/Y checks passed`

### Step 9: Cleanup

```
mcp__playwright__browser_close
```

## Multi-Page Flows

This app has two main pages. When verifying a flow:

1. Start at `/#/` (Calendar page)
2. Interact with filters, month navigation, match dialogs
3. Navigate to `/#/stats` (Statistics page)
4. Verify stats cards, charts, and league table render
5. Take screenshots at each major step
6. Report results for each step

## Error Handling

### Dev Server Not Running
```
Dev server is not running.
Start with: cd app && npm run dev
Or with Docker: cd app && docker-compose --profile dev up
```

### Build Error on Page
If the page shows a Vite error overlay, report:
```
Build error on {path}: {error message}
This must be fixed before visual verification can proceed.
```
Do NOT try to dismiss build errors — they indicate real problems.

### Page Returns Non-200
```
Page {path} returned status {code}.
Check that the dev server is running and healthy.
```

### External Data Issues
The Stats page fetches data from the FotMob API. If stats cards show loading spinners or errors, flag it as a **WARN** — it may be an external API issue, not a code bug.

## Notes

- This skill uses Playwright MCP tools — no Playwright test files are created
- Adapt selectors and checks dynamically based on what was changed
- Keep the verification focused on what's relevant, don't check the entire page for every run
- The app uses HashRouter — all routes start with `/#/`
- Dark mode is the default theme — verify dark mode first, then optionally toggle to light
- The app is bilingual (EN/EL) — verify the active language if i18n changes were made
- Screenshots are the primary visual evidence — always capture at least one
- Background images are large — they may take a moment to load in dev mode
