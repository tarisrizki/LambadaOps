import { z } from 'zod';

/**
 * Backend environment variable schema — LambadaOps API (Hono)
 *
 * Scope: Technical configuration only.
 * Business constants (role slugs, plan limits) live in the database.
 *
 * Called at app startup. App refuses to start with invalid configuration.
 */
export const envSchema = z.object({
  // ─── Runtime ────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // ─── Database (Neon — HTTP driver) ───────────────────────────────────────────
  // Only ONE pooled URL needed for all runtime queries (HTTP driver is stateless).
  DATABASE_URL: z
    .string()
    .min(1)
    .describe('Neon pooled connection string (used for all queries via HTTP driver)'),
  // Required for drizzle-kit migrate (DDL commands need a direct non-pooled connection).
  // NOT used at runtime — only by drizzle-kit in development/CI.
  // Leave unset in production Vercel environment.
  DIRECT_DATABASE_URL: z
    .string()
    .url()
    .optional()
    .describe('Neon direct connection string (used by drizzle-kit for DDL migrations only)'),

  // ─── JWT ─────────────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for HS256')
    .describe('HMAC-SHA256 signing key for access tokens'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ─── Frontend (CORS) ──────────────────────────────────────────────────────────
  FRONTEND_URL: z
    .string()
    .url()
    .default('http://localhost:3001')
    .describe('Origin of the Next.js frontend — required for CORS'),

  // ─── Inngest (Background Jobs) ────────────────────────────────────────────────
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // ─── Cloudflare R2 (Storage) ─────────────────────────────────────────────────
  // Required from Task 2.x onward (asset attachments, import/export files).
  // NOT used for QR codes — generate on-the-fly in frontend.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // ─── Payment Gateway ─────────────────────────────────────────────────────────
  PAYMENT_GATEWAY_DRIVER: z.enum(['mock', 'midtrans', 'xendit']).default('mock'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate process.env.
 * Called once at app startup in src/index.ts.
 * Throws on failure — the app must not start with invalid configuration.
 */
export function validateEnv(rawEnv: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }

  return result.data;
}

// Singleton — parsed once at module load time after validateEnv() is called
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) throw new Error('[getEnv] Environment not initialized. Call validateEnv() first.');
  return _env;
}

export function initEnv(rawEnv?: Record<string, unknown>): Env {
  _env = validateEnv(rawEnv);
  return _env;
}
