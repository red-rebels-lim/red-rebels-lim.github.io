---
name: verify-ui
description: |
  Visually verify UI changes using the Playwright MCP browser against the local Docker environment.
  Use when:
  - User says "verify", "check the UI", "visual test", or "does it look right"
  - After implementing styling, layout, or component changes
  - Before creating a PR to confirm UI correctness
  - User wants to E2E test a specific page or flow
---

# Visual UI Verification Skill

Verify UI changes by navigating the running app in a real browser via Playwright MCP, inspecting DOM classes, testing interactions, and capturing screenshots.

## Arguments

- `$ARGUMENTS` (optional): URL path(s) to verify, or a description of what changed.
  - Path example: `/dashboard/affiliate`
  - Description example: `header styling on homepage`
  - If omitted, infer what to verify from the recent conversation context (files edited, task in progress).

## Prerequisites

Before running checks, ensure the environment is ready:

1. **Check Docker is running:**
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
   ```
   If no `camsfinder-web` container is running, tell the user:
   > Docker containers aren't running. Start them with: `pnpm docker:compose:build && pnpm docker:compose:up`

2. **Wait for the web server to respond:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null
   ```
   Retry up to 15 times with 2s delay. If it never returns 200, report the failure and stop.

## Verification Workflow

### Step 1: Determine What to Verify

Based on the arguments or conversation context, identify:
- **Target URL(s)**: Which page(s) to visit
- **Key elements**: What DOM elements/sections matter (header, cards, tables, buttons, etc.)
- **Expected styling**: CSS classes, colors, layout patterns to check
- **Interactions to test**: Links, buttons, hover states, navigation flows

If the user gave a path, use it directly. If they described changes, look at recently edited files in the conversation to figure out the URL and what to check.

### Step 2: Navigate to the Page

```
mcp__playwright__browser_navigate → http://localhost:3000{path}
```

- Verify the page loads (check page title is not empty or an error page).
- If there's a Next.js dev overlay or error dialog, report the error to the user and stop — don't try to work around build errors.

### Step 3: Remove Dev Overlays

The Next.js dev tools overlay can block interactions. Remove it:

```
mcp__playwright__browser_evaluate →
  () => { document.querySelectorAll('nextjs-portal').forEach(el => el.remove()); }
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
  // Adapt selectors based on what's being verified
  const results = {};
  const elements = {
    header: 'header',
    h1: 'h1',
    nav: 'nav',
    main: 'main',
    // ... add relevant selectors
  };
  for (const [name, selector] of Object.entries(elements)) {
    const el = document.querySelector(selector);
    results[name] = el ? { classes: el.className, tag: el.tagName } : 'NOT FOUND';
  }
  return results;
}
```

Compare the actual classes against the expected ones from the implementation plan or the edited code.

### Step 6: Test Interactions

For each interactive element that was changed:

1. **Links**: Click with `mcp__playwright__browser_click`, verify URL changes
2. **Buttons**: Click and verify state change (active class, expanded content, etc.)
3. **Hover states**: Use `mcp__playwright__browser_hover` and inspect class changes
4. **Navigation**: Click a link, verify destination loads, use `mcp__playwright__browser_navigate_back` to return

After interactions, navigate back to the original page to continue testing.

### Step 7: Test Responsive Viewports

CamsFinder traffic is 60% mobile / 40% desktop. **Always test both viewports.** Run mobile first since it's the primary audience.

1. **Mobile (iPhone 14 — 390x844):**
   ```
   mcp__playwright__browser_resize → width: 390, height: 844
   ```
   - Take a full-page screenshot (filename should include `mobile`, e.g. `verify-mobile-{page}.png`)
   - Inspect DOM to verify mobile-specific classes applied (e.g., `sm:` breakpoint boundaries, hidden/visible toggles, stacked vs grid layouts)
   - Check that touch targets are large enough (no tiny links or buttons)
   - Verify no horizontal overflow (`overflow-x` issues)

2. **Desktop (1280x720):**
   ```
   mcp__playwright__browser_resize → width: 1280, height: 720
   ```
   - Take a full-page screenshot (filename should include `desktop`, e.g. `verify-desktop-{page}.png`)
   - Verify desktop layout (grid columns, sidebar visibility, max-width constraints)

3. **Compare:** Flag any elements that look broken in one viewport but fine in the other (e.g., text overflow, missing spacing, collapsed grids).

Include both screenshots in the report so the user can visually compare.

### Step 8: Report Results

Present a summary table:

```
## Verification Results — {page path}

| Check                          | Expected              | Actual                | Status |
|--------------------------------|-----------------------|-----------------------|--------|
| Page loads                     | 200 + title present   | ...                   | PASS   |
| Header background              | bg-[#D00482]          | bg-[#D00482]          | PASS   |
| Active selector color          | bg-[#D00482]          | bg-blue-600           | FAIL   |
| Back link navigates to /       | URL = /               | URL = /               | PASS   |
| Table rows have hover          | hover:bg-gray-50      | hover:bg-gray-50      | PASS   |
| Mobile (390x844) renders       | No overflow, layout OK| ...                   | PASS   |
| Desktop (1280x720) renders     | Grid layout correct   | ...                   | PASS   |
```

- Use **PASS** / **FAIL** / **WARN** status
- For FAILs, show expected vs actual and suggest the fix
- For WARNs, flag things like missing styles due to layout issues (e.g., no root CSS)
- End with a count: `X/Y checks passed`

### Step 9: Cleanup

```
mcp__playwright__browser_close
```

## Multi-Page Flows

If verifying a flow across pages (e.g., "click filter, see results, click model"):

1. Navigate to the start page
2. Perform each step sequentially
3. Verify the expected state after each action
4. Take a screenshot at each major step
5. Report results for each step

## Error Handling

### Docker Not Running
```
Docker containers are not running.
Start with: pnpm docker:compose:build && pnpm docker:compose:up
```

### Build Error on Page
If the page shows a Next.js build error overlay, report:
```
Build error on {path}: {error message}
This must be fixed before visual verification can proceed.
```
Do NOT try to dismiss build errors — they indicate real problems.

### Page Returns Non-200
```
Page {path} returned status {code}.
Check that the route exists and the server is healthy.
```

## Notes

- This skill uses Playwright MCP tools — no Playwright test files are created
- Adapt selectors and checks dynamically based on what was changed
- Keep the verification focused on what's relevant, don't check the entire page for every run
- The Docker dev environment runs `NODE_ENV=development` — auth guards may be bypassed
- Screenshots are the primary visual evidence — always capture at least one
