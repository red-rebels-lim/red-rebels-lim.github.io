# DATA-01: Scaffold Payload on Workers (template, local dev)

**Status:** todo
**Batch:** scaffold (`feat/payload-cms`)
**Depends on:** -
**Estimated scope:** Medium

## Context

Stand up the Payload CMS project from the **official Cloudflare template**
(Workers + OpenNext + D1 adapter + R2 storage) as a new standalone project at
`payload/` — the repo's 4th independent package.json (alongside `app/`,
`app/scripts/scraper/`, `.github/scripts/`). No Cloudflare account access is
needed for this task: local dev runs against wrangler's local D1/R2 simulators.

## Implementation notes

- Scaffold from the Cloudflare Payload template (`cloudflare/templates` payload
  entry / `npm create cloudflare@latest -- --template=...` — check current name).
- Pin the Payload version exactly (schema coupling rule from the architecture
  doc §11 — upgrades are schema-reviewed changes, not routine bumps).
- `payload/wrangler.jsonc`: local D1 binding + R2 binding; leave real IDs as
  placeholders for DATA-03.
- Disable GraphQL (not needed; incomplete on Workers). REST + Local API only.
- Wire scripts: `dev`, `build`, `migrate` (wrangler D1 migrations), `lint`,
  `test` (define minimal vitest setup — collection config sanity).
- Do NOT add to app CI yet; a `payload-ci` job comes with the first collections.
- Update root CLAUDE.md directory map + "three separate package.json" note → four.

## Acceptance criteria

- [ ] `cd payload && npm run dev` boots the admin UI locally against local D1
- [ ] Payload version pinned; GraphQL off; README documents commands
- [ ] No Cloudflare account resources touched
