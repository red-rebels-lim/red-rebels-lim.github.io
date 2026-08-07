# DATA-16: MCP tool — manage the data from Claude chat via the Payload API

**Status:** todo
**Batch:** mcp (`feat/payload-mcp`)
**Depends on:** DATA-03
**Estimated scope:** Medium (spike) → Medium/Large (custom fallback)

## Context

The endgame of the 2026-08-07 pivot: humans manage the data — the dashboard
for hands-on editing, and an MCP tool so match-day operations can be driven
from a Claude chat ("Salamina scored, 2-1, Balde 81'") executing directly
against the Payload API. Decision: **spike the official `@payloadcms/plugin-mcp`
first**; build custom only if it can't meet the bar below.

## Spike checklist (evaluate the official plugin)

- [ ] Compatible with the pinned Payload 3.82.1 and the Workers/D1 runtime
      (plugin registration → does it affect the OpenNext bundle / bundle size
      limit? does it add collections → migration?)
- [ ] Auth story: can it use the existing users API-key auth, scoped to a
      dedicated MCP service account (NOT the admin user)?
- [ ] Can exposed operations be scoped per collection + per operation
      (e.g. fixtures update yes, users no, delete no)?
- [ ] Can our protection rules be enforced server-side (played results frozen,
      `locked` untouchable, bulk-create cap)? Payload collection `access` +
      `beforeChange` hooks keyed on the MCP service account may be the way —
      rules must live in Payload, not in the client's goodwill.
- [ ] Connectivity: Claude chat (claude.ai custom connector / Claude Code MCP
      config) → the Worker's MCP endpoint over HTTP.

## Custom fallback (if the plugin fails the bar)

- Foundation exists: `app/scripts/scraper/payload-sync.ts` (authenticated REST
  client, eventKey/kickoff computation, team resolution via aliases, tested
  protection rules + bulk cap). Relocate it (DATA-17 depends on that) and wrap
  it in a small MCP server — likely a separate Worker using the Agents SDK /
  workers-mcp, exposing verbs like `set_live`, `update_score`, `record_result`,
  `add_fixture`, `list_fixtures`.

## Acceptance criteria

- [ ] Spike verdict written up (plugin vs custom) with the checklist answered
- [ ] Whichever path: a Claude chat can set a fixture live, update the score,
      and record the final result — and is REFUSED on locked fixtures and on
      bulk creations over the cap
- [ ] Protection rules enforced server-side (proven by attempting violations)
- [ ] Dedicated service account, never the human admin credentials
