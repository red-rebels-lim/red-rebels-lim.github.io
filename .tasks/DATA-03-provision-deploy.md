# DATA-03: Provision D1 + R2, deploy Payload Worker ⚠️ needs Cloudflare auth

**Status:** todo (blocked on Cloudflare credentials)
**Batch:** scaffold (`feat/payload-cms`)
**Depends on:** DATA-02
**Estimated scope:** Medium

## Context

First task that touches the Cloudflare account. Requires either an interactive
`npx wrangler login` (user runs `! npx wrangler login` in-session) or a
`CLOUDFLARE_API_TOKEN` env var scoped to Workers Scripts + D1 + R2 + Cache Purge.

## Implementation notes

- `wrangler d1 create solosalamina-data`; `wrangler r2 bucket create
  solosalamina-media`; record IDs in `payload/wrangler.jsonc`.
- Secrets: PAYLOAD_SECRET (+ any adapter secrets) via `wrangler secret put`.
- Run migrations against remote D1; deploy the Payload Worker.
- Create the admin user; create the scraper service account/API key (store as
  GH secret `PAYLOAD_API_KEY` — needed by DATA-09).
- Domain: start on workers.dev; optionally route `admin.red-rebels.com` (defer
  the domain decision — record what was chosen).
- Workers paid plan ($5/mo) likely needed for bundle/CPU headroom — confirm with
  the user before enabling billing (this is the one real spend decision).
- Decide + document deploy path going forward: wrangler from local vs Workers
  Builds git integration (mirror of the rrcalendar dashboard-deploy convention).

## Acceptance criteria

- [ ] Admin dashboard reachable and usable from a browser (login works)
- [ ] Remote D1 has the migrated schema; R2 bucket wired for uploads
- [ ] Scraper API key exists and is stored as a GH Actions secret
- [ ] IDs/choices documented in payload/README + wrangler.jsonc committed
