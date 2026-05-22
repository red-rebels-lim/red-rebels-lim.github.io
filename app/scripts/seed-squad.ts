/**
 * Generate a draft players.ts roster from events.ts.
 * Run with: npx tsx scripts/seed-squad.ts
 *
 * Writes app/src/data/players.draft.ts so manual edits to players.ts are not clobbered.
 * Review the diff, then move/merge the draft into players.ts.
 *
 * What it derives automatically: key, nameEl, nameEn, sport, active, plus appearance
 * counts in a leading comment so you can prioritise filling in positions.
 *
 * What you must fill in by hand: position, shirtNumber, dateOfBirth, nationality,
 * joinedDate. Each entry has a "// TODO" marker on the position field.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eventsData } from '@/data/events.ts';
import { MONTH_ORDER } from '@/data/month-config.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/players.draft.ts');

const GREEK_TO_LATIN: Record<string, string> = {
  Α: 'A', Ά: 'A', Β: 'V', Γ: 'G', Δ: 'D', Ε: 'E', Έ: 'E',
  Ζ: 'Z', Η: 'I', Ή: 'I', Θ: 'TH', Ι: 'I', Ί: 'I', Ϊ: 'I',
  Κ: 'K', Λ: 'L', Μ: 'M', Ν: 'N', Ξ: 'X', Ο: 'O', Ό: 'O',
  Π: 'P', Ρ: 'R', Σ: 'S', Τ: 'T', Υ: 'Y', Ύ: 'Y', Ϋ: 'Y',
  Φ: 'F', Χ: 'CH', Ψ: 'PS', Ω: 'O', Ώ: 'O',
};

function transliterateGreek(input: string): string {
  const upper = input.toUpperCase();
  const withDigraphs = upper.replace(/ΟΥ/g, 'OU');
  let out = '';
  for (const ch of withDigraphs) {
    out += GREEK_TO_LATIN[ch] ?? ch;
  }
  return out;
}

function isGreekForm(name: string): boolean {
  return /[Α-Ω]/.test(name);
}

function normalizeName(raw: string): string {
  return raw
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSnakeCaseKey(name: string): string {
  const latin = transliterateGreek(name);
  return latin
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function toTitleCase(name: string): string {
  return transliterateGreek(name)
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

interface DraftPlayer {
  key: string;
  nameEl: string;
  nameEn: string;
  apps: number;
  starts: number;
  subAppearances: number;
  goals: number;
  yellows: number;
  reds: number;
  firstSeen: string;
  lastSeen: string;
}

const players = new Map<string, DraftPlayer>();

function recordPlayer(rawName: string, monthDay: string, kind: 'start' | 'sub' | 'goal' | 'yellow' | 'red'): void {
  const normalized = normalizeName(rawName);
  if (!normalized) return;
  const key = toSnakeCaseKey(normalized);
  if (!key) return;

  let p = players.get(key);
  if (!p) {
    p = {
      key,
      nameEl: normalized,
      nameEn: toTitleCase(normalized),
      apps: 0,
      starts: 0,
      subAppearances: 0,
      goals: 0,
      yellows: 0,
      reds: 0,
      firstSeen: monthDay,
      lastSeen: monthDay,
    };
    players.set(key, p);
  } else if (isGreekForm(normalized) && !isGreekForm(p.nameEl)) {
    p.nameEl = normalized;
  }
  p.lastSeen = monthDay;

  switch (kind) {
    case 'start': p.starts++; break;
    case 'sub': p.subAppearances++; break;
    case 'goal': p.goals++; break;
    case 'yellow': p.yellows++; break;
    case 'red': p.reds++; break;
  }
}

const knownEnglishNames: Record<string, string> = {
  'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ': 'Panagiotis Louka',
  'ΓΕΩΡΓΙΟΣ ΧΡΙΣΤΟΔΟΥΛΟΥ': 'Georgios Christodoulou',
  'ΚΩΝΣΤΑΝΤΙΝΟΣ ΑΝΘΙΜΟΥ': 'Konstantinos Anthimou',
};

for (const month of MONTH_ORDER) {
  const events = eventsData[month] ?? [];
  for (const ev of events) {
    if (ev.sport !== 'football-men') continue;
    if (ev.status !== 'played') continue;

    // Football convention: lineup.home / team='home' = Nea Salamina, always.
    // Verified empirically — does NOT follow ev.location. Volleyball uses a different convention.
    const ourSide = 'home' as const;
    const monthDay = `${month} ${ev.day}`;

    const lineup = ev.lineup?.home;
    if (lineup) {
      for (const lp of lineup) recordPlayer(lp.name, monthDay, 'start');
    }

    if (ev.subs) {
      for (const s of ev.subs) {
        if (s.team !== ourSide) continue;
        recordPlayer(s.playerOn, monthDay, 'sub');
      }
    }

    if (ev.scorers) {
      for (const s of ev.scorers) {
        if (s.team !== ourSide) continue;
        recordPlayer(s.name, monthDay, 'goal');
      }
    }

    if (ev.bookings) {
      for (const b of ev.bookings) {
        if (b.team !== ourSide) continue;
        recordPlayer(b.name, monthDay, b.card);
      }
    }
  }
}

for (const p of players.values()) {
  p.apps = p.starts + p.subAppearances;
  if (knownEnglishNames[p.nameEl]) p.nameEn = knownEnglishNames[p.nameEl];
}

const sorted = [...players.values()].sort((a, b) => b.apps - a.apps || a.nameEl.localeCompare(b.nameEl));
const roster = sorted.filter((p) => p.apps >= 1);
const review = sorted.filter((p) => p.apps === 0);

const lines: string[] = [];
lines.push(`// Auto-generated draft roster. Move/merge into players.ts and fill in position + shirtNumber.`);
lines.push(`// Generated by app/scripts/seed-squad.ts on ${new Date().toISOString().slice(0, 10)}.`);
lines.push(`// `);
lines.push(`// ROSTER: ${roster.length} players who appeared in our lineup or as a substitute.`);
lines.push(`// REVIEW: ${review.length} scorer/booking-only entries — likely opponent or name-variant duplicates.`);
lines.push(`import type { Player } from '@/types/players';`);
lines.push('');
lines.push(`export const players: Player[] = [`);

for (const p of roster) {
  lines.push(`  // ${p.nameEl} — ${p.apps} apps (${p.starts} start, ${p.subAppearances} sub) · ${p.goals}G ${p.yellows}Y ${p.reds}R · first ${p.firstSeen}, last ${p.lastSeen}`);
  lines.push(`  {`);
  lines.push(`    key: '${p.key}',`);
  lines.push(`    sport: 'football-men',`);
  lines.push(`    active: true,`);
  lines.push(`    nameEl: ${JSON.stringify(p.nameEl)},`);
  lines.push(`    nameEn: ${JSON.stringify(p.nameEn)},`);
  lines.push(`    position: 'MID', // TODO: GK | DEF | MID | FWD`);
  lines.push(`    // shirtNumber: 0,`);
  lines.push(`    // dateOfBirth: '',`);
  lines.push(`    // nationality: '',`);
  lines.push(`    // joinedDate: '',`);
  lines.push(`  },`);
}

lines.push(`];`);
lines.push('');

if (review.length > 0) {
  lines.push(`/*`);
  lines.push(` * REVIEW NEEDED — these names appeared only as scorers/booked, never in a lineup or sub.`);
  lines.push(` * They are likely (a) opponent players the scraper mis-attributed, or (b) name-variant`);
  lines.push(` * duplicates of a player already in the roster above (e.g. "Daniel Pérez" might be the`);
  lines.push(` * casual form of "ALEJANDRO PEREZ CORDOVA DANIEL"). Merge or delete as appropriate.`);
  lines.push(` *`);
  for (const p of review) {
    lines.push(` * ${p.nameEl} — ${p.goals}G ${p.yellows}Y ${p.reds}R · first ${p.firstSeen}, last ${p.lastSeen} · key=${p.key}`);
  }
  lines.push(` */`);
  lines.push('');
}

fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf-8');
console.log(`Wrote ${OUTPUT_PATH}: ${roster.length} roster entries, ${review.length} review entries.`);
