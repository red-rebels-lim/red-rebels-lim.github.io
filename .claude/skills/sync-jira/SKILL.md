---
name: sync-jira
description: |
  Bidirectional sync between local .tasks/epics/ and Jira. Use when:
  - User says "sync to jira", "update jira", "sync epics", or "pull from jira"
  - Before stakeholder meetings to ensure Jira reflects current state
  - After completing significant work
  - After using /start-task or /complete-task

  Features:
  - Bidirectional sync with conflict detection
  - Rich description sync (Summary, Requirements, Acceptance Criteria, Technical Notes)
  - Task CRUD operations (create, read, update, delete)
  - Status transitions and assignee management
  - Bulk operations (create all missing tasks, verify done consistency)
---

# Jira Bidirectional Sync

Syncs tasks between local `.tasks/epics/` files and Jira with automatic direction detection and conflict resolution.

## Quick Start

```bash
# Navigate to skill scripts
cd .claude/skills/sync-jira/scripts

# Preview bidirectional sync
npx tsx index.ts

# Apply sync with interactive conflict resolution
npx tsx index.ts --apply

# Force push local → Jira
npx tsx index.ts push --apply

# Force pull Jira → local
npx tsx index.ts pull --apply
```

## Bidirectional Sync

The sync engine automatically detects which direction to sync based on timestamps:

| Scenario | Action |
|----------|--------|
| Local changed, Jira unchanged | Push local → Jira |
| Jira changed, local unchanged | Pull Jira → local |
| Both changed | **Conflict** - requires resolution |
| Neither changed | Skip (already in sync) |

### Conflict Resolution

When both local and Jira have changes since last sync:

```bash
# Interactive resolution (default)
npx tsx index.ts --apply

# Auto-resolve: local always wins
npx tsx index.ts --apply --resolve=local

# Auto-resolve: remote always wins
npx tsx index.ts --apply --resolve=remote

# Auto-resolve: most recent wins
npx tsx index.ts --apply --resolve=newer

# Skip conflicting tasks
npx tsx index.ts --apply --resolve=skip
```

## Commands

### Unified CLI (`index.ts`)

```bash
# Default: bidirectional sync
npx tsx index.ts                    # Preview
npx tsx index.ts --apply            # Apply changes

# Directional sync
npx tsx index.ts push --apply       # Force local → Jira
npx tsx index.ts pull --apply       # Force Jira → local

# Single task
npx tsx index.ts --task SEO-001 --apply

# Audit descriptions (compare local vs Jira)
npx tsx index.ts audit
npx tsx index.ts audit --verbose

# Description sync
npx tsx index.ts descriptions --apply
npx tsx index.ts desc --task SEO-001 --apply
npx tsx index.ts desc --epic SEO --apply

# Create tasks in Jira
npx tsx index.ts create-tasks       # Preview
npx tsx index.ts create-tasks --apply

# Verify done consistency
npx tsx index.ts verify-done

# Initialize timestamps
npx tsx index.ts init-timestamps
```

### Individual Scripts

| Script | Purpose |
|--------|---------|
| `task-sync.ts` | Bidirectional sync engine |
| `description-sync.ts` | Sync rich descriptions to Jira |
| `audit.ts` | Compare local vs Jira descriptions |
| `task-crud.ts` | Create/read/update/delete tasks |
| `task-transition.ts` | Transition task status |
| `task-assign.ts` | Assign/unassign tasks |
| `bulk-ops.ts` | Bulk operations |

#### Task CRUD (`task-crud.ts`)

```bash
# Create task in Jira
npx tsx task-crud.ts create SEO-006

# Read task from Jira
npx tsx task-crud.ts read SEO-001
npx tsx task-crud.ts read CC-106

# Update task in Jira
npx tsx task-crud.ts update SEO-001 --status in_progress
npx tsx task-crud.ts update SEO-001 --assignee "Dev A"

# Delete task from Jira
npx tsx task-crud.ts delete SEO-006
```

#### Status Transitions (`task-transition.ts`)

```bash
# Transition to specific status
npx tsx task-transition.ts SEO-001 "In Progress"
npx tsx task-transition.ts SEO-001 "Done"
npx tsx task-transition.ts CC-106 "To Do"

# List available transitions
npx tsx task-transition.ts SEO-001 --list
```

#### Assignment (`task-assign.ts`)

```bash
# Assign by developer name or alias
npx tsx task-assign.ts SEO-001 "Dev A"
npx tsx task-assign.ts SEO-001 "Panagiotis Fotiou"

# Assign by GitHub username
npx tsx task-assign.ts SEO-001 --github crak-pfotiou

# Unassign
npx tsx task-assign.ts SEO-001 --unassign

# Also update local file
npx tsx task-assign.ts SEO-001 "Dev A" --local-too

# List all developers
npx tsx task-assign.ts --list
```

## What Gets Synced

### Status & Assignee (Bidirectional)

| Repo Status | Jira Status |
|-------------|-------------|
| `ready` | To Do |
| `pending` | To Do |
| `in_progress` | In Progress |
| `blocked` | To Do + "Blocked" label |
| `done` | Done (via `verify-done` only) |

### Rich Descriptions (Local → Jira)

The description sync converts markdown sections to Jira ADF format:

| Markdown Section | Jira Format |
|------------------|-------------|
| `## Summary` | First paragraph |
| `## Requirements` | Bullet list |
| `## Acceptance Criteria` | Task list (checkboxes) |
| `## Technical Notes` | Code blocks preserved |

```bash
# Preview what would sync
npx tsx index.ts descriptions

# Sync all descriptions
npx tsx index.ts descriptions --apply

# Sync specific task
npx tsx index.ts desc --task SEO-001 --apply

# Sync all tasks in an epic
npx tsx index.ts desc --epic SEO --apply
```

