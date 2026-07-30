import { defineConfig } from 'drizzle-kit';
import { initEnv } from './src/lib/env.ts';

// Init env to ensure process.env variables are validated.
// drizzle-kit runs locally/in CI outside of the Hono runtime, so we load env here.
const env = initEnv();

// DIRECT_DATABASE_URL is a non-pooled connection required for DDL operations
// (CREATE TABLE, ALTER TABLE, etc.) via drizzle-kit migrate.
// Falls back to DATABASE_URL if DIRECT_DATABASE_URL is not set,
// though some Neon pooler configurations may reject DDL commands.
const migrationUrl = env.DIRECT_DATABASE_URL ?? env.DATABASE_URL;

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
  verbose: true,
  strict: true,
});
