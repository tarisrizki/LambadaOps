-- Migration: 004_fix_asset_identities.sql
-- Date: 2026-08-04
-- Author: Hermes Engineering + DB Architect subagent
-- Description:
--   Fixes DB-002: Adds unique composite index on (tenant_id, token) for
--   asset_identities table to prevent cross-tenant token collisions and
--   enforce per-tenant token uniqueness.
--
-- Status: APPLIED / PENDING

-- ─── asset_identities tenantId constraint ──────────────────────────────────────
-- Make tenantId NOT NULL and add FK if not already set
ALTER TABLE "asset_identities"
  ALTER COLUMN "tenant_id" SET NOT NULL;

-- The FK reference to tenants.id already exists (added by subagent migration).

-- ─── asset_identities unique index (tenant, token) ──────────────────────────────
-- Prevents a token value from being reused across different tenants
CREATE UNIQUE INDEX IF NOT EXISTS "asset_identities_tenant_token_unique"
  ON "asset_identities" ("tenant_id", "token");

-- ─── identity_scans cascade ────────────────────────────────────────────────────
-- Ensure identity scans cascade when asset_identity is deleted
ALTER TABLE "identity_scans"
  DROP CONSTRAINT IF EXISTS "identity_scans_identity_id_fk";

ALTER TABLE "identity_scans"
  ADD CONSTRAINT "identity_scans_identity_id_bigint_fk"
  FOREIGN KEY ("identity_id") REFERENCES "asset_identities"("id") ON DELETE CASCADE;

-- ─── identity_print_job_items cascade ─────────────────────────────────────────
ALTER TABLE "identity_print_job_items"
  DROP CONSTRAINT IF EXISTS "identity_print_job_items_identity_id_fk";

ALTER TABLE "identity_print_job_items"
  ADD CONSTRAINT "identity_print_job_items_identity_id_bigint_fk"
  FOREIGN KEY ("identity_id") REFERENCES "asset_identities"("id") ON DELETE CASCADE;
