# Stitch Mockup vs Implementation — Comparison & Root Cause Analysis

## Design Reference

- **Stitch mockup**: `design-mockups/stitch/stats.html` + `stats-screenshot.png`
- **Implementation**: `src/pages/StatsPage.tsx` + `src/components/stats/*.tsx`

---

## All Differences

### 1. Tab Style — PILL CHIPS vs UNDERLINE

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Shape | `rounded-full` pill chips | Flat buttons with `border-b-2` underline |
| Active state | `bg-primary text-white` solid red pill | `text-foreground border-[#E02520]` underline |
| Inactive state | `bg-[#1a1a1a] text-slate-400` dark pill | `border-transparent text-muted-foreground` |
| Layout | `flex gap-2` with horizontal scroll | `flex overflow-x-auto` |

**Task file explicitly said:** "All three mockups show pill-style tabs" (TASK-06:14)

### 2. Next Match Card — RICH CARD vs SIMPLE STACK

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Layout | Side-by-side teams with logos, time in center | Vertical stack: home/away label, teams, date |
| Team logos | Circular image placeholders (`w-14 h-14 rounded-full`) | None |
| Countdown badge | `bg-primary/20 text-primary` pill: "In 3 Days" | None |
| League name | "CYPRUS FIRST DIVISION" top-left | None |
| Stadium | Pin icon + "AMMOCHOSTOS STADIUM" at bottom | None |
| Background | `bg-gradient-to-br from-primary/10` overlay | Solid gradient card |

### 3. Season Summary — SPARKLINES MISSING

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Hero cards | Points + Goals with SVG sparkline underneath | Points + Goals, no sparkline |
| Sparkline | Inline SVG base64-encoded polyline chart | Not implemented |
| Mini grid | `flex justify-between` layout per card | `text-center` layout per card |
| Card borders | `border border-slate-200 dark:border-slate-800` | `border border-[rgba(224,37,32,0.15)]` (red tint) |

### 4. League Table — HIGHLIGHTED ROW STYLE

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| NS row highlight | `bg-primary/10 border-l-2 border-l-primary` (left accent bar) | `bg-gradient-to-r from-[rgba(224,37,32,0.2)]` (full gradient) |
| NS row marker | Red circle dot + bold red text | Qualification color dot + red text |
| "Full Table" link | `text-primary` with chevron_right icon | `text-[#E02520]` text button |
| Header style | `bg-slate-100 dark:bg-slate-800/50` neutral | Red-tinted gradient header |
| Column headers | "CLUB", "GD", "Pts" (short) | "Team", "Difference", "Points" (full i18n) |

### 5. Performance Split — CARD GRID vs LIST ROWS

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Layout | `grid grid-cols-2 gap-3` — two equal cards | Stacked list rows (`space-y-3`) |
| Icon | Material Symbols `home`/`flight` in circular bg | Emoji 🏠/✈️ inline |
| Content | Icon + label + "13 matches" text only | Icon + label + matches + W/D/L breakdown |
| W/D/L display | NOT shown in cards | Shown inline (green W, yellow D, red L) |

**Note:** Our implementation shows MORE data (W/D/L) but the layout doesn't match the mockup.

### 6. Top Scorers — AVATAR CIRCLES MISSING

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Avatar | `w-8 h-8 rounded-full bg-slate-300` with person icon | None |
| Rank display | Plain `text-slate-400 font-medium text-sm w-4` number | Red-tinted circular badge |
| #1 scorer | `border border-primary/20` accent border | Same style as others |
| Card bg | `bg-white/5 dark:bg-[#1a1a1a]/50 backdrop-blur-sm` | `hover:bg-white/[0.03]` (hover only) |

### 7. Card Background Pattern

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Card bg | `bg-white/5 dark:bg-[#1a1a1a]/50` consistently | `bg-white/[0.03]` or gradient-based |
| Borders | `border border-slate-200 dark:border-slate-800` | `border border-[rgba(224,37,32,0.15)]` (red tint) |
| Blur | `backdrop-blur-sm` / `backdrop-blur-lg` on cards | Not used on stat cards |

### 8. Typography & Spacing

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Font | Lexend (`font-display`) | System font (no custom font) |
| Section headings | `text-lg font-bold` (h3) | Custom `stat-section-title` class |
| Section spacing | `space-y-6` between sections | Individual margins |

### 9. Navigation — BOTTOM BAR vs TOP NAVBAR

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Position | Fixed bottom tab bar | Top horizontal navbar |
| Items | Home / Fixtures / Stats / Profile | Calendar / Statistics / Settings |
| Active indicator | Red top bar + filled icon | Active link styling |

**This is an intentional architectural choice — not a bug.**

### 10. Header

