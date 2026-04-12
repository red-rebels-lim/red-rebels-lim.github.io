/**
 * Generate subscribable .ics calendar files for auto-sync.
 * Run with: npx tsx scripts/generate-calendar.ts
 *
 * Generates:
 *   public/calendar.ics    (English)
 *   public/calendar-el.ics (Greek)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eventsData } from '@/data/events.ts';
import { generateIcsString } from '@/lib/ics-core.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const files = [
  { lang: 'en' as const, filename: 'calendar.ics' },
  { lang: 'el' as const, filename: 'calendar-el.ics' },
];

for (const { lang, filename } of files) {
  const ics = generateIcsString(eventsData, {
    lang,
    includeAlarms: true,
    alarmMinutesBefore: 120,
    refreshIntervalHours: 6,
  });

  const outPath = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(outPath, ics, 'utf-8');
  console.log(`Generated ${outPath} (${ics.length} bytes)`);
}
