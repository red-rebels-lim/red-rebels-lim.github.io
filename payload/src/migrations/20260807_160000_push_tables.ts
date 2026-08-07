// DATA-11: notification storage moves from Back4App to D1. These are PLAIN
// tables owned by the rrcalendar Worker (app/src/worker/push.ts) — NOT Payload
// collections — so they live outside the drizzle snapshots (hand-written
// migration, snapshot-to-snapshot diffs never see them) and carry none of
// Payload's overhead on the hot unauthenticated endpoints.
//
// Ids are TEXT: the one-time Back4App export preserves Parse objectIds so the
// ids that clients persist (localStorage / SharedPreferences) keep working;
// new rows get crypto.randomUUID().

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`push_subscriptions\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`platform\` text NOT NULL DEFAULT 'web',
    \`endpoint\` text,
    \`p256dh\` text,
    \`auth\` text,
    \`token\` text,
    \`created_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    \`updated_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`push_subscriptions_endpoint_idx\` ON \`push_subscriptions\` (\`endpoint\`) WHERE \`endpoint\` IS NOT NULL;`,
  )
  await db.run(sql`CREATE INDEX \`push_subscriptions_token_idx\` ON \`push_subscriptions\` (\`token\`);`)

  await db.run(sql`CREATE TABLE \`notif_preferences\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`subscription_id\` text NOT NULL REFERENCES \`push_subscriptions\`(\`id\`) ON DELETE cascade,
    \`notify_new_events\` integer NOT NULL DEFAULT 1,
    \`notify_time_changes\` integer NOT NULL DEFAULT 1,
    \`notify_score_updates\` integer NOT NULL DEFAULT 1,
    \`reminder_hours\` text NOT NULL DEFAULT '[24,2]',
    \`enabled_sports\` text NOT NULL DEFAULT '["football-men","volleyball-men","volleyball-women"]',
    \`disabled\` integer NOT NULL DEFAULT 0,
    \`created_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    \`updated_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );`)
  await db.run(
    sql`CREATE INDEX \`notif_preferences_subscription_idx\` ON \`notif_preferences\` (\`subscription_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`telegram_subscribers\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`chat_id\` integer NOT NULL,
    \`lang\` text NOT NULL DEFAULT 'en',
    \`active\` integer NOT NULL DEFAULT 1,
    \`reminder_hours\` text NOT NULL DEFAULT '[24,2]',
    \`enabled_sports\` text NOT NULL DEFAULT '["football-men","volleyball-men","volleyball-women"]',
    \`created_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    \`updated_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`telegram_subscribers_chat_id_idx\` ON \`telegram_subscribers\` (\`chat_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`reminder_logs\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`event_key\` text NOT NULL,
    \`hours_before\` integer NOT NULL,
    \`channel\` text NOT NULL,
    \`sent_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );`)
  // UNIQUE makes the (eventKey, hoursBefore, channel) dedup atomic — the
  // sender can INSERT OR IGNORE instead of query-then-insert.
  await db.run(
    sql`CREATE UNIQUE INDEX \`reminder_logs_dedup_idx\` ON \`reminder_logs\` (\`event_key\`, \`hours_before\`, \`channel\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`reminder_logs\`;`)
  await db.run(sql`DROP TABLE \`telegram_subscribers\`;`)
  await db.run(sql`DROP TABLE \`notif_preferences\`;`)
  await db.run(sql`DROP TABLE \`push_subscriptions\`;`)
}
