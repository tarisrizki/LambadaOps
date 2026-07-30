CREATE TYPE "public"."identity_medium" AS ENUM('qr', 'barcode', 'nfc', 'rfid', 'ble', 'manual');--> statement-breakpoint
CREATE TYPE "public"."identity_status" AS ENUM('generated', 'printed', 'attached', 'active', 'replaced', 'revoked', 'archived');--> statement-breakpoint
CREATE TYPE "public"."print_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'QR_REVOKED' BEFORE 'IMPORTED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'QR_SCANNED' BEFORE 'IMPORTED';--> statement-breakpoint
CREATE TABLE "asset_identities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"asset_id" bigint NOT NULL,
	"medium" "identity_medium" DEFAULT 'qr' NOT NULL,
	"token" varchar(255) NOT NULL,
	"hash" varchar(255) NOT NULL,
	"status" "identity_status" DEFAULT 'generated' NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_identities_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "identity_print_job_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"print_job_id" bigint NOT NULL,
	"identity_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_print_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"created_by" bigint NOT NULL,
	"status" "print_job_status" DEFAULT 'pending' NOT NULL,
	"format" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "identity_scans" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"identity_id" bigint,
	"scanned_token" varchar(255) NOT NULL,
	"user_id" bigint,
	"ip_address" varchar(45),
	"user_agent" text,
	"latitude" varchar(50),
	"longitude" varchar(50),
	"is_successful" boolean DEFAULT false NOT NULL,
	"failure_reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_identities" ADD CONSTRAINT "asset_identities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_identities" ADD CONSTRAINT "asset_identities_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_print_job_items" ADD CONSTRAINT "identity_print_job_items_print_job_id_identity_print_jobs_id_fk" FOREIGN KEY ("print_job_id") REFERENCES "public"."identity_print_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_print_job_items" ADD CONSTRAINT "identity_print_job_items_identity_id_asset_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."asset_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_print_jobs" ADD CONSTRAINT "identity_print_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_print_jobs" ADD CONSTRAINT "identity_print_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_scans" ADD CONSTRAINT "identity_scans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_scans" ADD CONSTRAINT "identity_scans_identity_id_asset_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."asset_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_scans" ADD CONSTRAINT "identity_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_identities_tenant_asset_idx" ON "asset_identities" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_identities_token_idx" ON "asset_identities" USING btree ("token");--> statement-breakpoint
CREATE INDEX "identity_scans_identity_idx" ON "identity_scans" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "identity_scans_created_at_idx" ON "identity_scans" USING btree ("created_at");