-- Migration: 002_fix_integer_ids.sql
-- Date: 2026-08-04
-- Author: Hermes Engineering + DB Architect subagent
-- Description:
--   Fixes DB-001: Normalizes all integer → bigint for tenant_id, user_id,
--   asset_id, ticket_id, author_id foreign key columns across all tables.
--   Also changes serial() → bigserial() for tickets and ticketComments to
--   match bigserial primary keys used throughout the schema.
--
-- Status: APPLIED / PENDING (run via drizzle-kit migrate)

-- ─── tickets ───────────────────────────────────────────────────────────────────

-- Drop existing FK constraints before altering column types
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "ticket_comments_tenant_id_tenants_id_fk";
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "ticket_comments_ticket_id_tickets_id_fk";
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "ticket_comments_author_id_users_id_fk";
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "ticket_comments_tenant_id_fkey";
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "ticket_comments_ticket_id_fkey";
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "ticket_comments_author_id_fkey";

ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_tenant_id_tenants_id_fk";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_asset_id_assets_id_fk";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_creator_id_users_id_fk";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_assigned_to_id_users_id_fk";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_tenant_id_fkey";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_asset_id_fkey";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_creator_id_fkey";
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_assigned_to_id_fkey";

-- Alter tickets.id from serial → bigserial
ALTER TABLE "tickets" ALTER COLUMN "id" SET DATA TYPE bigint;
ALTER TABLE "tickets" ALTER COLUMN "id" SET DEFAULT bigserial("id");

-- Alter tickets columns
ALTER TABLE "tickets" ALTER COLUMN "tenant_id" SET DATA TYPE bigint USING "tenant_id"::bigint;
ALTER TABLE "tickets" ALTER COLUMN "asset_id" SET DATA TYPE bigint USING "asset_id"::bigint;
ALTER TABLE "tickets" ALTER COLUMN "creator_id" SET DATA TYPE bigint USING "creator_id"::bigint;
ALTER TABLE "tickets" ALTER COLUMN "assigned_to_id" SET DATA TYPE bigint USING "assigned_to_id"::bigint;

-- Re-add constraints for tickets
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenant_id_bigint_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_asset_id_bigint_fk"
  FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creator_id_bigint_fk"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_id_bigint_fk"
  FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- ─── ticket_comments ───────────────────────────────────────────────────────────

-- Alter ticket_comments.id from serial → bigserial
ALTER TABLE "ticket_comments" ALTER COLUMN "id" SET DATA TYPE bigint;
ALTER TABLE "ticket_comments" ALTER COLUMN "id" SET DEFAULT bigserial("id");

-- Alter ticket_comments columns
ALTER TABLE "ticket_comments" ALTER COLUMN "tenant_id" SET DATA TYPE bigint USING "tenant_id"::bigint;
ALTER TABLE "ticket_comments" ALTER COLUMN "ticket_id" SET DATA TYPE bigint USING "ticket_id"::bigint;
ALTER TABLE "ticket_comments" ALTER COLUMN "author_id" SET DATA TYPE bigint USING "author_id"::bigint;

-- Re-add constraints for ticket_comments
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_tenant_id_bigint_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_bigint_fk"
  FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE;
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_bigint_fk"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;
