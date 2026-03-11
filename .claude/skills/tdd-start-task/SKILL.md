---
name: tdd-start-task
description: |
  Implement a task using strict test-driven development. Use when:
  - User says "tdd start task", "tdd implement", or "implement TASK-ID with TDD"
  - User wants to implement a task with tests written first
  - User wants a phased Red-Green-Refactor approach to task implementation
---

# TDD Start Task Skill

Implements task [TASK-ID] using strict test-driven development with phased gates. Each phase must be fully green before proceeding to the next.

## Arguments

- `TASK-ID` (required): The task identifier (e.g., `SEO-005`, `DES-021`, `SUBPAGE-017`)

## When to Use

- When implementing any task that benefits from test-first methodology
- When the user explicitly wants TDD-driven implementation
- For tasks with clear acceptance criteria that map to test cases

## Workflow

### Pre-Phase: Task Analysis

1. **Parse task ID** and find the epic (use same prefix→epic mapping as `/start-task`)
2. **Read the task file:** `.tasks/epics/{epic}/{TASK-ID}.md` or `.tasks/{TASK-ID}.md`
3. **Read the epic file:** `.tasks/epics/{epic}/_epic.md` or `.tasks/README.md`
4. **Analyze the codebase** to understand existing interfaces, patterns, and conventions:
   - Identify files that will be created or modified
   - Read related existing components/modules
   - Understand import patterns and test conventions already in use
   - Check existing test files for style/framework patterns (Vitest, testing-library, etc.)
5. **Collect design references** (CRITICAL for UI tasks):
   - Check if the task file references any design mockup images (e.g., `design-mockups/*.png`)
   - If mockup images exist, **read/view them** using the Read tool to understand the visual design
   - Check if a Stitch project is referenced — if so, use Stitch MCP to fetch the HTML code for each screen
   - If Stitch HTML is available, download it with `curl -L` and save to `design-mockups/stitch/`
   - Extract key visual patterns from the mockup/Stitch HTML into a checklist:
     - Layout patterns (grid vs stack, column counts, flex direction)
     - Component styles (border-radius, background colors, border colors)
     - Typography (font family, sizes, weights, letter-spacing)
     - Spacing and padding values
     - Interactive element styles (tabs, buttons, active/inactive states)
   - Save this checklist as `Visual Spec` — it will be verified in Phase 2.5
6. **Claim the task:** Update epic status to `in_progress`, create `.tasks/.current-task`
7. **Output analysis summary:**

```
TDD Starting: SUBPAGE-017 - Photos & Videos Content Strategy and UX Improvements
Epic: model-subpages | Estimate: 3pt

Analyzed:
  - Task file: .tasks/epics/model-subpages/SUBPAGE-017.md
  - Acceptance criteria: 11 items
  - Files to create/modify: [list]
  - Existing test patterns: Vitest + React Testing Library
  - Related modules: [list]

Design References:
  - Mockup: design-mockups/final-football.png (viewed ✓)
  - Stitch HTML: design-mockups/stitch/football.html (downloaded ✓)
  - Visual spec: 8 items to verify in Phase 2.5

Proceeding to Phase 1: Write Tests
```

If the task has NO design mockups (pure logic/backend), note "No design references — Phase 2.5 will be skipped."

---

### Phase 1: Write Tests (Red Phase)

**Goal:** Write comprehensive test files covering ALL acceptance criteria before writing any implementation code.

**Steps:**

1. **Map acceptance criteria to test cases.** Each acceptance criterion becomes one or more test cases.
2. **Identify edge cases** beyond the acceptance criteria:
   - Boundary values (empty arrays, max limits, zero items)
   - Error states (API failures, missing data, invalid input)
   - TypeScript type correctness (ensure types enforce constraints)
3. **Write test files** following the project's existing test conventions:
   - Use Vitest (`describe`, `it`, `expect`)
   - Use React Testing Library for component tests
   - Place tests adjacent to source files or in `__tests__/` directories matching project convention
   - Use descriptive test names that map back to acceptance criteria
4. **Structure tests by category:**

```typescript
describe('[TASK-ID] Feature Name', () => {
  describe('Acceptance Criteria', () => {
    it('should ...criterion 1...', () => { /* ... */ });
    it('should ...criterion 2...', () => { /* ... */ });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => { /* ... */ });
    it('should handle API errors', () => { /* ... */ });
  });

  describe('Type Safety', () => {
    it('should enforce correct types', () => { /* ... */ });
  });
});
```

5. **Run the test suite** to confirm ALL new tests fail:

```bash
npm test -- --run
```

6. **Gate check:** ALL new tests must fail (red). If any pass, the test is not specific enough — tighten it.

**Output:**

```
Phase 1 Complete: Tests Written

Test files created:
  - src/__tests__/components/stats/SeasonSummary.test.tsx (12 tests)
  - src/__tests__/pages/StatsPage-tabs.test.tsx (8 tests)

Test results: 20 new tests, 20 failing (expected)
All existing tests: passing

Proceeding to Phase 2: Implementation
```

**Abort condition:** If existing tests break from test file additions alone (import side effects, etc.), fix before proceeding.

