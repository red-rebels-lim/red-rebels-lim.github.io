import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`teams\` ADD \`logo_url\` text;`)
  await db.run(sql`ALTER TABLE \`players\` ADD \`photo_url\` text;`)
  await db.run(sql`ALTER TABLE \`fixtures\` ADD \`logo_url\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`teams\` DROP COLUMN \`logo_url\`;`)
  await db.run(sql`ALTER TABLE \`players\` DROP COLUMN \`photo_url\`;`)
  await db.run(sql`ALTER TABLE \`fixtures\` DROP COLUMN \`logo_url\`;`)
}
