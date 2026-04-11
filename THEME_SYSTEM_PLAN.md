# Theme System — Test-Driven Implementation Plan

> Multi-theme support: Default + Brutalism + Cinema + Neon HUD
> Each theme works independently with both dark and light modes

---

## PR 1: Theme Selector + CSS Token System

### Phase 1A: Core Hook — `useVisualTheme`

**Test file**: `app/src/__tests__/hooks/useVisualTheme.test.ts`

```
Test 1: defaults to 'default' when no localStorage value
Test 2: reads saved theme from localStorage
Test 3: setTheme persists to localStorage
Test 4: setTheme updates the return value
Test 5: applies theme class to document.documentElement
Test 6: removes previous theme class when switching
Test 7: coexists with dark/light class (doesn't remove 'dark' or 'light')
Test 8: returns list of available themes
Test 9: invalid localStorage value falls back to 'default'
```

**Implementation**: `app/src/hooks/useVisualTheme.ts`

```typescript
type VisualTheme = 'default' | 'brutalism' | 'cinema' | 'neon';

export function useVisualTheme(): {
  theme: VisualTheme;
  setTheme: (theme: VisualTheme) => void;
  themes: readonly VisualTheme[];
};
```

**Behaviour**:
- Reads/writes `visual_theme` key in localStorage
- Applies `.theme-<name>` class to `<html>` (e.g. `.theme-brutalism`)
- The `default` theme applies no extra class (current styles are the default)
- Does NOT interfere with `dark`/`light` classes managed by `useTheme`

---

### Phase 1B: CSS Token Definitions

**Test file**: `app/src/__tests__/theme/visual-themes.test.tsx`

```
Test 1: default theme renders with Barlow font family
Test 2: brutalism theme renders with Space Grotesk font family
Test 3: cinema theme renders with Inter font family
Test 4: neon theme renders with Orbitron/JetBrains Mono font family
Test 5: brutalism theme sets border-radius to 0
Test 6: cinema theme sets border-radius to 16px
Test 7: each theme defines --accent color
Test 8: theme tokens change between dark and light mode
Test 9: brutalism dark uses #09090B background
Test 10: cinema dark uses gradient-ready deep background
Test 11: neon dark uses #0A0A0F background
Test 12: neon theme has --neon-cyan custom property
```

**Implementation**: `app/src/index.css` — add theme token blocks

```css
/* Theme: Brutalism */
.theme-brutalism {
  --font-body: 'Space Grotesk', sans-serif;
  --font-heading: 'Space Grotesk', sans-serif;
  --radius: 0px;
  --border-width: 2px;
  /* dark palette */
  --background: #09090B;
  --foreground: #FAFAFA;
  --border: #3F3F46;
  /* ... */
}
.theme-brutalism.light {
  --background: #F8FAFC;
  --foreground: #1E293B;
  --border: #CBD5E1;
  /* ... */
}

/* Theme: Cinema */
.theme-cinema { /* ... */ }
.theme-cinema.light { /* ... */ }

/* Theme: Neon */
.theme-neon { /* ... */ }
.theme-neon.light { /* ... */ }
```

**Font loading**: `app/index.html` — load all 4 font families
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?
  family=Barlow:wght@400;500;600;700&
  family=Barlow+Condensed:wght@600;700;800;900&
  family=Space+Grotesk:wght@400;600;700&
  family=Inter:wght@400;500;600;700;800&
  family=Orbitron:wght@500;700;900&
  family=JetBrains+Mono:wght@400;600;700&
  display=swap">
