ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "usage_records" DROP CONSTRAINT "usage_records_user_id_users_id_fk";
