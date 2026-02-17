---
name: list-tasks
description: |
  Show available tasks across all epics. Use when:
  - User says "list tasks", "show tasks", or "what work is available"
  - User wants to see work items to claim
  - User wants to check project task status
---

# List Tasks Skill

Displays available work across all epics, organized by status.

## When to Use

- When the user asks to see available tasks
- Before starting work to find tasks to claim
- To check what's blocked or in progress

## Workflow

### Step 1: Read All Epic Files

Read all `_epic.md` files from `.tasks/epics/*/`:

```
.tasks/epics/
├── seo-system/_epic.md
├── design-implementation/_epic.md
├── filtering/_epic.md
└── ... (all other epics)
```

### Step 2: Parse Task Tables

Each epic has a markdown table with tasks:

```markdown
| ID      | Title                  | Status  | Assignee | Estimate |
| ------- | ---------------------- | ------- | -------- | -------- |
| SEO-005 | Create dynamic robots  | ready   | -        | 1        |
| SEO-004 | Dynamic sitemap        | ✅ done | Dev A    | 2        |
```

Extract tasks with these statuses:
- `ready` → Ready to claim
- `in_progress` or `in progress` → Currently being worked on
- `blocked` → Waiting on dependency
- `✅ done` → Completed (don't show unless specifically asked)

### Step 3: Check Current Task

Read `.tasks/.current-task` if it exists to show what the developer is currently working on.

### Step 4: Format Output

Display tasks grouped by status:

```
🎯 Current Task
  SEO-005 | Create dynamic robots.txt | 1pt | seo-system
  Started: 2026-02-01 10:00

📋 Ready (available to claim)
  DES-013  | Banner carousel             | 3pt | design-implementation
  DES-014  | Featured performer spotlight| 2pt | design-implementation
  FILTER-002 | Filter state management   | 3pt | filtering

🔄 In Progress
  FILTER-001 | Filter sidebar component  | 5pt | filtering | Dev A

⛔ Blocked
  META-003 | JSON-LD optimization        | 2pt | metadata | blocked by META-002

Use /start-task TASK-ID to claim a task
```

### Step 5: Summary Stats

At the end, show summary:

```
─────────────────────────────────────
Ready: 15 | In Progress: 3 | Blocked: 2 | Done: 45
```

## Output Rules

1. **Sort by priority**: Lower task numbers first (SEO-001 before SEO-005)
2. **Show epic name**: Include the epic folder name for context
3. **Show estimate**: Include story point estimate if available
4. **Hide done tasks**: Unless user specifically asks for completed work
5. **Highlight current task**: If `.current-task` exists, show it prominently

## Example Output

```
📋 Available Tasks

🎯 Current Task
  None - Use /start-task TASK-ID to claim one

📋 Ready (8 tasks)
  SEO-005    | Create dynamic robots.txt         | 1pt | seo-system
  DES-013    | Promotional banner carousel       | 3pt | design-implementation
  DES-014    | Featured performer spotlight      | 2pt | design-implementation
  DES-015    | "New Today" section               | 2pt | design-implementation
  DES-016    | Mobile Navigation (hamburger)     | 3pt | design-implementation
  DES-017    | Toast Notifications               | 2pt | design-implementation
  FILTER-002 | Filter state management           | 3pt | filtering
  FILTER-003 | Integrate filters with listing    | 3pt | filtering

🔄 In Progress (0 tasks)
  None

⛔ Blocked (0 tasks)
  None

─────────────────────────────────────
Ready: 8 | In Progress: 0 | Blocked: 0 | Done: 45+
Use /start-task TASK-ID to claim a task
```

## Notes

- Read fresh data from epic files each time
- Don't cache task lists
- Parse both `ready` status and `-` assignee as "available"
- Tasks with assignees but `ready` status may be pre-assigned but not started
