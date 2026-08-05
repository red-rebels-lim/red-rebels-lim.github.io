import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // node, not jsdom: int tests boot the real Payload (wrangler platform proxy),
    // and jsdom's TextEncoder breaks wrangler's esbuild invariant check.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // Payload boots once per file against the same local D1 — keep files serial.
    fileParallelism: false,
  },
})
