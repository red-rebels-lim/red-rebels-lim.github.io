import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.js'],
    env: {
      VAPID_PUBLIC_KEY: 'test-vapid-pub',
      VAPID_PRIVATE_KEY: 'test-vapid-priv',
      BACK4APP_APP_ID: 'test-app-id',
      BACK4APP_MASTER_KEY: 'test-master-key',
    },
  },
});
