# TASK-08: Align All Stats Tabs to Stitch Design System

**Status:** done
**Depends on:** TASK-06
**Estimated scope:** Medium

## Objective

Update all stat components across all 3 tabs (Football, Men's Volleyball, Women's Volleyball) to match the Stitch HTML design system in `design-mockups/stitch/stats.html`. The current implementation has the correct data/logic but divergent styling.

## Design Reference

**Single source of truth:** `design-mockups/stitch/stats.html`

The same visual design system applies to ALL three tabs. Only the data differs per sport.

### Stitch Design System — Key CSS Patterns

```
Primary color:     #e2241d
Font:              Lexend (font-display)
Dark card bg:      bg-white/5 dark:bg-[#1a1a1a]/50
Card border:       border border-slate-200 dark:border-slate-800
Backdrop:          backdrop-blur-sm (on cards with accent borders)
Section heading:   text-lg font-bold (h3)
Label text:        text-xs text-slate-500 dark:text-slate-400 font-medium
Hero number:       text-3xl font-bold
Stat number:       text-lg font-bold
Section spacing:   space-y-6
```

## Changes Required

### 1. Tab Style — pill chips (all tabs)

**File:** `src/pages/StatsPage.tsx`

**Current:** Underline tabs (`border-b-2`)
**Stitch:**
```html
<a class="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide">MEN'S FOOTBALL</a>
<a class="bg-slate-200 dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 px-4 py-2 rounded-full text-xs font-bold tracking-wide">MEN'S VOLLEY</a>
```

- Active: `bg-primary text-white rounded-full`
- Inactive: `bg-slate-200 dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 rounded-full`
- Container: `flex gap-2 min-w-max` (no border-b)

### 2. Season Summary hero cards (all tabs)

**Files:** `src/components/stats/SeasonSummary.tsx`, `src/components/stats/VolleyballSeasonSummary.tsx`

**Current:** Red gradient bg, `text-4xl font-black text-[#E02520]`
**Stitch:**
```html
<div class="col-span-1 rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
  <span class="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Points</span>
  <span class="text-3xl font-bold text-primary">47</span>
  <!-- sparkline SVG -->
</div>
```

Changes:
- Card bg: red gradient → `bg-white/5 dark:bg-[#1a1a1a]/50`
- Card border: `border-[rgba(224,37,32,0.2)]` → `border border-slate-200 dark:border-slate-800`
- Number: `text-4xl font-black` → `text-3xl font-bold text-primary`
- Add optional sparkline SVG under hero numbers (decorative)

### 3. Season Summary mini grid (all tabs)

**Current:** Centered text in red-tinted cards
**Stitch:**
```html
<div class="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex items-center justify-between">
  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Matches</span>
  <span class="text-lg font-bold">26</span>
</div>
```

Changes:
- Layout: `text-center` → `flex items-center justify-between`
- Card bg/border: same as hero cards
- Wins value: `text-green-600 dark:text-green-400`
- Losses value: `text-primary`

### 4. Performance Split — 2-col grid cards (all tabs)

**File:** `src/components/stats/PerformanceSplit.tsx`

**Current:** Stacked list rows with emoji icons and W/D/L inline
**Stitch:**
```html
<div class="grid grid-cols-2 gap-3">
  <div class="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
    <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
      <span class="material-symbols-outlined text-[20px]">home</span>
    </div>
    <div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Home</p>
      <p class="text-lg font-bold">13 <span class="text-xs font-normal text-slate-500">matches</span></p>
    </div>
  </div>
  <!-- Away card same pattern -->
</div>
```

Changes:
- Layout: `space-y-3` stacked list → `grid grid-cols-2 gap-3`
- Icons: emoji → icon in circular bg (`w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800`)
- Content: show match count prominently, W/D/L can remain as secondary info below
- Note: We can keep the W/D/L breakdown since it adds useful info — just restructure the layout to match the 2-col grid

### 5. Top Scorers — avatar + neutral cards (all tabs)

**File:** `src/components/stats/TopScorers.tsx`

