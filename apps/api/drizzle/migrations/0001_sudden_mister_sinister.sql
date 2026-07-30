CREATE TYPE "public"."asset_condition" AS ENUM('good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'repair', 'lost', 'retired', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."assignment_type" AS ENUM('individual', 'shared', 'unassigned');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" bigint NOT NULL,
	"asset_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" bigint NOT NULL,
	"location_id" bigint NOT NULL,
	"department_id" bigint,
	"current_assigned_user_id" bigint,
	"assignment_type" "assignment_type" DEFAULT 'unassigned' NOT NULL,
	"brand" varchar(100),
	"serial_number" varchar(100),
	"purchase_date" date,
	"purchase_price" numeric(12, 2),
	"warranty_end" date,
	"status" "asset_status" DEFAULT 'active' NOT NULL,
	"condition" "asset_condition" DEFAULT 'good' NOT NULL,
	"qr_code_token" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assets_qr_code_token_unique" UNIQUE("qr_code_token"),
	CONSTRAINT "assets_tenant_id_asset_code_unique" UNIQUE("tenant_id","asset_code")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_assigned_user_id_users_id_fk" FOREIGN KEY ("current_assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;