## Configuration

### `.tasks/.jira-mapping.json`

```json
{
  "_project": "CC",

  "developers": {
    "Thomas Pedersen": {
      "jiraAccountId": "712020:efe63547-8188-482e-9b2c-b222f08b7d8d",
      "githubUsername": "thomas-pedersen",
      "aliases": ["Tech Lead", "TP"]
    },
    "Panagiotis Fotiou": {
      "jiraAccountId": "712020:1f10b028-7877-4173-a928-6eff46bbaf37",
      "githubUsername": "crak-pfotiou",
      "aliases": ["Dev A", "Panos Fotiou", "Panos"]
    },
    "Anastasis Georgiou": {
      "jiraAccountId": "712020:be3589c9-db78-4021-a19e-12ee229589be",
      "githubUsername": "crak-ageorgiou",
      "aliases": ["Dev B"]
    },
    "unassigned": null
  },

  "taskMappings": {
    "SEO-001": "CC-106",
    "SEO-002": "CC-107"
  },

  "mapping": [
    {
      "jiraKey": "CC-10",
      "jiraName": "SEO Engine",
      "repoEpics": ["SEO", "META", "SEOENH"]
    }
  ]
}
```

### `.tasks/.jira-timestamps.json` (Auto-created)

Tracks last sync state for conflict detection:

```json
{
  "tasks": {
    "SEO-001": {
      "localUpdated": "2026-02-05T10:00:00Z",
      "remoteUpdated": "2026-02-05T09:30:00Z",
      "lastSynced": "2026-02-05T08:00:00Z"
    }
  }
}
```

### Environment Variables (`.env.local`)

```bash
# Get API token: https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_URL=https://crakmedia.atlassian.net
JIRA_USERNAME=you@company.com
JIRA_API_TOKEN=ATATT3xFfGF0...
```

## Workflows

### Daily Sync

```bash
# Morning: pull any Jira changes
npx tsx index.ts pull --apply

# Work on tasks...
/start-task SEO-005
# ... implement feature ...
/complete-task

# End of day: push local changes
npx tsx index.ts push --apply
```

### Before Meetings

```bash
# Verify everything is in sync
npx tsx index.ts verify-done

# Sync any rich descriptions
npx tsx index.ts descriptions --apply

# Full bidirectional sync
npx tsx index.ts --apply
```

### Creating New Tasks

```bash
# Preview tasks to create
npx tsx index.ts create-tasks

# Create in Jira
npx tsx index.ts create-tasks --apply

# This will:
# - Create Jira Story linked to parent Epic
# - Include story points from estimate field
# - Update task file with Jira key
# - Update .jira-mapping.json taskMappings
```

### Resolving Conflicts

When a conflict is detected:

```
⚠️ Conflict for SEO-001 (CC-106):
┌────────────┬────────────────────┬────────────────────┐
│ Field      │ Local              │ Remote             │
├────────────┼────────────────────┼────────────────────┤
│ status     │ in_progress        │ Done               │
│ assignee   │ Dev A              │ Thomas Pedersen    │
└────────────┴────────────────────┴────────────────────┘
  Local updated:  2026-02-05T10:00:00Z
  Remote updated: 2026-02-05T09:30:00Z

[L]ocal / [R]emote / [S]kip ?
```

## Developer Lookup

The sync supports multiple ways to identify developers:

```bash
# By canonical name
npx tsx task-assign.ts SEO-001 "Panagiotis Fotiou"

# By alias
npx tsx task-assign.ts SEO-001 "Dev A"
npx tsx task-assign.ts SEO-001 "Panos"

# By GitHub username
npx tsx task-assign.ts SEO-001 --github crak-pfotiou
```

Useful for correlating git history with Jira tasks:

```bash
# Find who last modified a file
git log -1 --format='%an' -- .tasks/epics/seo-system/SEO-001.md
# → "crak-pfotiou" (GitHub username)

# Resolve to display name for Jira
npx tsx task-assign.ts --list
# → crak-pfotiou = "Panagiotis Fotiou"
```

## Script Location

All scripts are in `.claude/skills/sync-jira/scripts/`:

```
.claude/skills/sync-jira/
├── SKILL.md              # This documentation
└── scripts/
    ├── lib/
    │   ├── types.ts          # TypeScript interfaces
    │   ├── jira-api.ts       # Jira REST API client
    │   ├── adf-converter.ts  # Markdown → ADF conversion
    │   ├── config.ts         # Configuration loader
    │   ├── task-parser.ts    # Local task file parser
    │   └── timestamp-tracker.ts  # Sync timestamp tracking
    │
    ├── index.ts              # Unified CLI entry point
    ├── task-sync.ts          # Bidirectional sync engine
    ├── description-sync.ts   # Rich description sync
    ├── audit.ts              # Compare local vs Jira descriptions
    ├── task-crud.ts          # CRUD operations
    ├── task-transition.ts    # Status transitions
    ├── task-assign.ts        # Assignment operations
    └── bulk-ops.ts           # Bulk operations
```

## Notes

- **Bidirectional by default** - Detects which side changed and syncs accordingly
- **Conflicts require resolution** - When both sides change, you decide
- **"Done" status is special** - Use `verify-done` instead of auto-syncing
- **Rich descriptions are local → Jira only** - Jira ADF is authoritative after sync
- **Timestamps track sync state** - Stored in `.tasks/.jira-timestamps.json`
- **Developer mapping supports aliases** - Multiple names can map to same account
- **GitHub usernames** - Correlate git commits with Jira assignees
