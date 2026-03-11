---
name: create-pr
description: |
  Create a GitHub PR for the current branch. Updates tracking files, runs quality checks, commits, pushes, and opens the PR.
  Use when:
  - User says "create pr", "open pr", "make a pr", or "submit pr"
  - User is done with a feature and wants to open a pull request
---

# Create PR Skill

Finishes the current task by updating epic status, .done file, CHANGELOG, and README, then creates a GitHub PR.

## Arguments

- `TASK-ID` (optional): Override task ID if not using .current-task

## When to Use

- After finishing implementation work
- When task exit criteria are met
- Before committing changes

## Workflow

### Step 1: Identify Current Task

1. Read `.tasks/.current-task` if it exists
2. Or use the TASK-ID argument if provided
3. If neither exists, ask user which task to complete

```json
{
  "taskId": "SEO-005",
  "epic": "seo-system",
  "title": "Create dynamic robots.txt",
  "estimate": 1,
  "startedAt": "2026-02-01T10:00:00Z"
}
```

### Step 2: Update Epic File

Read `.tasks/epics/{epic}/_epic.md` and update the task row:

**Before:**
```markdown
| SEO-005 | Create dynamic robots.txt | in_progress | Dev | 1 |
```

**After:**
```markdown
| SEO-005 | Create dynamic robots.txt | ✅ done | Dev | 1 |
```

### Step 3: Add to .done File

Append task ID to `.tasks/.done`:

```
# SEO System
SEO-005
```

Group by epic/category if possible. Add a comment with epic name if starting a new section.

### Step 4: Generate CHANGELOG Entry

Look at recent git changes to generate a changelog entry:

```bash
git diff --stat HEAD~5
git log --oneline -5
```

Add entry under `[Unreleased]` in `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- Dynamic robots.txt endpoint blocking /api/ and /_next/ routes (SEO-005)
```

Use appropriate section:
- **Added** for new features
- **Changed** for changes in existing functionality
- **Fixed** for bug fixes
- **Removed** for removed features

### Step 5: Run /project-status

Execute the project-status skill to update README.md with current metrics:

1. Analyze all task files
2. Calculate completion percentages
3. Update the Project Status section in README.md

### Step 6: Clear Current Task

Delete `.tasks/.current-task` file.

### Step 7: Code Review with Parallel Sub-Agents

Before committing, review all changed files using parallel sub-agents. First, get the list of changed files:

```bash
git diff --name-only HEAD
git diff --name-only --cached
```

Spawn **exactly 3 Task sub-agents concurrently** using the Task tool. Each agent receives the list of changed files and instructions to ONLY review those changes.

#### Sub-Agent 1: Security Review (`security-reviewer` agent)

Prompt the agent to:
- Scan all changed files for hardcoded secrets, API keys, tokens, passwords
- Check for authentication/authorization issues in new or modified endpoints
- Look for injection risks (SQL, XSS, command injection, SSRF, path traversal)
- Verify Edge Runtime compatibility (no Node.js-only modules in middleware/edge routes)
- Check for open redirect vulnerabilities in URL handling
- Verify affiliate IDs are not exposed in client-side code
- Check import boundary violations (`@/server/services/*` imported from components)

**If issues are found, fix them in-place immediately.**

#### Sub-Agent 2: Code Quality Review (`code-reviewer` agent)

Prompt the agent to:
- Check TypeScript types — no `any` casts, proper type narrowing, correct generics
- Find unused imports or variables in changed files
- Verify error handling — try/catch where needed, proper error boundaries
- Check Next.js best practices — correct use of `'use client'`/`'use server'`, proper metadata exports
- Verify SEO-critical patterns — canonical URLs, redirect types (301 vs 302), `noindex,follow` pairing
- Check for `console.log`/`console.error` without dev guards
- Verify import boundaries (pages/components only import from `@/server/api/*`)

**If issues are found, fix them in-place immediately.**

#### Sub-Agent 3: Accessibility Review (`general-purpose` agent)

Prompt the agent to review ONLY the changed files for:
- Missing or incorrect ARIA attributes (`aria-label`, `aria-expanded`, `aria-hidden`, `role`)
- Keyboard navigation issues — interactive elements must be focusable and operable via keyboard
- Semantic HTML — proper use of `<button>` vs `<div onClick>`, `<nav>`, `<main>`, `<section>`, heading hierarchy
- Image alt text — all `<img>` and `<Image>` components need meaningful alt text
- Form labels — all inputs need associated `<label>` elements or `aria-label`

**If issues are found, fix them in-place immediately.**

### Step 8: Run Quality Checks

Execute quality checks to ensure code is ready:

```bash
pnpm type-check && pnpm lint && pnpm build
```

Report results:
- ✅ Type check passed
- ✅ Lint passed
- ✅ Build succeeded

If any check fails, report the issue and resolve the failures before proceeding.

If tests or build fail due to fixes made by sub-agents, resolve the failures before proceeding.

### Step 9: End-to-End Verification with Playwright MCP

Verify the changes work correctly in a running browser before committing.

#### Prerequisites

