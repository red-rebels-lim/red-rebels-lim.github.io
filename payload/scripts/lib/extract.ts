// Extraction of plain JS literals from the legacy TS sources (same technique as
// .github/scripts/send-reminders.js and flutter/tool/generate_*_json.mjs —
// the files are guaranteed TS-construct-free object/array literals).

import fs from 'fs'

import type { EventsData, LegacyPlayer } from './types'

function extractLiteral(source: string, pattern: RegExp, what: string): unknown {
  const match = source.match(pattern)
  if (!match) throw new Error(`Could not extract ${what}`)
  return new Function('return ' + match[1])()
}

export function loadEventsData(path: string): EventsData {
  const source = fs.readFileSync(path, 'utf-8')
  return extractLiteral(
    source,
    /export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/,
    `eventsData from ${path}`,
  ) as EventsData
}

export function loadPlayers(path: string): LegacyPlayer[] {
  const source = fs.readFileSync(path, 'utf-8')
  return extractLiteral(
    source,
    /export const players[^=]*=\s*(\[[\s\S]*\]);/,
    `players from ${path}`,
  ) as LegacyPlayer[]
}

export function loadSeasonYears(path: string): { startYear: number; endYear: number } {
  const source = fs.readFileSync(path, 'utf-8')
  const start = source.match(/SEASON_START_YEAR\s*=\s*(\d{4})/)
  const end = source.match(/SEASON_END_YEAR\s*=\s*(\d{4})/)
  if (!start || !end) throw new Error(`Could not extract season years from ${path}`)
  return { startYear: Number(start[1]), endYear: Number(end[1]) }
}

export function loadGreekToTeamKey(translatePath: string): Record<string, string> {
  const source = fs.readFileSync(translatePath, 'utf-8')
  return extractLiteral(
    source,
    /GREEK_TO_TEAM_KEY[^=]*=\s*({[\s\S]*?})\s*;/,
    `GREEK_TO_TEAM_KEY from ${translatePath}`,
  ) as Record<string, string>
}

export function loadTeamNamesEn(i18nEnPath: string): Record<string, string> {
  const json = JSON.parse(fs.readFileSync(i18nEnPath, 'utf-8'))
  return (json?.fotmob?.teams ?? {}) as Record<string, string>
}