| Aspect | Stitch Mockup | Implementation |
|--------|---------------|----------------|
| Style | Back arrow + centered "Red Rebels Stats" title | Full navbar with logo, links, tools |
| Sticky | `sticky top-0` with blur | Already handled by Navbar component |

**Also an intentional architectural choice.**

---

## Root Cause Analysis: Why Did `/tdd-start-task` Produce These Differences?

### The Core Problem

**The `/tdd-start-task` skill has NO visual verification step.** Its workflow is:

1. Pre-Phase: Read task file → analyze codebase
2. Phase 1: Write tests from acceptance criteria (text-based)
3. Phase 2: Implement until tests pass
4. Phase 3: Quality checks (lint, types, build)
5. Phase 4: Update tracking, commit

**There is no phase that says "compare against the design mockup."** The entire workflow is driven by acceptance criteria text and test assertions — it never opens the mockup image, never launches a browser, never takes a screenshot.

### Specific Gaps in the Skill

#### Gap 1: No "Read the design mockup" step in Pre-Phase

The Pre-Phase says to read the task file and analyze the codebase, but does NOT say:
- Read/view the design mockup images referenced in the task
- Extract specific CSS values, spacing, colors from the mockup
- Note the exact visual patterns (pill tabs, card styles, layout grids)

The task files (TASK-04, TASK-05, TASK-06) all reference mockup files and describe the design in TEXT, but text descriptions are lossy — they describe WHAT sections exist but not HOW they look pixel-by-pixel.

#### Gap 2: Tests only verify STRUCTURE, not STYLE

The TDD tests check:
- "renders section title" ✅
- "displays win rate as hero stat" ✅
- "does NOT display draws" ✅

But they CANNOT check:
- "tabs use pill/chip style with rounded-full" ❌
- "cards have border-slate-200 not red-tinted borders" ❌
- "performance split uses 2-col grid not stacked list" ❌
- "top scorers have avatar circles" ❌

**React Testing Library + jsdom cannot verify visual styling.** The tests verify DOM presence and text content, not CSS classes or layout.

#### Gap 3: No visual comparison gate before completion

Phase 3 runs lint/types/build but has NO step like:
- "Open the app in a browser and compare against the mockup"
- "Take a screenshot and diff against the reference image"
- "Use Playwright MCP to verify CSS classes match the mockup"

The skill considers the task "done" when tests pass and the build is green — even if the UI looks completely different from the mockup.

#### Gap 4: Acceptance criteria are too high-level for visual fidelity

TASK-04's acceptance criteria say:
- "Football tab matches `design-mockups/final-football.png` layout" (very vague)
- "Hero stats (Total Points, Total Goals) are prominently displayed" (what is "prominent"?)
- "Form badges are circular and color-coded" (doesn't specify exact classes)

These criteria are not testable with unit tests. They need visual regression testing or manual inspection. But the skill has no mechanism for that.

### What the task files got RIGHT

The task files (TASK-04, TASK-05, TASK-06) actually described the design well:
- TASK-06 explicitly said "pill-style tabs" with example CSS classes
- TASK-04 described "sparklines", "compact 3-row table", specific section order
- TASK-05 described "horizontal bars" for set breakdown

But these descriptions were never enforced because:
1. The tests couldn't verify visual styling
2. The implementation diverged toward "what makes tests pass" rather than "what matches the mockup"
3. No visual checkpoint caught the drift

---

## Recommended Skill Updates

### For `/tdd-start-task`

Add a **Phase 2.5: Visual Verification** between Implementation and Quality:

```
### Phase 2.5: Visual Verification (if task has design mockups)

If the task file references design mockups:

1. Read/view ALL referenced mockup images
2. If a Stitch project exists for this design, fetch the HTML code
3. Start the dev server if not running
4. Use Playwright MCP to navigate to the affected page(s)
5. Take screenshots at mobile (390x844) and desktop (1280x720)
6. Compare against mockup, checking:
   - Layout structure (grid vs stack, column counts)
   - Component styling (border radius, colors, backgrounds)
   - Typography (font family, sizes, weights)
   - Spacing and padding
   - Interactive element styles (tabs, buttons, links)
7. If Stitch HTML is available, compare CSS classes directly
8. Fix any visual discrepancies before proceeding to Phase 3
9. Re-run tests to confirm fixes don't break anything
```

### For task file format

Add a structured "Visual Spec" section to task files:

```markdown
## Visual Spec (machine-readable)

Stitch Project: {project-id}
Stitch Screens: {screen-ids}

### Key CSS Patterns
- Tabs: `rounded-full px-4 py-2 text-xs font-bold`
- Active tab: `bg-[#E02520] text-white`
- Card bg: `bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800`
- Section heading: `text-lg font-bold`
```

This gives the agent concrete, verifiable CSS values instead of prose descriptions.
