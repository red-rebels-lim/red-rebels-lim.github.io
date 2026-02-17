---
name: complete-task
description: |
  Complete the current task and update all tracking files. Use when:
  - User says "complete task", "finish task", or "done with task"
  - User has finished implementing a task
  - Work is ready to commit
---

# Complete Task Skill

Finishes the current task by updating epic status, .done file, CHANGELOG, and README.

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

### Step 6: Run Quality Checks

Execute quality checks to ensure code is ready:

```bash
pnpm type-check && pnpm lint && pnpm build
```

Report results:
- ✅ Type check passed
- ✅ Lint passed
- ✅ Build succeeded

If any check fails, report the issue but still complete the task tracking updates.

### Step 7: Clear Current Task

Delete `.tasks/.current-task` file.

### Step 8: Suggest Commit

Generate a commit message suggestion:

```
feat(seo): create dynamic robots.txt [SEO-005]

- Added /robots.txt endpoint
- Blocked /api/ and /_next/ routes
- Added sitemap reference

Refs: SEO-005
```

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

💡 Suggested commit:
  feat(seo): create dynamic robots.txt [SEO-005]

Use /commit to commit changes, or git commit manually
```

## Error Handling

### No Current Task
```
No current task found.

Use /complete-task TASK-ID to specify a task, or
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
