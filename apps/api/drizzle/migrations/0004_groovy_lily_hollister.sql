CREATE TABLE "asset_attachments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"asset_id" bigint NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"attachment_type" "attachment_type" DEFAULT 'other' NOT NULL,
	"uploaded_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "asset_attachments_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;