**Current:** Red-tinted rank circles, no avatar, hover bg only
**Stitch:**
```html
<div class="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-primary/20 p-3 flex items-center justify-between backdrop-blur-sm">
  <div class="flex items-center gap-3">
    <span class="text-slate-400 font-medium text-sm w-4">1</span>
    <div class="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
      <span class="material-symbols-outlined text-slate-500 text-[18px]">person</span>
    </div>
    <span class="font-medium">Christofi</span>
  </div>
  <span class="font-bold text-primary">12</span>
</div>
```

Changes:
- Rank: red circle badge → plain `text-slate-400 font-medium text-sm` number
- Avatar: add `w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700` with person icon (use emoji 👤 or SVG since we don't have Material Symbols)
- #1 scorer card: `border border-primary/20` accent
- Other cards: `border border-slate-200 dark:border-slate-800`
- Score: keep `text-primary` for #1, `text-slate-900 dark:text-white` for others

### 6. League Table — neutral header + left accent (football only)

**File:** `src/components/stats/LeagueTable.tsx`

**Current:** Red-tinted gradient header, full gradient row highlight
**Stitch:**
```html
<thead class="bg-slate-100 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400">
<!-- NS row: -->
<tr class="bg-primary/10 border-l-2 border-l-primary">
```

Changes:
- Header: red gradient → `bg-slate-100 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400`
- NS row: full gradient → `bg-primary/10 border-l-2 border-l-primary`
- "Full Table" link: add chevron icon

### 7. Next Match card — richer layout (football, reused by volleyball if data available)

**File:** `src/components/stats/NextMatch.tsx`

**Current:** Simple vertical stack
**Stitch:** Side-by-side teams with logos, time in center, stadium at bottom, countdown badge, league name

This is the biggest single change. Key elements:
- Side-by-side flex layout for two teams
- Countdown badge: `bg-primary/20 text-primary px-2 py-1 rounded text-[10px] font-bold`
- League name top-left
- Stadium with pin icon at bottom
- Team logo placeholders (circular, can use team initial or crest if available)

### 8. Card/section shared styling (all components)

Replace the `stat-section` class pattern across all components:
- Section bg: use `space-y-6` between sections instead of `stat-section` margin
- Card bg: `bg-white/5 dark:bg-[#1a1a1a]/50`
- Card border: `border border-slate-200 dark:border-slate-800`
- Add `shadow-sm` to cards
- Section title: `text-lg font-bold` (not custom `stat-section-title`)

### 9. Set Breakdown (volleyball tabs only)

**File:** `src/components/stats/SetBreakdown.tsx`

Apply the same card styling system — neutral borders, slate bg. The current red-tinted styling should be replaced with the Stitch design system.

### 10. Recent Form (all tabs)

**File:** `src/components/stats/RecentForm.tsx`

Mostly matches already. Minor tweaks:
- Section title: use `text-lg font-bold` + right-aligned "Last 5 Matches" span
- Badge sizing: `w-10 h-10` (Stitch) vs `w-11 h-11` (current) — minor

## Acceptance Criteria

- [ ] All 3 tabs use pill-style tab chips (rounded-full)
- [ ] All cards use Stitch card system: `bg-white/5 dark:bg-[#1a1a1a]/50 border-slate-200 dark:border-slate-800`
- [ ] Season Summary hero cards match Stitch (with optional sparklines)
- [ ] Season Summary mini grid uses `flex justify-between` layout
- [ ] Performance Split uses 2-col grid cards with icon circles
- [ ] Top Scorers have avatar circles and neutral styling (#1 has primary accent)
- [ ] League Table has neutral header and left-accent row highlight
- [ ] Next Match card has richer side-by-side layout
- [ ] Set Breakdown follows the same card styling system
- [ ] Recent Form badge size matches Stitch
- [ ] All changes apply consistently across Football, Men's VB, and Women's VB tabs
- [ ] Dark and light theme both work
- [ ] All existing tests pass (686+)
- [ ] Build passes
- [ ] Visual verification via Playwright MCP confirms match with Stitch HTML
