/**
 * Seed script — LambadaOps Plans
 *
 * Idempotent: uses ON CONFLICT (code) DO NOTHING.
 * Safe to run multiple times without side effects.
 *
 * Run: bun run db:seed
 *
 * IMPORTANT — Execution order:
 * This script must be run AFTER db:migrate.
 * Roles seed (when added) must run BEFORE this script.
 */
import { initEnv } from '../lib/env.js';
initEnv(); // Initialize env before db
const { db } = await import('./index.js');
import { plans } from './schema/billing.schema.js';

const PLAN_SEED_DATA = [
  {
    code: 'free',
    name: 'Free',
    priceMonthly: 0,
    assetLimit: 50,
    userLimit: 5,
    features: { trialDays: 14 },
  },
  {
    code: 'pro',
    name: 'Pro',
    priceMonthly: 299000,
    assetLimit: 500,
    userLimit: 25,
    features: { trialDays: 0 },
  },
  {
    code: 'business',
    name: 'Business',
    priceMonthly: 799000,
    assetLimit: null,
    userLimit: null,
    features: { trialDays: 0 },
  },
] as const;

async function seedPlans() {
  console.log('Seeding plans...');

  for (const plan of PLAN_SEED_DATA) {
    await db
      .insert(plans)
      .values(plan)
      // Conflict target: `code` (immutable canonical identifier — not primary key)
      .onConflictDoNothing({ target: plans.code });

    console.log(`  ✓ plan '${plan.code}' seeded (or already exists)`);
  }

  console.log('Plans seed complete.');
}

seedPlans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
