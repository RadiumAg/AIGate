-- 回退：从 quota_policies 移除错误添加的字段
ALTER TABLE "quota_policies" DROP COLUMN IF EXISTS "identify_by";--> statement-breakpoint
ALTER TABLE "quota_policies" DROP COLUMN IF EXISTS "validation_pattern";--> statement-breakpoint
ALTER TABLE "quota_policies" DROP COLUMN IF EXISTS "validation_enabled";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."identify_by";--> statement-breakpoint
-- 新增：在 whitelist_rules 上添加校验规则字段
ALTER TABLE "whitelist_rules" ADD COLUMN "validation_pattern" text;--> statement-breakpoint
ALTER TABLE "whitelist_rules" ADD COLUMN "validation_enabled" integer DEFAULT 0 NOT NULL;