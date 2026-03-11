---
name: start-task
description: |
  Claim a task and start working on it. Use when:
  - User says "start task", "claim task", or "work on TASK-ID"
  - User wants to begin work on a specific task
  - After running /list-tasks to see available work
---

# Start Task Skill

Claims a task by ID, updates epic status, and creates current task context.

## Arguments

- `TASK-ID` (required): The task identifier (e.g., `SEO-005`, `DES-013`)

## When to Use

- When user wants to start working on a specific task
- After `/list-tasks` shows available work
- When resuming work on an existing task

## Workflow

### Step 1: Parse Task ID

Extract the task ID from arguments:
- `SEO-005` → epic prefix `SEO`, task number `005`
- `FILTER-001` → epic prefix `FILTER`, task number `001`

### Step 2: Find Epic

Map task prefix to epic folder:

| Prefix | Epic Folder |
|--------|-------------|
| SEO | seo-system |
| DES | design-implementation |
| FILTER | filtering |
| FND | foundation |
| WEB | web-frontend |
| TYPES | types |
| API | api-integration |
| MIG | migration |
| UI | ui-consolidation |
| META | metadata |
| PAGE | model-subpages |
| PERF | performance |
| SEC | security |
| MON | monitoring |
| TEST | testing |
| DOC | documentation |
| INFRA | infrastructure |
| LAUNCH | launch |
| MULTI | multi-site |
| AFF | affiliate-optimization |
| TOP | top-models |
| RET | user-retention |
| FEAT | features |
| PAGING | pagination |
| VERIFY | verification |
| ENHANCE | seo-enhancements |

### Step 3: Read Epic File

Read `.tasks/epics/{epic}/_epic.md` and find the task in the table.

### Step 4: Validate Task

Check:
1. Task exists in the epic
2. Task status is `ready` (not already in progress or done)
3. No blocking dependencies (check Dependencies section)

If validation fails, explain why and suggest alternatives.

### Step 5: Update Epic File

Edit the task row to change:
- Status: `ready` → `in_progress`
- Assignee: `-` → developer name (use "Dev" if unknown)

**Before:**
```markdown
| SEO-005 | Create dynamic robots.txt | ready | - | 1 |
```

**After:**
```markdown
| SEO-005 | Create dynamic robots.txt | in_progress | Dev | 1 |
```

### Step 6: Create Current Task File

Create `.tasks/.current-task` with task context:

```json
{
  "taskId": "SEO-005",
  "epic": "seo-system",
  "title": "Create dynamic robots.txt",
  "estimate": 1,
  "startedAt": "2026-02-01T10:00:00Z"
}
```

### Step 7: Output Task Details

Display task information:

```
Started: SEO-005 - Create dynamic robots.txt
Epic: seo-system | Estimate: 1pt | Started: 2026-02-01 10:00

📋 Description
Create a dynamic robots.txt endpoint that:
- Blocks /api/ routes
- Blocks /_next/ routes
- References sitemap.xml

🎯 Exit Criteria
- [ ] robots.txt accessible at /robots.txt
- [ ] /api/ routes blocked
- [ ] Sitemap reference included

📦 Dependencies
- FND-002 (✅ done) - Shared packages

💡 Suggested branch: feat/SEO-005-dynamic-robots-txt

Use /complete-task when done
```

## Exit Criteria Extraction

Pull exit criteria from epic file if available:
1. Look for `## Exit Criteria` section
2. Extract bullet points
3. If no specific task criteria, use epic-level criteria

## Error Handling

### Task Not Found
```
Task SEO-099 not found in seo-system epic.

Available tasks in seo-system:
- SEO-005: Create dynamic robots.txt (ready)
```

### Task Already In Progress
```
Task SEO-005 is already in progress (assigned to Dev A).

Did you mean to resume this task? The current-task file will be updated.
```

### Task Already Done
```
Task SEO-004 is already completed.

Available tasks in seo-system:
- SEO-005: Create dynamic robots.txt (ready)
```

### Blocked Task
```
Task META-003 is blocked by META-002 (not yet complete).

Complete META-002 first, or choose another task:
- META-001: Basic meta tags (ready)
```

## Notes

- Always read fresh epic data
- Create `.current-task` even if resuming (update timestamp)
- Suggest git branch name based on task ID and title
- Keep output concise but informative
