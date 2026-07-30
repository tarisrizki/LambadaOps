import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  // Bundle workspace packages so Vercel Functions don't need to resolve them
  noExternal: ['@lambadaops/types', '@lambadaops/config'],
  external: ['@node-rs/argon2'],
});
