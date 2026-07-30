CREATE TYPE "public"."attachment_type" AS ENUM('photo', 'invoice', 'manual', 'certificate', 'warranty', 'other');--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'ATTACHMENT_UPLOADED';--> statement-breakpoint
ALTER TYPE "public"."asset_event_type" ADD VALUE 'ATTACHMENT_DELETED';--> statement-breakpoint
DROP TABLE "asset_attachments" CASCADE;