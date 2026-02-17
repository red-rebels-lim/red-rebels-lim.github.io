---
name: project-status
description: |
  Update project status report in README.md. Use this skill when:
  - User says "update project status", "update readme status", or "regenerate status"
  - After completing significant work that's ready to commit
  - Before creating a PR
  - When asked about project progress or completion percentage
  - After using /commit and wanting to update the status
---

# Project Status Update Skill

Updates the project status section in README.md by analyzing task files, sprint status, and completion metrics.

## When to Use

- After completing work and before committing
- Before creating a pull request
- When user asks to update or check project status
- Periodically to keep README accurate

## Workflow

### Step 1: Gather Data

Analyze the following files to determine project status:

1. **Task Epics** - Read all `_epic.md` files in `.tasks/epics/*/`
2. **Sprint Status** - Read `.tasks/.sprint` for current work
3. **Done Tasks** - Read `.tasks/.done` for completed work
4. **Changelog** - Read `CHANGELOG.md` for recent changes
5. **Requirements** - Reference `.docs/requirements/PRD.md` and `.docs/requirements/TRD.md` for phase definitions

### Step 2: Calculate Metrics

Determine:
- **Overall completion percentage** based on phases complete vs total phases
- **Epics complete** vs total epics (count from `.tasks/epics/`)
- **Tasks complete** (count from `.tasks/.done`)
- **Current phase** and its completion percentage

#### Phase Definitions (from TRD)

| Phase | Name | Weight |
|-------|------|--------|
| 0 | Alignment & Enablement | 10% |
| 1 | Foundation & Core Platform | 20% |
| 2 | SEO Engine & Content | 20% |
| 3 | Features & Polish | 20% |
| 4 | Production Ready | 15% |
| 5 | Launch Preparation | 10% |
| 6 | Launch & Stabilization | 5% |

### Step 3: Update README.md

Update the `## Project Status` section in README.md with:

1. **Executive Summary Table**
   ```markdown
   | Metric | Value |
   |--------|-------|
   | **Overall Completion** | **~XX%** |
   | **Phases Complete** | X of 7 |
   | **Current Phase** | Phase X: Name |
   | **Total Epics** | XX |
   | **Completed Epics** | XX |
   | **Tasks Completed** | XX+ |
   | **Last Updated** | YYYY-MM-DD |
   ```

2. **Phase Progress Bars**
   ```
   Phase 0  [████████████████████] 100%  ✅
   Phase 1  [████████████████████] 100%  ✅
   Phase 2  [████████████░░░░░░░░]  60%  🔄
   ...
   ```

3. **Completed Work Summary** - List completed epics and key deliverables

4. **In Progress** - Current phase details

5. **Remaining Work** - Overview of pending phases

### Step 4: Timestamp

Always update the "Last Updated" date in the status section to today's date.

## Output Format

The skill should produce a status section that fits between the README intro and the Setup section. Keep it scannable with tables and progress bars.

## Example Status Section

```markdown
## Project Status

> **Last Updated:** 2026-01-30 | Use `/project-status` to regenerate

| Metric | Value |
|--------|-------|
| **Overall Completion** | **~35%** |
| **Phases Complete** | 2 of 7 (Phase 0 + Phase 1) |
| **Current Phase** | Phase 2: SEO Engine & Content (~60%) |
| **Total Epics** | 26 |
| **Completed Epics** | 6 |
| **Tasks Completed** | 45+ |

### Progress

\`\`\`
Phase 0  [████████████████████] 100%  ✅ Alignment
Phase 1  [████████████████████] 100%  ✅ Foundation
Phase 2  [████████████░░░░░░░░]  60%  🔄 SEO Engine
Phase 3  [░░░░░░░░░░░░░░░░░░░░]   0%  ⏳ Features
Phase 4  [░░░░░░░░░░░░░░░░░░░░]   0%  ⏳ Production
Phase 5  [░░░░░░░░░░░░░░░░░░░░]   0%  ⏳ Launch Prep
Phase 6  [░░░░░░░░░░░░░░░░░░░░]   0%  ⏳ Launch
─────────────────────────────────────
OVERALL  [███████░░░░░░░░░░░░░]  35%
\`\`\`

### Completed (Phase 0-1)

- ✅ **Foundation (FND)**: Turborepo, pnpm, CI/CD, ESLint boundaries
- ✅ **Web Frontend (WEB)**: Next.js 16, App Router, shadcn/ui
- ✅ **Types (TYPES)**: Performer, Filter, API response types
- ✅ **API Integration (API)**: CrakLabel client, Redis cache, circuit breaker
- ✅ **Migration (MIG)**: 12 UI components, 14 API endpoints ported
- ✅ **UI Consolidation (UI)**: Duplicate components eliminated

### In Progress (Phase 2)

- 🔄 URL Normalization & JSON-LD: Complete
- 🔄 Content Migration: Pending
- 🔄 Affiliate Override: Partial

### Remaining (Phases 3-6)

See `.docs/ROADMAP.md` for detailed phase breakdown and `.tasks/epics/` for individual tasks.
```

## Notes

- Always read fresh data from task files - don't cache metrics
- Round percentages to nearest 5% for cleaner display
- Use emoji sparingly but consistently (✅ done, 🔄 in progress, ⏳ pending)
- Keep the section under 100 lines for quick scanning
