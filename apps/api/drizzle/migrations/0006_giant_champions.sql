CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'ready', 'in_progress', 'paused', 'completed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'MAINTENANCE_SCHEDULED' BEFORE 'MAINTENANCE_STARTED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'MAINTENANCE_PAUSED' BEFORE 'MAINTENANCE_FINISHED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'MAINTENANCE_RESUMED' BEFORE 'MAINTENANCE_FINISHED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'MAINTENANCE_CANCELLED' BEFORE 'RETIRED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'MAINTENANCE_NOTE_ADDED' BEFORE 'RETIRED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'MAINTENANCE_PART_ADDED' BEFORE 'RETIRED';--> statement-breakpoint
CREATE TABLE "maintenance_attachments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"maintenance_job_id" bigint NOT NULL,
	"attachment_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unq_maintenance_job_attachment" UNIQUE("maintenance_job_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "maintenance_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"asset_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "maintenance_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" date,
	"technician_id" bigint,
	"started_at" timestamp,
	"completed_at" timestamp,
	"labor_cost" numeric(12, 2) DEFAULT '0',
	"parts_cost" numeric(12, 2) DEFAULT '0',
	"vendor_cost" numeric(12, 2) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"total_cost" numeric(12, 2) DEFAULT '0',
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"maintenance_job_id" bigint NOT NULL,
	"author_id" bigint NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_parts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"maintenance_job_id" bigint NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"part_number" varchar(100),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_tasks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"maintenance_job_id" bigint NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_maintenance_job_id_maintenance_jobs_id_fk" FOREIGN KEY ("maintenance_job_id") REFERENCES "public"."maintenance_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_attachment_id_asset_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."asset_attachments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_notes" ADD CONSTRAINT "maintenance_notes_maintenance_job_id_maintenance_jobs_id_fk" FOREIGN KEY ("maintenance_job_id") REFERENCES "public"."maintenance_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_notes" ADD CONSTRAINT "maintenance_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_parts" ADD CONSTRAINT "maintenance_parts_maintenance_job_id_maintenance_jobs_id_fk" FOREIGN KEY ("maintenance_job_id") REFERENCES "public"."maintenance_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_maintenance_job_id_maintenance_jobs_id_fk" FOREIGN KEY ("maintenance_job_id") REFERENCES "public"."maintenance_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_jobs_tenant_asset_idx" ON "maintenance_jobs" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "maintenance_jobs_tenant_status_idx" ON "maintenance_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "maintenance_jobs_tenant_scheduled_idx" ON "maintenance_jobs" USING btree ("tenant_id","scheduled_date");