```

**Body font application** in `@layer base`:
```css
body {
  font-family: var(--font-body, 'Barlow', sans-serif);
}
.font-condensed {
  font-family: var(--font-heading, 'Barlow Condensed', sans-serif);
}
```

---

### Phase 1C: Settings UI — Theme Selector

**Test file**: `app/src/__tests__/pages/SettingsPage-theme.test.tsx`

```
Test 1: renders Theme section with dropdown/selector
Test 2: displays current theme name
Test 3: shows all 4 theme options
Test 4: selecting a theme calls setTheme
Test 5: theme names are translated (i18n keys exist)
Test 6: selector is keyboard accessible (role, aria)
```

**Implementation**: Add to `app/src/pages/SettingsPage.tsx`

- New `SettingsSection` block titled "Theme" between Display and Sports Filter
- Uses a `<Select>` dropdown (existing Radix component) with 4 options
- Each option shows theme name + brief description
- Calls `useVisualTheme().setTheme()` on change

**i18n keys** (en.json + el.json):
```json
{
  "settings": {
    "theme": "Visual Theme",
    "themeDefault": "Default",
    "themeDefaultDesc": "Red Rebels classic",
    "themeBrutalism": "Brutalism",
    "themeBrutalismDesc": "Raw & aggressive",
    "themeCinema": "Cinema",
    "themeCinemaDesc": "Premium dark",
    "themeNeon": "Neon HUD",
    "themeNeonDesc": "Sci-fi interface"
  }
}
```

---

### Phase 1D: Theme-Specific Decorations (CSS-only)

**Test file**: `app/src/__tests__/theme/theme-decorations.test.tsx`

```
Test 1: brutalism theme adds scanline-free, no border-radius
Test 2: cinema theme shows ambient blobs only in dark mode
Test 3: neon theme adds scanline pseudo-element
Test 4: neon theme scanlines hidden in light mode
Test 5: cinema ambient blobs hidden in default theme
Test 6: decorations respect prefers-reduced-motion
```

**Implementation**:

Brutalism decorations (CSS only):
- `border-radius: 0` on all cards/buttons via `--radius: 0px`
- Heavier `--border-width: 2px` borders

Cinema decorations:
- Ambient blobs already exist (from earlier work) — conditionally show via `.theme-cinema .ambient-blob` or default
- Glassmorphism on header/nav already exists — extend to cinema theme

Neon decorations (CSS only):
```css
.theme-neon::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px,
    rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 4px);
  pointer-events: none;
  z-index: 100;
}
.theme-neon.light::after { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .theme-neon::after { display: none; }
}
```

---

## PR 2: View Switcher (Grid / List / Cards)

### Phase 2A: View State Hook

**Test file**: `app/src/__tests__/hooks/useCalendarView.test.ts`

```
Test 1: defaults to 'grid'
Test 2: reads saved view from localStorage
Test 3: setView persists to localStorage
Test 4: returns current view
Test 5: invalid localStorage value falls back to 'grid'
```

**Implementation**: `app/src/hooks/useCalendarView.ts`

```typescript
type CalendarView = 'grid' | 'list' | 'cards';
export function useCalendarView(): {
  view: CalendarView;
  setView: (view: CalendarView) => void;
};
```

---

### Phase 2B: View Switcher Component

**Test file**: `app/src/__tests__/components/ViewSwitcher.test.tsx`

```
Test 1: renders 3 buttons (Grid, List, Cards)
Test 2: active view button is visually highlighted (aria-pressed)
Test 3: clicking a button calls onViewChange with correct value
Test 4: buttons are keyboard accessible
Test 5: labels are translated
```

**Implementation**: `app/src/components/calendar/ViewSwitcher.tsx`

```typescript
interface ViewSwitcherProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}
```

---

### Phase 2C: List View Component

**Test file**: `app/src/__tests__/components/CalendarListView.test.tsx`

```
Test 1: renders played matches with scores
Test 2: renders upcoming matches with times
Test 3: separates played and upcoming into sections
Test 4: shows correct sport labels
Test 5: shows home/away indicator
Test 6: clicking an event calls onEventClick
Test 7: renders empty state when no events
Test 8: scores use tabular-nums
Test 9: items are keyboard accessible (role, tabIndex)
Test 10: played items show win/draw/loss color
```

**Implementation**: `app/src/components/calendar/CalendarListView.tsx`

**Data source**: Uses the same `monthData` from `useCalendar` hook — extracts all events for the month, sorted by day.

---

### Phase 2D: Cards View Component

**Test file**: `app/src/__tests__/components/CalendarCardsView.test.tsx`

```
Test 1: renders each event as a large card
Test 2: played cards show score prominently
Test 3: upcoming cards show time prominently
Test 4: cards show both team names
Test 5: cards show sport tag (football/volleyball)
Test 6: cards show venue/location info
Test 7: clicking a card calls onEventClick
Test 8: win/loss/draw result badge shown on played cards
Test 9: cards are keyboard accessible
Test 10: renders empty state when no events
Test 11: cup matches show competition badge
```

**Implementation**: `app/src/components/calendar/CalendarCardsView.tsx`

---

### Phase 2E: CalendarPage Integration

**Test file**: `app/src/__tests__/pages/CalendarPage-views.test.tsx`

```
Test 1: renders ViewSwitcher below month nav
Test 2: grid view shows MobileCalendarGrid (default)
Test 3: switching to list shows CalendarListView
Test 4: switching to cards shows CalendarCardsView
Test 5: selected view persists on remount
Test 6: clicking event in list view opens EventPopover
Test 7: clicking event in cards view opens EventPopover
Test 8: month navigation works in all views
Test 9: filter panel works with list and cards views
```

**Implementation**: Update `app/src/pages/CalendarPage.tsx`

```tsx
const { view, setView } = useCalendarView();

<ViewSwitcher view={view} onViewChange={setView} />

