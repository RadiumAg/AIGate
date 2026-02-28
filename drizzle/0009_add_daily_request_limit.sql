-- 添加每日请求次数限制字段
ALTER TABLE "quota_policies" ADD COLUMN "daily_request_limit" integer;

-- 添加限制类型字段 (token 或 request)
ALTER TABLE "quota_policies" ADD COLUMN "limit_type" text NOT NULL DEFAULT 'token';

-- 添加检查约束，确保 limit_type 只能是 'token' 或 'request'
ALTER TABLE "quota_policies" ADD CONSTRAINT "quota_policies_limit_type_check" CHECK (limit_type IN ('token', 'request'));
