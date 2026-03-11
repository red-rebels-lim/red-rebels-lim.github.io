# TASK-09: Fix Light/Dark Theme Support Across All Components

**Status:** done
**Depends on:** —
**Estimated scope:** Large (25 issues across 7 files)
**Priority:** High

## Objective

The app was built dark-mode-first. Most calendar components, popovers, dropdowns, and the onboarding/error screens use hardcoded dark-theme colors (hex values like `#1a0f0f`, `#0d1f15`, `#0a1810`, plus `text-white`, `bg-white/N`, `border-white/N`) without corresponding light-mode variants. Light mode is effectively broken — text is invisible, backgrounds are black, and borders disappear.

Fix all components to properly support both light and dark themes using `dark:` variant classes, following the pattern already established in the stats components (LeagueTable, NextMatch, TopScorers, etc.).

## Design Principles

- **Light is default, dark is the variant.** Write `bg-white dark:bg-[#1a0f0f]`, not the reverse.
- **WCAG AA contrast.** Normal text: 4.5:1 minimum. Large text / UI elements: 3:1 minimum.
- **Semantic surface hierarchy.** Light: `white → slate-50 → slate-100`. Dark: keep existing hex values.
- **Borders:** Light: `border-slate-200`. Dark: `border-white/10` or `border-slate-800`.
- **Shadows:** Light: `shadow-sm` / `shadow-md`. Dark: minimal (already invisible on dark bg).
- **No pure white on pure black.** Use off-white text (`slate-50/100`) on dark, and `slate-900` on light.
- **Reference components:** LeagueTable.tsx, NextMatch.tsx, TopScorers.tsx — these already use proper `dark:` variants.

## File-by-File Changes

### 1. EventPopover.tsx — CRITICAL (12 issues)

The entire popover is hardcoded for dark theme. Every background, gradient, and text color needs a light variant.

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~462 | `bg-[#1a6b1a]` (win badge) | `bg-green-100 text-green-800 dark:bg-[#1a6b1a] dark:text-green-100` |
| ~463 | `bg-[#6b5a00]` (draw badge) | `bg-yellow-100 text-yellow-800 dark:bg-[#6b5a00] dark:text-yellow-100` |
| ~464 | `border-[#8a7500]` (draw border) | `border-yellow-400 dark:border-[#8a7500]` |
| ~465 | `bg-[#6b1a1a]` (loss badge) | `bg-red-100 text-red-800 dark:bg-[#6b1a1a] dark:text-red-100` |
| ~465 | `border-[#8a2020]` (loss border) | `border-red-400 dark:border-[#8a2020]` |
| ~466 | `bg-[#2a1a1a]` (upcoming badge) | `bg-slate-200 dark:bg-[#2a1a1a]` |
| ~481 | `bg-gradient-to-br from-[#1a0f0f] to-[#0a1810]` (meeting popover bg) | `bg-white dark:bg-gradient-to-br dark:from-[#1a0f0f] dark:to-[#0a1810]` |
| ~504 | `bg-gradient-to-br from-[#1a0f0f] to-[#0a0a0a]` (match popover bg) | `bg-white dark:bg-gradient-to-br dark:from-[#1a0f0f] dark:to-[#0a0a0a]` |
| ~510 | `text-white/60` (secondary text) | `text-slate-500 dark:text-white/60` |
| ~547 | `text-white/40` (tertiary text) | `text-slate-400 dark:text-white/40` |
| Various | `text-white` (primary text throughout) | `text-slate-900 dark:text-white` |
| Various | `border-[rgba(224,37,32,0.5)]` (red accent border) | Keep as-is (works in both themes) |

**Also pending:** Remove round outline circles on team logos (lines ~521, ~555) — change from `"w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0"` to `"w-16 h-16 overflow-hidden flex items-center justify-center shrink-0"`. This was already done but not yet committed.

### 2. Navbar.tsx — PARTIAL (2 issues)

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~157 | `bg-[rgba(26,15,15,0.95)]` (dropdown content) | `bg-white dark:bg-[rgba(26,15,15,0.95)]` |
| ~208 | `bg-[#0a1810]` (mobile sheet) | `bg-white dark:bg-[#0a1810]` |

Also audit all `text-white` in nav items and add `text-slate-900 dark:text-white` variants.

### 3. FilterPanel.tsx — BROKEN (4 issues)

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~37 | `bg-[rgba(10,24,16,0.2)]` (panel bg) | `bg-slate-50 dark:bg-[rgba(10,24,16,0.2)]` |
| ~52 | `SelectContent bg-[#1a0f0f]` (sport select) | `bg-white dark:bg-[#1a0f0f]` |
| ~71 | `SelectContent bg-[#1a0f0f]` (team select) | `bg-white dark:bg-[#1a0f0f]` |
| ~88 | `SelectContent bg-[#1a0f0f]` (status select) | `bg-white dark:bg-[#1a0f0f]` |

Also check `SelectItem` hover/focus states and `text-white` labels.

### 4. CalendarGrid.tsx — PARTIAL (1 issue)

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~155 | `border-white/5` (empty day border) | `border-slate-200 dark:border-white/5` |

The red gradient header (`bg-gradient-to-br from-[#E02520] to-[#b91c1c]` with `text-white`) is intentional branding — keep as-is.

