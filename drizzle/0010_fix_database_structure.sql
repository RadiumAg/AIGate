-- 安全的数据库结构修复迁移
-- 使用 IF NOT EXISTS 条件避免重复创建

-- 创建缺失的枚举类型
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'limit_type') THEN
        CREATE TYPE "public"."limit_type" AS ENUM('token', 'request');
    END IF;
END $$;

-- 创建或更新 users 表
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"quota_policy_id" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- 创建 NextAuth 相关表
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);

-- 安全地修改 quota_policies 表结构
DO $$ 
BEGIN
    -- 修改列的 nullable 状态
    ALTER TABLE "quota_policies" ALTER COLUMN "daily_token_limit" DROP NOT NULL;
    ALTER TABLE "quota_policies" ALTER COLUMN "monthly_token_limit" DROP NOT NULL;
    
    -- 添加新列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quota_policies' AND column_name = 'limit_type') THEN
        ALTER TABLE "quota_policies" ADD COLUMN "limit_type" text DEFAULT 'token' NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quota_policies' AND column_name = 'daily_request_limit') THEN
        ALTER TABLE "quota_policies" ADD COLUMN "daily_request_limit" integer;
    END IF;
END $$;

-- 安全地添加外键约束
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'accounts_user_id_users_id_fk') THEN
        ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sessions_user_id_users_id_fk') THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;