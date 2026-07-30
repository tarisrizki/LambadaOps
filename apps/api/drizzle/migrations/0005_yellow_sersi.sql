CREATE TYPE "public"."event_category" AS ENUM('LIFECYCLE', 'ASSIGNMENT', 'MAINTENANCE', 'ATTACHMENT', 'QR', 'INVENTORY', 'SECURITY', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."event_severity" AS ENUM('INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"actor_id" bigint,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_id" varchar(100),
	"correlation_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_events" ADD COLUMN "tenant_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_events" ADD COLUMN "category" "event_category" DEFAULT 'SYSTEM' NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_events" ADD COLUMN "severity" "event_severity" DEFAULT 'INFO' NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_events" ADD COLUMN "request_id" varchar(100);--> statement-breakpoint
ALTER TABLE "asset_events" ADD COLUMN "correlation_id" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_entity_idx" ON "audit_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_events_tenant_asset_idx" ON "asset_events" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_events_created_at_idx" ON "asset_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "asset_events_correlation_idx" ON "asset_events" USING btree ("correlation_id");--> statement-breakpoint
ALTER TABLE "public"."asset_events" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."asset_event_type";--> statement-breakpoint
CREATE TYPE "public"."asset_event_type" AS ENUM('CREATED', 'UPDATED', 'DELETED', 'ASSIGNED', 'TRANSFERRED', 'RETURNED', 'STATUS_CHANGED', 'MAINTENANCE_STARTED', 'MAINTENANCE_FINISHED', 'RETIRED', 'ATTACHMENT_UPLOADED', 'ATTACHMENT_DELETED', 'QR_GENERATED', 'QR_REPLACED', 'QR_PRINTED', 'IMPORTED', 'EXPORTED', 'BULK_UPDATE', 'BULK_DELETE');--> statement-breakpoint
ALTER TABLE "public"."asset_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."asset_event_type" USING "event_type"::"public"."asset_event_type";