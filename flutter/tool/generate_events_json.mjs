// Converts app/src/data/events.ts (a plain object literal, same contract the
// reminders cron relies on) into a JSON asset for the Flutter app.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(join(root, 'app/src/data/events.ts'), 'utf8');
const m = src.match(/export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/);
if (!m) throw new Error('Could not extract eventsData literal');
const data = new Function('return ' + m[1])();
const out = join(root, 'flutter/assets/data/events.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data, null, 2));
console.log(`Wrote ${out}: months=${Object.keys(data).length}, events=${Object.values(data).flat().length}`);
