CREATE TYPE "public"."whitelist_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "whitelist_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"pattern" text NOT NULL,
	"policy_name" text NOT NULL,
	"description" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"status" "whitelist_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
