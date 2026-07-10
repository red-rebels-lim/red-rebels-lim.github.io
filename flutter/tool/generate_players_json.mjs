// Converts app/src/data/players.ts (a plain array literal) into a JSON asset
// for the Flutter app. Same extraction approach as generate_events_json.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(join(root, 'app/src/data/players.ts'), 'utf8');
const m = src.match(/export const players[^=]*=\s*(\[[\s\S]*\]);?\s*$/);
if (!m) throw new Error('Could not extract players literal');
const data = new Function('return ' + m[1])();
const out = join(root, 'flutter/assets/data/players.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data, null, 2));
console.log(`Wrote ${out}: players=${data.length}`);
