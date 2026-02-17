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
2. **Read the task file:** `.tasks/epics/{epic}/{TASK-ID}.md`
3. **Read the epic file:** `.tasks/epics/{epic}/_epic.md`
4. **Analyze the codebase** to understand existing interfaces, patterns, and conventions:
   - Identify files that will be created or modified
   - Read related existing components/modules
   - Understand import patterns and test conventions already in use
   - Check existing test files for style/framework patterns (Vitest, testing-library, etc.)
5. **Claim the task:** Update epic status to `in_progress`, create `.tasks/.current-task`
6. **Output analysis summary:**

```
TDD Starting: SUBPAGE-017 - Photos & Videos Content Strategy and UX Improvements
Epic: model-subpages | Estimate: 3pt

Analyzed:
  - Task file: .tasks/epics/model-subpages/SUBPAGE-017.md
  - Acceptance criteria: 11 items
  - Files to create/modify: [list]
  - Existing test patterns: Vitest + React Testing Library
  - Related modules: [list]

Proceeding to Phase 1: Write Tests
```

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
pnpm test -- --run
```

6. **Gate check:** ALL new tests must fail (red). If any pass, the test is not specific enough — tighten it.

**Output:**

```
Phase 1 Complete: Tests Written

Test files created:
  - apps/web/src/components/model/__tests__/photo-gallery.test.tsx (12 tests)
  - apps/web/src/app/model/[site]/[username]/photos/__tests__/page.test.tsx (8 tests)

Test results: 20 new tests, 20 failing (expected)
All existing tests: passing

Proceeding to Phase 2: Implementation
```

**Abort condition:** If existing tests break from test file additions alone (import side effects, etc.), fix before proceeding.

---

### Phase 2: Implementation (Green Phase)

**Goal:** Implement the feature iteratively until ALL tests pass.

**Steps:**

1. **Implement in small increments.** After each significant code change (new function, component, route handler), run the full test suite:

```bash
pnpm test -- --run
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
  - ✅ Photo gallery renders for Jerkmate models
  - ✅ Photo gallery renders for Streamate models
  - ✅ Returns 404 for non-eligible models
  - ❌ Load More button loads next 24 images (implementing next)
```

5. **Continue until ALL new tests AND all existing tests pass.**

**Output:**

```
Phase 2 Complete: Implementation Done

All tests passing: 20/20 new + 145 existing
Files created/modified:
  - apps/web/src/components/model/photo-gallery.tsx (modified)
  - apps/web/src/app/model/[site]/[username]/photos/page.tsx (modified)
  - packages/config/src/providers.ts (modified)

Proceeding to Phase 3: Quality Verification
```

**Abort condition:** If after 5 consecutive iterations a test remains failing with no progress, pause and ask the user for guidance. Do not force-modify tests to make them pass.

---

### Phase 3: Quality Verification

**Goal:** Ensure zero regressions in type checking, linting, and build.

**Steps:**

1. **Run TypeScript type check:**

```bash
pnpm type-check
```

If errors found → fix them → re-run until clean.

2. **Run ESLint:**

```bash
pnpm lint
```

If errors found → fix them (use `pnpm lint:fix` for auto-fixable issues) → re-run until clean.

3. **Run full build:**

```bash
pnpm build
```

If build fails → fix the issue → re-run until clean.

4. **Re-run tests one final time** to confirm nothing broke during fixes:

```bash
pnpm test -- --run
```

**Output:**

```
Phase 3 Complete: Quality Verified

  ✅ Type check: 0 errors
  ✅ Lint: 0 errors
  ✅ Build: succeeded
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
  ✅ Epic model-subpages/_epic.md updated (status → done)
  ✅ Added to .tasks/.done
  ✅ CHANGELOG.md entry added
  ✅ Committed: feat(model): implement photo content strategy [SUBPAGE-017]

Summary:
  - 20 tests written and passing
  - 4 files modified
  - 0 type errors, 0 lint errors, build clean
```

## Key Rules

1. **Never skip a phase.** Each phase must be fully green before the next begins.
2. **Tests first, always.** No implementation code before Phase 1 is complete.
3. **Fix implementation, not tests.** Tests represent the specification. Only modify a test if the spec itself was wrong.
4. **Run tests after every change** in Phase 2. No "batch and hope" approach.
5. **Zero regressions.** Existing tests must continue to pass throughout.
6. **Ask, don't guess.** If stuck for 5 iterations, ask the user rather than hacking around the problem.

## Error Handling

### Task Not Found
```
Task SUBPAGE-099 not found in model-subpages epic.

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

## Notes

- This skill combines `/start-task` claiming with TDD implementation
- Use the same epic prefix mapping as `/start-task`
- Respect existing test patterns in the codebase (Vitest, testing-library conventions)
- Prefer co-locating test files with source unless the project uses a separate `__tests__/` convention
- Include task ID in all test `describe` blocks for traceability
- The commit in Phase 4 should reference the task ID in brackets
