# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Behavior

When asked to implement a feature or fix, proceed directly to implementation. Do NOT spend extended time in planning/discovery mode unless explicitly asked for a plan. If exploration is needed, timebox it to 2-3 minutes before starting code changes.

## Environment & Configuration

Never hardcode environment variables or API keys in code or PRs. Follow existing project patterns for env var injection — check CI/CD configs, Dockerfiles, and existing `NEXT_PUBLIC_*` usage patterns first before introducing new variables.

## Code Style

When making UI/style changes, match the existing design exactly. Do not introduce color drift, padding changes, or deviate from established patterns. Prefer DRY approaches — extract shared components rather than duplicating styles.

## Before Committing

After making code changes, always verify the build passes before committing. Run the project's type check, lint, and test commands (e.g., `pnpm type-check`, `pnpm lint`, `pnpm test`) before pushing or creating a PR.

## Tech Stack & Constraints

This is primarily a TypeScript/Next.js project. Be aware of Next.js-specific constraints: Edge Runtime cannot use Node.js modules, dynamic imports may be needed for env validation, and strict pnpm hoisting can cause module resolution issues.

## PR Review Workflow

When working with PR reviews: fetch comments, fix all issues in one pass, run tests, and push. Do not stop to re-plan between individual fixes.

## Project Overview

CamsFinder is an SEO-driven discovery platform for live cam models. This is a monorepo rebuild migrating from legacy AWS infrastructure (~$8k/month) to a modern, cost-effective platform (~$250/month MojoHost + Cloudflare).

**Key business context:**
- Generates ~$150k/year in affiliate revenue through organic search traffic
- SEO preservation is **critical** — zero organic traffic loss is the primary success metric
- 60% mobile / 40% desktop traffic split

## Commands

```bash
# Development
pnpm install              # Install dependencies
cp .env.local.template .env.local  # Setup env (no API keys needed for staging)
pnpm dev                  # Start dev server (http://localhost:3000)

# Build & Quality
pnpm build                # Build all packages (Turborepo cached)
pnpm type-check           # TypeScript validation
pnpm lint                 # ESLint check
pnpm lint:fix             # Auto-fix lint issues
pnpm test                 # Run Vitest tests
pnpm format               # Prettier formatting
pnpm clean                # Remove all build artifacts

# Docker (Next.js + Redis)
pnpm docker:compose:build && pnpm docker:compose:up  # Start production-like env
pnpm docker:compose:logs                              # Follow logs
pnpm docker:compose:down                              # Stop services
```

## Architecture

**Pattern:** Single Next.js 16 app with logical API boundary (no separate backend service)

```
apps/web/
├── src/app/              # Next.js App Router pages
├── src/components/       # React components
├── src/server/           # Logical API layer (STRICT BOUNDARY)
│   ├── api/              # Public data access interface
│   ├── services/         # CrakLabel client, Redis cache, circuit breaker
│   ├── site/             # Multi-site configuration
│   └── affiliate/        # Affiliate link generation
└── Dockerfile            # Multi-stage production build

packages/
├── types/                # @camsfinder/types - shared TypeScript types
├── seo/                  # @camsfinder/seo - URL normalization, meta generation
├── config/               # @camsfinder/config - filters, providers, compliance
└── ui/                   # @camsfinder/ui - shadcn/ui components
```

**Import boundary rule (ESLint enforced):** Pages/components import only from `server/api/*`, never directly from `server/services/*`.

## SEO-Critical URL System

**This is the most important technical aspect of the project.** See `.docs/requirements/url-mapping-strategy.md` for full specification.

**Canonical URL structure:**
```
/{gender}/{site?}/{ageTag?}/{hair?}/{eye?}/{ethnicity|language?}
```

**Key rules:**
- Gender is mandatory (girl, guy, couple, trans)
- Ethnicity and language are mutually exclusive in URLs
- `page` is the ONLY indexable query parameter
- Multi-selection states must NOT generate crawlable URLs
- Non-canonical URLs → 301 redirect to canonical
- `noindex,follow` must ALWAYS be paired with canonical for non-indexable URLs

**Normalization examples:**
- `/asian/girl` → 301 to `/girl/asian`
- `/girl/chaturbate?sort=new` → canonical `/girl/chaturbate` + `noindex,follow`

## Key Documentation

