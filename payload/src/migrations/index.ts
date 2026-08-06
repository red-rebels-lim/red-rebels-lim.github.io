import * as migration_20260805_121854_initial from './20260805_121854_initial';
import * as migration_20260805_130147_legacy_url_fields from './20260805_130147_legacy_url_fields';
import * as migration_20260805_132402_season_scoped_eventkey from './20260805_132402_season_scoped_eventkey';

export const migrations = [
  {
    up: migration_20260805_121854_initial.up,
    down: migration_20260805_121854_initial.down,
    name: '20260805_121854_initial',
  },
  {
    up: migration_20260805_130147_legacy_url_fields.up,
    down: migration_20260805_130147_legacy_url_fields.down,
    name: '20260805_130147_legacy_url_fields',
  },
  {
    up: migration_20260805_132402_season_scoped_eventkey.up,
    down: migration_20260805_132402_season_scoped_eventkey.down,
    name: '20260805_132402_season_scoped_eventkey'
  },
];
