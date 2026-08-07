// One-time Back4App → D1 export of the notification stores (DATA-11).
//
// Reads the four Parse classes over REST (master key) and writes an .sql file
// of INSERT OR REPLACE statements. It does NOT touch D1 itself — a human
// reviews the file and applies it:
//
//   BACK4APP_APP_ID=... BACK4APP_MASTER_KEY=... \
//     npx tsx scripts/export-back4app-push.ts /tmp/push-export.sql
//   npx wrangler d1 execute D1 --remote --file /tmp/push-export.sql
//
// Parse objectIds are preserved as row ids so the ids clients persist
// (localStorage / SharedPreferences) keep working against the new endpoints.

import fs from 'fs'

const APP_ID = process.env.BACK4APP_APP_ID
const MASTER_KEY = process.env.BACK4APP_MASTER_KEY
const OUT = process.argv[2]
if (!APP_ID || !MASTER_KEY || !OUT) {
  console.error('Usage: BACK4APP_APP_ID=... BACK4APP_MASTER_KEY=... tsx scripts/export-back4app-push.ts <out.sql>')
  process.exit(1)
}

type Row = Record<string, unknown>

async function fetchAll(className: string): Promise<Row[]> {
  const rows: Row[] = []
  let skip = 0
  for (;;) {
    const res = await fetch(
      `https://parseapi.back4app.com/classes/${className}?limit=1000&skip=${skip}&order=createdAt`,
      { headers: { 'X-Parse-Application-Id': APP_ID!, 'X-Parse-Master-Key': MASTER_KEY! } },
    )
    if (!res.ok) throw new Error(`${className} → ${res.status}: ${await res.text()}`)
    const { results } = (await res.json()) as { results: Row[] }
    rows.push(...results)
    if (results.length < 1000) return rows
    skip += 1000
  }
}

const q = (v: unknown): string => {
  if (v === undefined || v === null) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? '1' : '0'
  return `'${String(v).replace(/'/g, "''")}'`
}
const qJson = (v: unknown, fallback: unknown): string => q(JSON.stringify(v ?? fallback))
const parseDate = (v: unknown): string | null =>
  typeof v === 'object' && v !== null && 'iso' in (v as Row)
    ? String((v as Row).iso)
    : typeof v === 'string'
      ? v
      : null

const [subs, prefs, telegram, logs] = await Promise.all([
  fetchAll('PushSubscription'),
  fetchAll('NotifPreference'),
  fetchAll('TelegramSubscriber'),
  fetchAll('ReminderLog'),
])

const lines: string[] = ['-- Back4App push export, generated ' + new Date().toISOString()]

for (const s of subs) {
  const platform = s.platform === 'fcm' ? 'fcm' : 'web'
  lines.push(
    `INSERT OR REPLACE INTO push_subscriptions (id, platform, endpoint, p256dh, auth, token, created_at, updated_at) VALUES (` +
      [q(s.objectId), q(platform), q(s.endpoint), q(s.p256dh), q(s.auth), q(s.token), q(s.createdAt), q(s.updatedAt)].join(', ') +
      `);`,
  )
}

const subIds = new Set(subs.map((s) => s.objectId))
let orphanPrefs = 0
for (const p of prefs) {
  const subId = (p.subscription as Row | undefined)?.objectId
  if (!subId || !subIds.has(subId)) {
    orphanPrefs++
    continue // FK would reject; orphaned prefs are dead weight anyway
  }
  lines.push(
    `INSERT OR REPLACE INTO notif_preferences (id, subscription_id, notify_new_events, notify_time_changes, notify_score_updates, reminder_hours, enabled_sports, disabled, created_at, updated_at) VALUES (` +
      [
        q(p.objectId),
        q(subId),
        q(p.notifyNewEvents !== false),
        q(p.notifyTimeChanges !== false),
        q(p.notifyScoreUpdates !== false),
        qJson(p.reminderHours, [24, 2]),
        qJson(p.enabledSports, ['football-men', 'volleyball-men', 'volleyball-women']),
        q(p.disabled === true),
        q(p.createdAt),
        q(p.updatedAt),
      ].join(', ') +
      `);`,
  )
}

for (const t of telegram) {
  lines.push(
    `INSERT OR REPLACE INTO telegram_subscribers (id, chat_id, lang, active, reminder_hours, enabled_sports, created_at, updated_at) VALUES (` +
      [
        q(t.objectId),
        q(t.chatId),
        q(t.lang ?? 'en'),
        q(t.active !== false),
        qJson(t.reminderHours, [24, 2]),
        qJson(t.enabledSports, ['football-men', 'volleyball-men', 'volleyball-women']),
        q(t.createdAt),
        q(t.updatedAt),
      ].join(', ') +
      `);`,
  )
}

// Dedup logs on the unique (event_key, hours_before, channel) triple.
const seenLog = new Set<string>()
let dupLogs = 0
for (const l of logs) {
  const key = `${l.eventKey}|${l.hoursBefore}|${l.channel}`
  if (seenLog.has(key)) {
    dupLogs++
    continue
  }
  seenLog.add(key)
  lines.push(
    `INSERT OR REPLACE INTO reminder_logs (id, event_key, hours_before, channel, sent_at) VALUES (` +
      [q(l.objectId), q(l.eventKey), q(l.hoursBefore), q(l.channel), q(parseDate(l.sentAt) ?? l.createdAt)].join(', ') +
      `);`,
  )
}

fs.writeFileSync(OUT, lines.join('\n') + '\n')
console.log(
  `Wrote ${OUT}: ${subs.length} subscriptions, ${prefs.length - orphanPrefs} preferences` +
    `${orphanPrefs ? ` (${orphanPrefs} orphaned skipped)` : ''}, ${telegram.length} telegram, ` +
    `${seenLog.size} reminder logs${dupLogs ? ` (${dupLogs} duplicates dropped)` : ''}.`,
)
console.log(`Review it, then apply with:\n  npx wrangler d1 execute D1 --remote --file ${OUT}`)
