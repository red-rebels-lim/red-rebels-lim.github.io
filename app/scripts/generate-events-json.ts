/**
 * Generate the live data feeds consumed by the native (Flutter) apps.
 * Run with: npx tsx scripts/generate-events-json.ts
 *
 * Generates:
 *   public/events.json  (season fixtures)
 *   public/players.json (squad roster)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eventsData } from '@/data/events.ts';
import { players } from '@/data/players.ts';
import { SEASON_START_YEAR, SEASON_END_YEAR } from '@/data/constants.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const generatedAt = new Date().toISOString();

const feeds = [
  {
    filename: 'events.json',
    payload: {
      season: `${SEASON_START_YEAR}/${SEASON_END_YEAR}`,
      generatedAt,
      events: eventsData,
    },
  },
  {
    filename: 'players.json',
    payload: { generatedAt, players },
  },
];

for (const { filename, payload } of feeds) {
  const outPath = path.join(PUBLIC_DIR, filename);
  const jsonString = JSON.stringify(payload);
  fs.writeFileSync(outPath, jsonString, 'utf-8');
  console.log(`Generated ${outPath} (${jsonString.length} chars)`);
}