| Document | Purpose |
|----------|---------|
| `.docs/requirements/PRD.md` | Product requirements, features, acceptance criteria |
| `.docs/requirements/TRD.md` | Technical architecture, API contracts, data models |
| `.docs/requirements/url-mapping-strategy.md` | **SEO URL rules** (single source of truth) |
| `.docs/ROADMAP.md` | Project phases and milestones |
| `.docs/AGENTS.md` | AI agent guidelines, changelog requirements |
| `.docs/craklabel/*.md` | CrakLabel API endpoint documentation |
| `.docs/task-management/` | **Task management & Jira sync** documentation |

## Development Workflow

### Task Lifecycle (Recommended)

```bash
/list-tasks          # See available tasks
/start-task SEO-005  # Claim task, mark in_progress
# ... do work ...
/complete-task       # Mark done, update CHANGELOG, .done, README
/commit              # Commit with task reference
git push             # Pre-push validates quality (type-check, lint, build)
```

### Available Skills

| Skill | Purpose |
|-------|---------|
| `/list-tasks` | Show available, in-progress, and blocked tasks |
| `/start-task TASK-ID` | Claim a task and start working on it |
| `/complete-task` | Finish current task, update all tracking files |
| `/project-status` | Regenerate README.md status section |
| `/sync-jira` | Bidirectional sync with Jira (preview mode) |
| `/instinct-status` | Show learned instincts with confidence scores |
| `/evolve` | Cluster instincts into skills/commands/agents |

### Project-Local Agents

Customized agents in `.claude/agents/` for CamsFinder-specific reviews:

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Code quality with SEO-critical checks, import boundaries |
| `security-reviewer` | Security review (affiliate links, geo-compliance, API security) |
| `refactor-cleaner` | Dead code cleanup with CamsFinder "NEVER REMOVE" list |
| `database-reviewer` | PostgreSQL best practices |
| `doc-updater` | Documentation with CamsFinder codemap templates |

### Continuous Learning

The `continuous-learning-v2` skill learns patterns from your Claude Code sessions:

```
.claude/homunculus/
├── instincts/
│   ├── personal/     # Auto-learned (gitignored, per-developer)
│   └── shared/       # Team-reviewed (committed)
└── evolved/          # Generated skills/commands/agents
```

**Team workflow:**
1. Sessions auto-learn instincts in `personal/` (gitignored)
2. Export valuable patterns with `/instinct-export`
3. Add reviewed instincts to `shared/` and commit
4. Everyone benefits from curated team instincts

### Jira Sync Commands

The `/sync-jira` skill provides bidirectional sync with conflict detection. Use the skill scripts:

```bash
# From project root
cd .claude/skills/sync-jira/scripts

# Bidirectional sync (auto-detects direction based on timestamps)
npx tsx index.ts                          # Preview changes
npx tsx index.ts --apply                  # Apply with interactive conflict resolution

# Directional sync
npx tsx index.ts push --apply             # Force local → Jira
npx tsx index.ts pull --apply             # Force Jira → local

# Rich description sync
npx tsx index.ts descriptions --apply     # Sync descriptions to Jira
npx tsx index.ts audit                    # Compare local vs Jira descriptions

# Task operations
npx tsx index.ts create-tasks --apply     # Create Jira Stories
npx tsx index.ts verify-done              # Check done status consistency
```

**What syncs bidirectionally:**
- **Task status** — `ready`/`in_progress` ↔ To Do/In Progress
- **Assignees** — Developer mappings with GitHub username support
- **Rich descriptions** — Summary, Requirements, Acceptance Criteria, Technical Notes (local → Jira)

**Conflict resolution:** When both sides change, choose `--resolve=local`, `--resolve=remote`, `--resolve=newer`, or interactive prompt (default).

**Setup required:** Add Jira credentials to `.env.local` and developer mappings to `.tasks/.jira-mapping.json`. See `.claude/skills/sync-jira/SKILL.md` for full documentation.

### Branch Management

Before starting work on a branch, ensure it's rebased on latest main. After `git pull` or branch switches, verify you're on the correct branch with `git branch --show-current` before committing.

### Git Hooks (Husky)

**Pre-push hook** runs automatically before `git push`:
- `pnpm type-check` — TypeScript validation
- `pnpm lint` — ESLint check
- `pnpm build` — Build all packages

If any check fails, the push is blocked until issues are fixed.

### Commit Format

```
type(scope): description [TASK-ID]

feat(seo): add JSON-LD schema for model pages [SEO-003]
fix(url): correct canonical generation for multi-filter [SEO-002]
docs(prd): update compliance requirements
```

- Task ID in brackets is optional but encouraged for traceability
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### CI Pipeline

Type check → Lint → Build → Test (on PR to main)

## Data Flow