---

### Phase 2: Implementation (Green Phase)

**Goal:** Implement the feature iteratively until ALL tests pass.

**Important:** When implementing UI components, use the design mockup images, Stitch HTML, and visual spec from Pre-Phase as the PRIMARY reference for styling decisions. The task file text is secondary — if there's any ambiguity, the mockup/Stitch HTML is the source of truth.

**When Stitch HTML is available:**
- Read the Stitch HTML file(s) downloaded in Pre-Phase
- Extract exact Tailwind classes, color values, border styles, spacing, and layout patterns
- Use these classes directly in the implementation (adapt as needed for React/component structure)
- The Stitch HTML is the pixel-perfect reference — match it as closely as possible

**Steps:**

1. **Implement in small increments.** After each significant code change (new function, component, route handler), run the full test suite:

```bash
npm test -- --run
```

2. **Iteration loop:**
   - Write/modify implementation code
   - Run tests
   - If tests fail → analyze the failure → fix the **implementation** (NOT the test) → re-run
   - If tests pass → move to next piece of implementation
3. **Never modify Phase 1 tests** unless there is a genuine specification error (not an implementation convenience). If a test needs changing, explain why before changing it.
4. **Track progress** by counting passing tests:

```
Iteration 3: 8/20 tests passing (+3 from last run)
  - ✅ Season summary renders hero stats
  - ✅ Tab switching works
  - ✅ Volleyball tab hides draws
  - ❌ Set breakdown renders bars (implementing next)
```

5. **Continue until ALL new tests AND all existing tests pass.**

**Output:**

```
Phase 2 Complete: Implementation Done

All tests passing: 20/20 new + 145 existing
Files created/modified:
  - src/components/stats/SeasonSummary.tsx (modified)
  - src/pages/StatsPage.tsx (modified)

Proceeding to Phase 2.5: Visual Verification
```

**Abort condition:** If after 5 consecutive iterations a test remains failing with no progress, pause and ask the user for guidance. Do not force-modify tests to make them pass.

---

### Phase 2.5: Visual Verification (Design Mockup Comparison)

**Goal:** Ensure the implementation visually matches the design mockups. Unit tests verify structure and logic but CANNOT verify visual styling — this phase catches CSS/layout drift.

**Skip this phase** if the task has no design mockups (pure logic/backend/data tasks).

**Steps:**

1. **Start the dev server** if not already running:

```bash
npm run dev &
```