### 5. OnboardingTour.tsx — BROKEN (1 issue)

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~24 | `bg-[#1a0f0f]` (tour card) | `bg-white dark:bg-[#1a0f0f]` |

Also audit text colors in the tour steps.

### 6. ErrorBoundary.tsx — BROKEN (2 issues)

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~28 | `bg-[#0a1810] text-white` (error page) | `bg-white text-slate-900 dark:bg-[#0a1810] dark:text-white` |
| ~29 | `bg-[rgba(10,24,16,0.6)]` (error card) | `bg-slate-50 dark:bg-[rgba(10,24,16,0.6)]` |

### 7. ui/tabs.tsx — BROKEN (2 issues)

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~27 | `border-white/10 dark:border-white/10 light:border-slate-200` | `border-slate-200 dark:border-white/10` (remove invalid `light:` prefix) |
| ~43 | `text-white/60 data-[state=active]:text-white` | `text-slate-600 dark:text-white/60 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white` |

### 8. AppBackground.tsx — REVIEW NEEDED

The dark overlay gradient works for dark mode but may need increased opacity for light mode to maintain text readability over the background image.

| Line(s) | Current | Fix |
|---------|---------|-----|
| ~15 | `from-[rgba(10,24,16,0.3)] via-[rgba(26,15,15,0.2)] to-[rgba(10,24,16,0.3)]` | Consider `opacity-30 dark:opacity-30` or increase light mode overlay opacity. Needs visual testing. |

### 9. index.css — ADD SEMANTIC TOKENS

Current CSS variables in `:root` / `.dark`:
```css
:root { --background: #f8fafc; --foreground: #020817; }
.dark { --background: #0a1810; --foreground: #f8fafc; }
```

**Add missing semantic tokens:**
```css
:root {
  --card: #ffffff;
  --card-foreground: #020817;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #e02520;
  --popover: #ffffff;
  --popover-foreground: #020817;
}
.dark {
  --card: rgba(26, 15, 15, 0.95);
  --card-foreground: #f8fafc;
  --muted: rgba(10, 24, 16, 0.6);
  --muted-foreground: rgba(255, 255, 255, 0.6);
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.1);
  --ring: #e02520;
  --popover: #1a0f0f;
  --popover-foreground: #f8fafc;
}
```

These tokens can then be referenced via Tailwind (`bg-card`, `text-card-foreground`, `border-border`, etc.) to reduce hardcoded values.

## Components Already Properly Themed (No Changes Needed)

| Component | Pattern Used |
|-----------|-------------|
| StatsPage.tsx | `bg-slate-200 dark:bg-[#1a1a1a]` |
| LeagueTable.tsx | `bg-slate-100 dark:bg-slate-800/50` |
| NextMatch.tsx | `bg-white dark:bg-slate-800` |
| TopScorers.tsx | `bg-slate-300 dark:bg-slate-700` |
| HeadToHead.tsx | Proper `dark:` variants |
| RecentForm.tsx | Proper `dark:` variants |
| SeasonSummary.tsx | `bg-white/5 dark:bg-[#1a1a1a]/50` |
| VolleyballSeasonSummary.tsx | Proper `dark:` variants |
| PerformanceSplit.tsx | `bg-slate-200 dark:bg-slate-800` |
| SetBreakdown.tsx | Proper `dark:` variants |
| EventCard.tsx | Colored backgrounds (theme-agnostic) |
| MonthNavigation.tsx | Proper theme colors |
| CountdownTimer.tsx | Semantic colors |
| MatchReport.tsx | Semantic colors |
| SettingsPage.tsx | Properly themed |

## Suggested Implementation Order

1. **index.css** — Add semantic CSS tokens first (enables cleaner fixes downstream)
2. **ui/tabs.tsx** — Fix invalid `light:` syntax (affects all tab usage)
3. **EventPopover.tsx** — Largest change, most user-visible component
4. **Navbar.tsx** — Always visible navigation
5. **FilterPanel.tsx** — Dropdown backgrounds
6. **CalendarGrid.tsx** — Minor border fix
7. **OnboardingTour.tsx** — First-run experience
8. **ErrorBoundary.tsx** — Error fallback
9. **AppBackground.tsx** — Visual testing for light mode overlay

## Acceptance Criteria

- [ ] All 7 broken/partial files are fixed with proper `dark:` variants
- [ ] No `light:` pseudo-variant syntax (invalid in Tailwind)
- [ ] Semantic CSS tokens added to index.css for `--card`, `--popover`, `--border`, `--muted`
- [ ] Light mode: all text readable (4.5:1 contrast minimum)
- [ ] Light mode: all backgrounds visible (no invisible `bg-white/5` on white)
- [ ] Light mode: all borders visible (no invisible `border-white/10` on white)
- [ ] Dark mode: no regressions (everything looks the same as before)
- [ ] All existing tests pass
- [ ] Build passes (`npm run lint && npm test && npm run build`)
- [ ] Visual verification in both themes via browser

## Testing Strategy

1. Toggle theme to light mode and navigate every page/component
2. Open event popovers in light mode — verify backgrounds and text
3. Open filter panel in light mode — verify select dropdowns
4. Check navbar dropdown and mobile sheet in light mode
5. Trigger error boundary in light mode
6. Verify onboarding tour in light mode
7. Run full test suite to confirm no regressions
8. Screenshot comparison: dark vs light for key pages
