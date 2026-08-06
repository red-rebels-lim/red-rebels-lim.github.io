/**
 * Standalone dual-write runner (DATA-09): syncs app/src/data/events.ts to
 * Payload/D1. Runs post-merge via .github/workflows/sync-payload.yml, so the
 * scraper's events.ts PR review gates every database write — the scrape run
 * itself only dry-runs the sync (lesson of the 2026-08-06 soak, where stale
 * season URLs pushed 78 junk fixtures straight into production).
 *
 *   PAYLOAD_API_KEY=... npx tsx payload-sync-run.ts
 *   PAYLOAD_DRY_RUN=1 ... to print the plan without writing
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { loadEventsData } from '../../../payload/scripts/lib/extract.ts';
import { syncEventsToPayload } from './payload-sync.ts';
import type { SportEvent } from './index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = path.resolve(__dirname, '../../src/data/events.ts');

const apiKey = process.env.PAYLOAD_API_KEY;
if (!apiKey) {
  console.error('PAYLOAD_API_KEY is required');
  process.exit(1);
}

const events = loadEventsData(EVENTS_PATH) as Record<string, SportEvent[]>;
const summary = await syncEventsToPayload(events, {
  apiUrl: process.env.PAYLOAD_API_URL ?? 'https://admin.red-rebels.com/api',
  apiKey,
  dryRun: process.env.PAYLOAD_DRY_RUN === '1',
});
console.log(
  `✓ Payload sync — created: ${summary.created}, updated: ${summary.updated}, ` +
  `detail filled: ${summary.filled}, skipped: ${JSON.stringify(summary.skipped)}`,
);
