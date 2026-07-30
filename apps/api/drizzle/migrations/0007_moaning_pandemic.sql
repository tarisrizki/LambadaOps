CREATE TYPE "public"."exception_category" AS ENUM('missing', 'unexpected', 'wrong_location', 'wrong_assignee', 'wrong_department', 'damaged', 'retired_found', 'duplicate_scan', 'unknown_qr');--> statement-breakpoint
CREATE TYPE "public"."inventory_item_status" AS ENUM('pending', 'found', 'missing', 'unexpected', 'damaged', 'requires_review');--> statement-breakpoint
CREATE TYPE "public"."inventory_session_status" AS ENUM('planned', 'ready', 'in_progress', 'paused', 'completed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'INVENTORY_STARTED' BEFORE 'RETIRED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'ASSET_VERIFIED' BEFORE 'RETIRED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'INVENTORY_COMPLETED' BEFORE 'RETIRED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'INVENTORY_CANCELLED' BEFORE 'RETIRED';--> statement-breakpoint
CREATE TABLE "inventory_exceptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"item_id" bigint NOT NULL,
	"category" "exception_category" NOT NULL,
	"description" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"session_id" bigint NOT NULL,
	"author_id" bigint NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocktaking_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"session_id" bigint NOT NULL,
	"asset_id" bigint NOT NULL,
	"expected_location_id" bigint,
	"expected_department_id" bigint,
	"expected_assigned_user_id" bigint,
	"expected_status" varchar(50),
	"expected_condition" varchar(50),
	"status" "inventory_item_status" DEFAULT 'pending' NOT NULL,
	"scanned_at" timestamp,
	"scanned_by" bigint,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocktaking_sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"location_id" bigint,
	"department_id" bigint,
	"status" "inventory_session_status" DEFAULT 'planned' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" bigint NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_exceptions" ADD CONSTRAINT "inventory_exceptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_exceptions" ADD CONSTRAINT "inventory_exceptions_item_id_stocktaking_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."stocktaking_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_notes" ADD CONSTRAINT "inventory_notes_session_id_stocktaking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stocktaking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_notes" ADD CONSTRAINT "inventory_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_items" ADD CONSTRAINT "stocktaking_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_items" ADD CONSTRAINT "stocktaking_items_session_id_stocktaking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stocktaking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_items" ADD CONSTRAINT "stocktaking_items_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_items" ADD CONSTRAINT "stocktaking_items_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_sessions" ADD CONSTRAINT "stocktaking_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_sessions" ADD CONSTRAINT "stocktaking_sessions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_sessions" ADD CONSTRAINT "stocktaking_sessions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktaking_sessions" ADD CONSTRAINT "stocktaking_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stocktaking_items_session_asset_idx" ON "stocktaking_items" USING btree ("session_id","asset_id");--> statement-breakpoint
CREATE INDEX "stocktaking_items_tenant_session_status_idx" ON "stocktaking_items" USING btree ("tenant_id","session_id","status");--> statement-breakpoint
CREATE INDEX "stocktaking_sessions_tenant_status_idx" ON "stocktaking_sessions" USING btree ("tenant_id","status");