Wait for it to respond:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null
```

2. **View the design mockup images** referenced in the task file using the Read tool. Note the key visual patterns.

3. **If Stitch HTML was downloaded in Pre-Phase**, read it now and create a CSS comparison checklist:

```
Visual Checklist (from Stitch HTML):
  □ Tabs: rounded-full pill style, bg-primary active, bg-[#1a1a1a] inactive
  □ Cards: bg-white/5 dark:bg-[#1a1a1a]/50, border-slate-200 dark:border-slate-800
  □ Hero stats: sparkline SVGs underneath numbers
  □ Section headings: text-lg font-bold
  □ Performance split: grid-cols-2 card layout
  □ Top scorers: person avatar circles
```

4. **Navigate to the affected page(s)** using Playwright MCP:

```
mcp__playwright__browser_navigate → http://localhost:5173{path}
```

5. **Take a DOM snapshot** to inspect the actual structure:

```
mcp__playwright__browser_snapshot
```

6. **Compare against the mockup**, checking each item on the visual checklist:
   - Layout structure (grid vs stack, column counts, flex direction)
   - Component styles (border-radius, background, border colors)
   - Active/inactive states on interactive elements
   - Typography and spacing
   - Section order matches mockup top-to-bottom

7. **Take screenshots** at both viewports for visual confirmation:
   - Mobile (390x844): `mcp__playwright__browser_resize → width: 390, height: 844`
   - Desktop (1280x720): `mcp__playwright__browser_resize → width: 1280, height: 720`

8. **For each discrepancy found:**
   - Note the specific difference (expected vs actual)
   - Fix the implementation code (CSS classes, layout, spacing)
   - Re-run tests to confirm the fix doesn't break anything
   - Re-check with Playwright MCP to confirm the fix

9. **Close the browser:**

```
mcp__playwright__browser_close
```

**Output:**

```
Phase 2.5 Complete: Visual Verification

Mockup comparison:
  ✅ Tab style: pill chips with rounded-full (matches Stitch)
  ✅ Season summary: hero cards with sparklines (matches Stitch)
  ✅ League table: compact 3-row with left accent bar (matches Stitch)
  ✅ Section order: Next Match → Form → Summary → Table → Split → Scorers
  ⚠️  Fixed: Performance split was stacked list, changed to 2-col grid
  ⚠️  Fixed: Card borders were red-tinted, changed to slate borders

Screenshots captured:
  - verify-mobile-stats.png (390x844)
  - verify-desktop-stats.png (1280x720)

2 discrepancies found and fixed. Tests still passing.

Proceeding to Phase 3: Quality Verification
```

**Abort condition:** If fixing a visual discrepancy requires significant architectural changes (e.g., different component structure), pause and ask the user before proceeding. Small CSS changes should be fixed in-place.

**Important:** Do NOT skip this phase for UI tasks. "Tests pass" does NOT mean "UI matches the mockup." This phase is what ensures visual fidelity.

---

### Phase 3: Quality Verification

**Goal:** Ensure zero regressions in type checking, linting, and build.

**Steps:**

1. **Run TypeScript type check:**

```bash
npm run build  # tsc -b is included in the build command
```

If errors found → fix them → re-run until clean.

2. **Run ESLint:**

```bash
npm run lint
```

If errors found → fix them (`npm run lint -- --fix` for auto-fixable issues) → re-run until clean.

3. **Run full test suite one final time** to confirm nothing broke during Phase 2.5 or Phase 3 fixes:

```bash
npm test -- --run
```

**Output:**

```
Phase 3 Complete: Quality Verified

  ✅ Lint: 0 errors
  ✅ Build: succeeded (includes type check)
  ✅ Tests: 165/165 passing

Proceeding to Phase 4: Task Completion
```

**Abort condition:** If a quality check reveals a deeper issue (e.g., type system incompatibility), explain the issue to the user before attempting a fix that might change the architecture.

---

### Phase 4: Task Completion

**Goal:** Update tracking and commit.

**Steps:**

1. **Update epic file:** Change task status to `✅ done`
2. **Add to `.tasks/.done`:** Append task ID
3. **Add CHANGELOG.md entry** under `[Unreleased]` with task reference
4. **Clear `.tasks/.current-task`**
5. **Create git commit** with conventional commit message:

```bash
git add <specific files>
git commit -m "$(cat <<'EOF'
feat(scope): description [TASK-ID]

- Key change 1
- Key change 2
- Added N tests covering acceptance criteria

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

**Output:**

```
Phase 4 Complete: Task Finished

Completed: SUBPAGE-017 - Photos & Videos Content Strategy and UX Improvements
Duration: ~45m

Updates:
  ✅ Epic updated (status → done)
  ✅ Added to .tasks/.done
  ✅ CHANGELOG.md entry added
  ✅ Committed: feat(model): implement photo content strategy [SUBPAGE-017]

Summary:
  - 20 tests written and passing
  - 4 files modified
  - 0 type errors, 0 lint errors, build clean
  - Visual verification: 8/8 mockup checks passed (2 fixed during Phase 2.5)
```

## Key Rules

1. **Never skip a phase.** Each phase must be fully green before the next begins.
2. **Tests first, always.** No implementation code before Phase 1 is complete.
3. **Fix implementation, not tests.** Tests represent the specification. Only modify a test if the spec itself was wrong.
4. **Run tests after every change** in Phase 2. No "batch and hope" approach.
5. **Zero regressions.** Existing tests must continue to pass throughout.
6. **Ask, don't guess.** If stuck for 5 iterations, ask the user rather than hacking around the problem.
7. **Mockup is the source of truth for UI.** When Stitch HTML or mockup images exist, they override text descriptions in the task file. Tests verify structure; Phase 2.5 verifies visual fidelity.
8. **Stitch HTML provides exact CSS.** When available, extract Tailwind classes from the Stitch HTML and use them directly. Do not invent your own styling when a pixel-perfect reference exists.

## Error Handling

### Task Not Found
```
Task SUBPAGE-099 not found.

Available tasks:
- SUBPAGE-017: Photos/Videos content strategy & UX (ready)
```

### No Acceptance Criteria
```
Task DES-013 has no explicit acceptance criteria in task file.

Options:
1. Derive criteria from the description and requirements
2. Ask user to define acceptance criteria first

Proceeding with derived criteria...
```

### Stuck in Phase 2
```
Phase 2 Stalled: 5 iterations without progress on:
  - "should load next 24 images on Load More click"

The test expects [...], but implementation produces [...].

Possible approaches:
1. [approach A]
2. [approach B]

Which approach should I take?
```

### Visual Verification Fails (Phase 2.5)
```
Phase 2.5: Visual discrepancies found

  ❌ Tabs: Expected pill style (rounded-full), got underline style (border-b-2)
  ❌ Cards: Expected bg-[#1a1a1a]/50 border-slate-800, got red-tinted borders
  ✅ Section order: Matches mockup

Fixing 2 discrepancies...
```

If discrepancies require changes that would break existing tests, fix the implementation AND update tests as needed — the mockup takes precedence.

### Dev Server Not Running (Phase 2.5)
```
Dev server is not responding at http://localhost:5173.

Starting dev server: npm run dev &
Waiting for server...
```

Retry up to 15 times with 2s delay. If it never responds, report the failure and ask the user.

## Notes

- This skill combines `/start-task` claiming with TDD implementation
- Respect existing test patterns in the codebase (Vitest, testing-library conventions)
- Prefer co-locating test files with source unless the project uses a separate `__tests__/` convention
- Include task ID in all test `describe` blocks for traceability
- The commit in Phase 4 should reference the task ID in brackets
- Phase 2.5 uses Playwright MCP tools — no Playwright test files are created
- For this project, use `npm` (not `pnpm`) as the package manager
