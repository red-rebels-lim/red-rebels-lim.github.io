import * as migration_20260805_121854_initial from './20260805_121854_initial';

export const migrations = [
  {
    up: migration_20260805_121854_initial.up,
    down: migration_20260805_121854_initial.down,
    name: '20260805_121854_initial'
  },
];
