CREATE TYPE "public"."provider" AS ENUM('OPENAI', 'ANTHROPIC', 'GOOGLE', 'DEEPSEEK', 'MOONSHOT');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" "provider" NOT NULL,
	"key" text NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quota_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"daily_token_limit" integer NOT NULL,
	"monthly_token_limit" integer NOT NULL,
	"rpm_limit" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"cost" numeric(10, 6) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"quota_policy_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_quota_policy_id_quota_policies_id_fk" FOREIGN KEY ("quota_policy_id") REFERENCES "public"."quota_policies"("id") ON DELETE no action ON UPDATE no action;