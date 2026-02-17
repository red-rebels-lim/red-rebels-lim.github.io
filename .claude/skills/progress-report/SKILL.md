---
name: progress-report
description: |
  Generate stakeholder-friendly progress reports from .tasks/ data. Use when:
  - User says "generate report", "progress report", "stakeholder update"
  - Before weekly standups or stakeholder meetings
  - User asks "what did we accomplish this week/sprint"

  Outputs formatted reports for Slack, email, Confluence, or terminal display.
  Focuses on business value delivered, not technical tasks.
---

# Progress Report Generator

Generate stakeholder-friendly progress reports from `.tasks/` data.

## Workflow

### 1. Gather Data

Parse these files:
- All `.tasks/epics/*/_epic.md` - Epic status and task counts
- `.tasks/.done` - Recently completed tasks
- `.tasks/.sprint` - Current sprint context
- `CHANGELOG.md` - Recent changes with business context

### 2. Calculate Metrics

```
overall_completion = weighted_sum(phase_completions)
velocity = tasks_completed / time_period
blockers = epics with "blocked" status
```

Phase weights (from TRD):
- Phase 0: 10%, Phase 1: 20%, Phase 2: 20%, Phase 3: 20%
- Phase 4: 15%, Phase 5: 10%, Phase 6: 5%

### 3. Generate Report

Based on `--format` flag:

## Output Formats

### Slack (`--format slack`)

```
*CamsFinder Progress Update* 📊
_2026-02-01_

*Overall:* 40% complete (Phases 0-1 done, Phase 2 in progress)

*This Period:*
• ✅ Payload CMS security hardening complete
• ✅ Docker build configuration fixed
• ✅ JSON-LD structured data implemented
• 🔄 Affiliate tracking override (partial)

*Next Up:*
• WordPress content migration
• Performance optimization

*Blockers:* None

_Full details in repo: `.tasks/` | README status section_
```

### Confluence/Jira (`--format confluence`)

```
h2. Progress Update - 2026-02-01

||Metric||Value||
|Overall Completion|40%|
|Phases Complete|2 of 7|
|Current Phase|Phase 2: SEO Engine (70%)|
|Tasks Completed|45+|

h3. Completed This Period

* *Security Hardening* - Payload CMS credentials secured, GraphQL playground disabled in production
* *Infrastructure* - Docker build now properly handles build-time secrets
* *SEO* - JSON-LD schemas for homepage, listings, and model profiles

h3. In Progress

* Affiliate tracking override system
* WordPress content migration planning

h3. Coming Next

* Performance optimization (Cloudflare caching headers)
* User retention features (favorites, history)

----
_Auto-generated from [camsfinder-mono|https://github.com/Crakmedia-Repo/camsfinder-mono]_
```

### Email/Markdown (`--format email` or `--format md`)

```markdown
# CamsFinder Progress Update
**Date:** 2026-02-01

## Summary
- **Overall:** 40% complete
- **Current Phase:** Phase 2 - SEO Engine & Content (70%)
- **Phases Done:** Phase 0 (Alignment), Phase 1 (Foundation)

## Completed This Period

### Security Hardening ✅
- Removed hardcoded MongoDB credentials from docker-compose
- Added production validation for PAYLOAD_SECRET
- Disabled GraphQL playground in production

### Infrastructure ✅
- Fixed Docker build to handle Payload CMS secrets properly
- Updated to Node.js 24 Alpine base image

### SEO Engine ✅
- JSON-LD structured data for all page types
- URL normalization middleware complete
- Dynamic sitemap generation

## In Progress 🔄
- Affiliate tracking override (partial)
- WordPress content migration (planning)

## Next Milestone
**Phase 2 Complete** - Target: [date TBD]
- Remaining: Content migration, affiliate system

---
*Generated from repo task tracking system*
```

### Terminal (`--format terminal` or default)

```
╔══════════════════════════════════════════════════════════════╗
║           CAMSFINDER PROGRESS REPORT - 2026-02-01            ║
╠══════════════════════════════════════════════════════════════╣
║  Overall: ████████░░░░░░░░░░░░  40%                          ║
║  Phase 2: ██████████████░░░░░░  70%                          ║
╠══════════════════════════════════════════════════════════════╣
║  COMPLETED                                                   ║
║  • Security hardening (Payload CMS)                          ║
║  • Docker build configuration                                ║
║  • JSON-LD structured data                                   ║
╠══════════════════════════════════════════════════════════════╣
║  IN PROGRESS                                                 ║
║  • Affiliate tracking override                               ║
║  • Content migration planning                                ║
╠══════════════════════════════════════════════════════════════╣
║  BLOCKERS: None                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## Commands

- `/progress-report` - Terminal format (default)
- `/progress-report --format slack` - Slack-ready output
- `/progress-report --format confluence` - Wiki markup for Jira/Confluence
- `/progress-report --format email` - Email-friendly markdown
- `/progress-report --since 2026-01-28` - Filter to changes since date
- `/progress-report --copy` - Copy output to clipboard

## Business Value Focus

Translate technical work into stakeholder language:

| Technical Task | Business Description |
|----------------|---------------------|
| Implement Redis caching | Faster page loads for users |
| Add JSON-LD schemas | Better Google search appearance |
| Fix security credentials | Production-ready security |
| URL normalization | SEO ranking preservation |
| Docker build fix | Reliable deployments |

## Quality Signals

Include these to counter "vibe coding" skepticism:

```
*Quality Gates Passed:*
• ✅ TypeScript strict mode - 0 errors
• ✅ ESLint boundaries enforced
• ✅ Security review completed
• ✅ Code review via Claude Code
• ✅ CI/CD pipeline green
```

## Notes

- Report pulls from actual repo state, not cached data
- CHANGELOG.md provides business context for technical changes
- Designed to be copy-pasted directly to communication channels