{view === 'grid' && <MobileCalendarGrid ... />}
{view === 'list' && <CalendarListView ... />}
{view === 'cards' && <CalendarCardsView ... />}
```

---

## PR 3: Theme-Specific Component Variants

### Phase 3A: Brutalism Marquee

**Test file**: `app/src/__tests__/components/Marquee.test.tsx`

```
Test 1: renders scrolling text content
Test 2: only visible when brutalism theme is active
Test 3: hidden in other themes
Test 4: respects prefers-reduced-motion (pauses animation)
Test 5: contains team name and sport labels
Test 6: has aria-hidden="true" (decorative)
```

**Implementation**: `app/src/components/layout/Marquee.tsx`

Rendered in `App.tsx`, conditionally shown via CSS:
```css
.marquee { display: none; }
.theme-brutalism .marquee { display: block; }
```

---

### Phase 3B: Neon HUD Frame

**Test file**: `app/src/__tests__/components/HudFrame.test.tsx`

```
Test 1: renders corner brackets
Test 2: only visible when neon theme is active
Test 3: wraps children correctly
Test 4: has aria-hidden="true" on decorative brackets
```

**Implementation**: `app/src/components/layout/HudFrame.tsx`

A wrapper component that adds the 4 corner brackets. Used conditionally around the calendar section.

---

### Phase 3C: Theme-Aware Card Styling

**Test file**: `app/src/__tests__/components/calendar/EventCard-themes.test.tsx`

```
Test 1: default theme uses rounded corners
Test 2: brutalism theme uses 0 border-radius
Test 3: cinema theme uses 16px border-radius with top-edge highlight
Test 4: neon theme uses colored left-border per sport
Test 5: card hover states match theme
```

**Implementation**: Primarily CSS via token inheritance. Cards already use `rounded-lg` which maps to `--radius`. Each theme overrides `--radius` to change the shape globally.

For neon's sport-colored left border, add a CSS rule:
```css
.theme-neon [data-sport="football"]::before { /* red left border */ }
.theme-neon [data-sport="volleyball"]::before { /* magenta left border */ }
```

---

## Test Summary

| PR | Test Files | Tests | Effort |
|----|-----------|-------|--------|
| PR 1 | 4 files | ~35 tests | ~6 hours |
| PR 2 | 5 files | ~40 tests | ~8 hours |
| PR 3 | 3 files | ~15 tests | ~4 hours |
| **Total** | **12 files** | **~90 tests** | **~18 hours** |

## Execution Order

```
PR 1 (Theme tokens + selector)
  1A. Write useVisualTheme tests → implement hook
  2B. Write CSS token tests → implement theme CSS blocks
  1C. Write Settings UI tests → implement dropdown
  1D. Write decoration tests → implement CSS decorations
  → Verify: npm run lint && npm test && npm run build
  → Visual test with Playwright MCP
  → Create PR

PR 2 (View switcher)
  2A. Write useCalendarView tests → implement hook
  2B. Write ViewSwitcher tests → implement component
  2C. Write CalendarListView tests → implement component
  2D. Write CalendarCardsView tests → implement component
  2E. Write CalendarPage integration tests → wire up
  → Verify build + visual test
  → Create PR

PR 3 (Theme-specific components)
  3A. Write Marquee tests → implement
  3B. Write HudFrame tests → implement
  3C. Write theme-aware card tests → implement CSS
  → Verify build + visual test
  → Create PR
```

## Dependencies

- PR 1 has no dependencies (pure additive)
- PR 2 has no dependency on PR 1 (views work with any theme)
- PR 3 depends on PR 1 (theme classes must exist)
- PR 2 and PR 3 can be developed in parallel after PR 1

## Files Changed Per PR

**PR 1** (~12 files):
- `app/src/hooks/useVisualTheme.ts` (new)
- `app/src/__tests__/hooks/useVisualTheme.test.ts` (new)
- `app/src/__tests__/theme/visual-themes.test.tsx` (new)
- `app/src/__tests__/theme/theme-decorations.test.tsx` (new)
- `app/src/__tests__/pages/SettingsPage-theme.test.tsx` (new)
- `app/src/index.css` (add theme token blocks)
- `app/index.html` (load additional fonts)
- `app/src/pages/SettingsPage.tsx` (add theme dropdown)
- `app/src/components/layout/AppBackground.tsx` (conditional blobs)
- `app/src/i18n/en.json` (theme labels)
- `app/src/i18n/el.json` (theme labels)

**PR 2** (~10 files):
- `app/src/hooks/useCalendarView.ts` (new)
- `app/src/__tests__/hooks/useCalendarView.test.ts` (new)
- `app/src/components/calendar/ViewSwitcher.tsx` (new)
- `app/src/__tests__/components/ViewSwitcher.test.tsx` (new)
- `app/src/components/calendar/CalendarListView.tsx` (new)
- `app/src/__tests__/components/CalendarListView.test.tsx` (new)
- `app/src/components/calendar/CalendarCardsView.tsx` (new)
- `app/src/__tests__/components/CalendarCardsView.test.tsx` (new)
- `app/src/pages/CalendarPage.tsx` (integrate views)
- `app/src/__tests__/pages/CalendarPage-views.test.tsx` (new)

**PR 3** (~6 files):
- `app/src/components/layout/Marquee.tsx` (new)
- `app/src/__tests__/components/Marquee.test.tsx` (new)
- `app/src/components/layout/HudFrame.tsx` (new)
- `app/src/__tests__/components/HudFrame.test.tsx` (new)
- `app/src/__tests__/components/calendar/EventCard-themes.test.tsx` (new)
- `app/src/index.css` (theme-specific decorative CSS)