1. **Check Docker is running:**
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
   ```
   If no `camsfinder-web` container is running, tell the user:
   > Docker containers aren't running. Start them with: `pnpm docker:compose:build && pnpm docker:compose:up`
   > Then re-run `/create-pr`.

2. **Wait for the web server to respond:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null
   ```
   Retry up to 15 times with 2s delay. If it never returns 200, report the failure and skip E2E (do not block the PR).

#### Determine What to Verify

Based on the task context and changed files, identify:
- **Target URL(s)**: Which page(s) are affected by the changes
- **Key elements**: DOM elements/sections that were added or modified
- **Interactions**: Links, buttons, navigation flows to test

If changes are purely backend/config (no UI), skip to Step 10.

#### Run E2E Checks

1. **Navigate to the affected page(s):**
   ```
   mcp__playwright__browser_navigate → http://localhost:3000{path}
   ```

2. **Remove dev overlays:**
   ```
   mcp__playwright__browser_evaluate →
     () => { document.querySelectorAll('nextjs-portal').forEach(el => el.remove()); }
   ```

3. **Take screenshots at both viewports:**
   - Mobile (390x844): `mcp__playwright__browser_resize → width: 390, height: 844`
   - Desktop (1280x720): `mcp__playwright__browser_resize → width: 1280, height: 720`
   - Take full-page screenshots at each viewport

4. **Verify key elements:**
   - Use `mcp__playwright__browser_snapshot` to inspect the DOM
   - Check that new/modified elements render correctly
   - Test interactive elements (click, hover, navigation)

5. **Check for errors:**
   - Use `mcp__playwright__browser_console_messages` with level `error` to check for runtime errors
   - If errors related to the changes are found, fix them before proceeding

6. **Close the browser:**
   ```
   mcp__playwright__browser_close
   ```

#### E2E Results

Report results in the output:
- Pages verified with screenshots
- Any issues found and fixed
- Console errors (if any)

If E2E verification fails on issues caused by the changes, fix them before proceeding. If failures are unrelated to the PR changes, note them but do not block.

### Step 10: Commit, Push, and Create PR

1. **Commit** all changes with a conventional commit message:

```
feat(seo): create dynamic robots.txt [SEO-005]

- Added /robots.txt endpoint
- Blocked /api/ and /_next/ routes
- Added sitemap reference

Refs: SEO-005
```

2. **Push** the branch:

```bash
git push -u origin HEAD
```

3. **Create the PR** with a descriptive title and body:

```bash
gh pr create --title "feat(seo): create dynamic robots.txt [SEO-005]" --body "$(cat <<'EOF'
## Summary
- <1-3 bullet points summarizing the changes>

## Task
- Task ID: SEO-005
- Epic: seo-system

## Test plan
- [ ] <Bulleted checklist of testing steps>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Return the PR URL when done.

## Output Format

```
Completed: SEO-005 - Create dynamic robots.txt
Duration: 2h 15m (started 2026-02-01 10:00)

📝 Updates
  ✅ Epic seo-system/_epic.md updated (status → done)
  ✅ Added to .tasks/.done
  ✅ CHANGELOG.md entry added
  ✅ README.md status updated

🔍 Quality Checks
  ✅ Type check passed
  ✅ Lint passed
  ✅ Build succeeded

🔎 Code Review
  ✅ Security review — no issues (or N issues fixed in-place)
  ✅ Code quality review — no issues (or N issues fixed in-place)
  ✅ Accessibility review — no issues (or N issues fixed in-place)
  ✅ Tests passed
  ✅ Build succeeded

🌐 E2E Verification
  ✅ /girl — renders correctly (mobile + desktop)
  ✅ No console errors
  (or ⏭️ Skipped — no UI changes)

🔗 PR Created
  https://github.com/Crakmedia-Repo/camsfinder-mono/pull/XXX
```

## Error Handling

### No Current Task
```
No current task found.

Use /create-pr TASK-ID to specify a task, or
Use /list-tasks to see in-progress tasks.
```

### Task Not In Progress
```
Task SEO-005 is not in progress (current status: ready).

Use /start-task SEO-005 first to claim it.
```

### Quality Check Failures
```
Completed: SEO-005 - Create dynamic robots.txt

📝 Updates
  ✅ Epic updated
  ✅ .done updated
  ✅ CHANGELOG updated

🔍 Quality Checks
  ❌ Type check failed: 3 errors
  ✅ Lint passed
  ⚠️  Build skipped (type errors)

Fix type errors before committing:
  apps/web/src/app/robots.ts:15 - Property 'allow' missing
```

## Partial Completion

If quality checks fail but task tracking should still be updated:

1. Update epic status to `✅ done`
2. Add to .done file
3. Add CHANGELOG entry
4. Update README status
5. Report quality issues for user to fix

The task is considered "done" from a tracking perspective even if there are remaining issues to fix.

## Notes

- Always calculate duration from .current-task startedAt
- Group changelog entries by type (Added/Changed/Fixed)
- Include task ID in changelog entry for traceability
- Run /project-status to keep README metrics current
- Don't block completion on quality check failures
