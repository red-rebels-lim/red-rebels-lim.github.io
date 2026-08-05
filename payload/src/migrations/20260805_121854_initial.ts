import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`enable_a_p_i_key\` integer,
  	\`api_key\` text,
  	\`api_key_index\` text,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`seasons\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text NOT NULL,
  	\`start_year\` numeric NOT NULL,
  	\`end_year\` numeric NOT NULL,
  	\`is_current\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`seasons_code_idx\` ON \`seasons\` (\`code\`);`)
  await db.run(sql`CREATE INDEX \`seasons_updated_at_idx\` ON \`seasons\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`seasons_created_at_idx\` ON \`seasons\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`teams_aliases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_aliases_order_idx\` ON \`teams_aliases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_aliases_parent_id_idx\` ON \`teams_aliases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_sports\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_sports_order_idx\` ON \`teams_sports\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`teams_sports_parent_idx\` ON \`teams_sports\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`teams\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text NOT NULL,
  	\`name_el\` text NOT NULL,
  	\`name_en\` text NOT NULL,
  	\`short_name\` text,
  	\`fotmob_id\` numeric,
  	\`logo_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`team_logos\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`teams_slug_idx\` ON \`teams\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`teams_logo_idx\` ON \`teams\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_updated_at_idx\` ON \`teams\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`teams_created_at_idx\` ON \`teams\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`players_aliases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`players\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`players_aliases_order_idx\` ON \`players_aliases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`players_aliases_parent_id_idx\` ON \`players_aliases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`players\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text NOT NULL,
  	\`sport\` text NOT NULL,
  	\`name_el\` text NOT NULL,
  	\`name_en\` text NOT NULL,
  	\`position\` text NOT NULL,
  	\`sub_position\` text,
  	\`date_of_birth\` text,
  	\`nationality\` text,
  	\`photo_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`player_photos\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`players_slug_idx\` ON \`players\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`players_photo_idx\` ON \`players\` (\`photo_id\`);`)
  await db.run(sql`CREATE INDEX \`players_updated_at_idx\` ON \`players\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`players_created_at_idx\` ON \`players\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`squad_memberships\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`player_id\` integer NOT NULL,
  	\`season_id\` integer NOT NULL,
  	\`sport\` text NOT NULL,
  	\`shirt_number\` numeric,
  	\`active\` integer DEFAULT true,
  	\`joined_date\` text,
  	\`left_date\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`season_id\`) REFERENCES \`seasons\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`squad_memberships_player_idx\` ON \`squad_memberships\` (\`player_id\`);`)
  await db.run(sql`CREATE INDEX \`squad_memberships_season_idx\` ON \`squad_memberships\` (\`season_id\`);`)
  await db.run(sql`CREATE INDEX \`squad_memberships_updated_at_idx\` ON \`squad_memberships\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`squad_memberships_created_at_idx\` ON \`squad_memberships\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_scorers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`minute\` text,
  	\`team\` text NOT NULL,
  	\`type\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_scorers_order_idx\` ON \`fixtures_scorers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_scorers_parent_id_idx\` ON \`fixtures_scorers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_bookings\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`minute\` text,
  	\`team\` text NOT NULL,
  	\`card\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_bookings_order_idx\` ON \`fixtures_bookings\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_bookings_parent_id_idx\` ON \`fixtures_bookings\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_lineup_home\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`number\` numeric,
  	\`position\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_lineup_home_order_idx\` ON \`fixtures_lineup_home\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_lineup_home_parent_id_idx\` ON \`fixtures_lineup_home\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_lineup_away\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`number\` numeric,
  	\`position\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_lineup_away_order_idx\` ON \`fixtures_lineup_away\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_lineup_away_parent_id_idx\` ON \`fixtures_lineup_away\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_subs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`player_on\` text NOT NULL,
  	\`player_off\` text NOT NULL,
  	\`minute\` text,
  	\`team\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_subs_order_idx\` ON \`fixtures_subs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_subs_parent_id_idx\` ON \`fixtures_subs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_sets\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`home\` numeric NOT NULL,
  	\`away\` numeric NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_sets_order_idx\` ON \`fixtures_sets\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_sets_parent_id_idx\` ON \`fixtures_sets\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures_vb_scorers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`points\` numeric NOT NULL,
  	\`team\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_vb_scorers_order_idx\` ON \`fixtures_vb_scorers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_vb_scorers_parent_id_idx\` ON \`fixtures_vb_scorers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`fixtures\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`season_id\` integer NOT NULL,
  	\`sport\` text NOT NULL,
  	\`kickoff\` text NOT NULL,
  	\`date_tbd\` integer DEFAULT false,
  	\`time_tbd\` integer DEFAULT false,
  	\`location\` text NOT NULL,
  	\`opponent_id\` integer,
  	\`opponent_name\` text NOT NULL,
  	\`venue\` text,
  	\`status\` text DEFAULT 'upcoming' NOT NULL,
  	\`score\` text,
  	\`penalties\` text,
  	\`competition\` text,
  	\`matchday\` numeric,
  	\`duration\` text,
  	\`report_e_n\` text,
  	\`report_e_l\` text,
  	\`event_key\` text,
  	\`source\` text DEFAULT 'manual' NOT NULL,
  	\`locked\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`season_id\`) REFERENCES \`seasons\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`opponent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`fixtures_season_idx\` ON \`fixtures\` (\`season_id\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_sport_idx\` ON \`fixtures\` (\`sport\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_kickoff_idx\` ON \`fixtures\` (\`kickoff\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_opponent_idx\` ON \`fixtures\` (\`opponent_id\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_status_idx\` ON \`fixtures\` (\`status\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`fixtures_event_key_idx\` ON \`fixtures\` (\`event_key\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_updated_at_idx\` ON \`fixtures\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`fixtures_created_at_idx\` ON \`fixtures\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`team_logos\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`team_logos_updated_at_idx\` ON \`team_logos\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`team_logos_created_at_idx\` ON \`team_logos\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`team_logos_filename_idx\` ON \`team_logos\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`player_photos\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`player_photos_updated_at_idx\` ON \`player_photos\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`player_photos_created_at_idx\` ON \`player_photos\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`player_photos_filename_idx\` ON \`player_photos\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`seasons_id\` integer,
  	\`teams_id\` integer,
  	\`players_id\` integer,
  	\`squad_memberships_id\` integer,
  	\`fixtures_id\` integer,
  	\`team_logos_id\` integer,
  	\`player_photos_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`seasons_id\`) REFERENCES \`seasons\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`players_id\`) REFERENCES \`players\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`squad_memberships_id\`) REFERENCES \`squad_memberships\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`fixtures_id\`) REFERENCES \`fixtures\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`team_logos_id\`) REFERENCES \`team_logos\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`player_photos_id\`) REFERENCES \`player_photos\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_seasons_id_idx\` ON \`payload_locked_documents_rels\` (\`seasons_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_players_id_idx\` ON \`payload_locked_documents_rels\` (\`players_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_squad_memberships_id_idx\` ON \`payload_locked_documents_rels\` (\`squad_memberships_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_fixtures_id_idx\` ON \`payload_locked_documents_rels\` (\`fixtures_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_logos_id_idx\` ON \`payload_locked_documents_rels\` (\`team_logos_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_player_photos_id_idx\` ON \`payload_locked_documents_rels\` (\`player_photos_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`seasons\`;`)
  await db.run(sql`DROP TABLE \`teams_aliases\`;`)
  await db.run(sql`DROP TABLE \`teams_sports\`;`)
  await db.run(sql`DROP TABLE \`teams\`;`)
  await db.run(sql`DROP TABLE \`players_aliases\`;`)
  await db.run(sql`DROP TABLE \`players\`;`)
  await db.run(sql`DROP TABLE \`squad_memberships\`;`)
  await db.run(sql`DROP TABLE \`fixtures_scorers\`;`)
  await db.run(sql`DROP TABLE \`fixtures_bookings\`;`)
  await db.run(sql`DROP TABLE \`fixtures_lineup_home\`;`)
  await db.run(sql`DROP TABLE \`fixtures_lineup_away\`;`)
  await db.run(sql`DROP TABLE \`fixtures_subs\`;`)
  await db.run(sql`DROP TABLE \`fixtures_sets\`;`)
  await db.run(sql`DROP TABLE \`fixtures_vb_scorers\`;`)
  await db.run(sql`DROP TABLE \`fixtures\`;`)
  await db.run(sql`DROP TABLE \`team_logos\`;`)
  await db.run(sql`DROP TABLE \`player_photos\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
