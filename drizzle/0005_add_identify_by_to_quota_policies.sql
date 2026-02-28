CREATE TYPE "public"."identify_by" AS ENUM('ip', 'origin', 'email', 'userId');--> statement-breakpoint
ALTER TABLE "quota_policies" ADD COLUMN "identify_by" "identify_by" DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "quota_policies" ADD COLUMN "validation_pattern" text;--> statement-breakpoint
ALTER TABLE "quota_policies" ADD COLUMN "validation_enabled" integer DEFAULT 0 NOT NULL;