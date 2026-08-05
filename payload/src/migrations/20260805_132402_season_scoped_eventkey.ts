import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`fixtures_event_key_idx\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`season_eventKey_idx\` ON \`fixtures\` (\`season_id\`,\`event_key\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_event_key_idx\` ON \`fixtures\` (\`event_key\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`season_eventKey_idx\`;`)
  await db.run(sql`DROP INDEX \`fixtures_event_key_idx\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`fixtures_event_key_idx\` ON \`fixtures\` (\`event_key\`);`)
}