```
Request → Cloudflare CDN/WAF
        → Next.js middleware (URL normalization, geo headers)
        → App Router page (SSR)
        → Logical API layer (server/api/)
        → Redis cache check
        → CrakLabel API (if cache miss)
        → Response with SEO metadata + JSON-LD
```

**Caching TTLs:**
- Listings: 120s (Redis) + 60-120s (Cloudflare edge)
- Performer: 60s (Redis) + 120s (edge)
- Search: 30s (Redis)

## Geo-Restriction Compliance

CSS blur applied for restricted regions (EU, EEA, UK, 23 US states). See `packages/config/src/compliance.ts` for full list.

- Thumbnails: `blur(20px)`
- Streams: `blur(40px)` + `pointer-events: none`
- Sweden/Kyrgyzstan: hard 302 redirect to `/notice`
- Bots bypass restrictions (SEO preserved)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 3.4 |
| Components | shadcn/ui (Radix UI) |
| Language | TypeScript 5.9 |
| Runtime | Node.js 24 |
| Package Manager | pnpm 10 + Turborepo 2.x |
| Testing | Vitest |
| Cache | Redis 7 |
| Infrastructure | Kubernetes (MojoHost), ArgoCD, Cloudflare |

## External Tools & Integrations

PostHog is self-hosted, not cloud. Use direct API calls (not the PostHog MCP plugin which is cloud-only). The PostHog proxy is configured via Next.js rewrites with environment-specific detection.

## Environment Setup

Copy `.env.local.template` to `.env.local`. The staging CrakLabel API is publicly accessible — no API keys required for development.

Required variables:
```
NEXT_PUBLIC_DEFAULT_LANG=en
NEXT_PUBLIC_SITE_HOSTNAME=camsfinder.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Task Management

Task/epic tracking files should be updated as part of every feature completion. Always update the relevant epic file, CHANGELOG.md, and README.md before creating a PR.

Tasks organized in `.tasks/epics/{epic-name}/` with `_epic.md` files containing task tables. Done tasks tracked in `.tasks/.done`. Jira sync configured in `.tasks/.jira-mapping.json`.

### Task Structure

```
.tasks/
├── .done              # Completed task IDs
├── .sprint            # Current sprint info
├── .current-task      # Your active task (gitignored)
├── .jira-mapping.json # Jira sync configuration
└── epics/
    ├── seo-system/_epic.md
    ├── design-implementation/_epic.md
    └── ...
```

### Task Statuses

| Status | Repo | Jira |
|--------|------|------|
| `ready` | Available to claim | To Do |
| `in_progress` | Being worked on | In Progress |
| `blocked` | Waiting on dependency | To Do + "Blocked" label |
| `done` | Completed | Done (manual transition) |

### Quick Commands

```bash
/list-tasks          # See what's available
/start-task SEO-005  # Claim and start working
/complete-task       # Finish and update tracking
/sync-jira           # Sync to Jira (preview)
```

See `.docs/task-management/` for full documentation on workflows and Jira integration.

## Project Status Maintenance

**IMPORTANT:** Keep project tracking files updated as work progresses. This ensures accurate status reporting and team visibility.

### Files to Maintain

| File | When to Update | What to Update |
|------|----------------|----------------|
| `CHANGELOG.md` | Every change | Add entry under `[Unreleased]` section |
| `.tasks/.sprint` | Task state changes | Move tasks between sections |
| `.tasks/.done` | Task completion | Add completed task codes |
| `.tasks/epics/{epic}/*.md` | Task progress | Update status in task files |
| `README.md` | Before PR/commit | Regenerate status section |

### Workflow After Completing Work

**Streamlined (recommended):**
```bash
/complete-task       # Does steps 1-5 automatically
/commit              # Commit with task reference
git push             # Pre-push hook validates quality
```

**Manual:**
1. **Update CHANGELOG.md** — Add entry describing the change
2. **Update task files** — Mark task as complete in `.tasks/epics/{epic}/`
3. **Update .done file** — Add task code to `.tasks/.done`
4. **Run `/project-status`** — Regenerate README.md status section
5. **Run quality checks** — `pnpm type-check && pnpm lint && pnpm build`
6. **Commit and push**

### The `/project-status` Skill

Use the `/project-status` skill to automatically regenerate the project status section in README.md:

```
/project-status
```

This skill:
- Analyzes all task files in `.tasks/epics/`
- Reads `.tasks/.done` and `.tasks/.sprint`
- Cross-references with PRD/TRD phase definitions
- Calculates completion percentages
- Updates the `## Project Status` section in README.md
- Adds current timestamp

**When to use:**
- After completing significant work
- Before creating a pull request
- When asked about project progress
- Periodically to keep README accurate
