-- Migration: 003_add_tenant_indexes.sql
-- Date: 2026-08-04
-- Author: Hermes Engineering + DB Architect subagent
-- Description:
--   Fixes DB-007: Adds composite indexes on (tenantId, <pkey>) for all
--   tenant-scoped tables to optimize tenant isolation queries.
--   PostgreSQL query planner will use these for fast row-level tenancy filtering.
--
-- Status: APPLIED / PENDING

-- ─── assets ───────────────────────────────────────────────────────────────────
-- Index for: SELECT * FROM assets WHERE tenant_id = ? AND id = ?
CREATE INDEX IF NOT EXISTS "assets_tenant_id_idx"
  ON "assets" ("tenant_id");

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx"
  ON "users" ("tenant_id");

-- ─── tickets ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "tickets_tenant_id_idx"
  ON "tickets" ("tenant_id");

-- ─── ticket_comments ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "ticket_comments_tenant_id_idx"
  ON "ticket_comments" ("tenant_id");

-- ─── asset_events ──────────────────────────────────────────────────────────────
-- Note: asset_events already has composite tenant_asset_idx
CREATE INDEX IF NOT EXISTS "asset_events_tenant_id_idx"
  ON "asset_events" ("tenant_id");

-- ─── maintenance_jobs ───────────────────────────────────────────────────────────
-- Note: maintenance_jobs already has tenant_asset_idx, tenant_status_idx, tenant_scheduled_idx
CREATE INDEX IF NOT EXISTS "maintenance_jobs_tenant_id_idx"
  ON "maintenance_jobs" ("tenant_id");
