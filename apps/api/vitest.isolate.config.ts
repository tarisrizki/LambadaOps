import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/vitest.setup.ts'],
    environment: 'node',
    include: ['**/*.isolate.ts'],
    poolOptions: {
      threads: {
        isolate: true,
        maxThreads: 1,
        minThreads: 1
      }
    }
  },
});
