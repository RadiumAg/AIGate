-- 修复迁移冲突和外键约束问题
-- 这个迁移文件用于解决由于重复迁移编号导致的数据库状态不一致问题

-- 首先检查并添加缺失的列（如果它们还不存在）
DO $$ 
BEGIN
    -- 检查并添加 users 表中的新列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified timestamp with time zone;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'image') THEN
        ALTER TABLE users ADD COLUMN image text;
    END IF;
    
    -- 检查并添加 quota_policies 表中的新列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quota_policies' AND column_name = 'daily_request_limit') THEN
        ALTER TABLE quota_policies ADD COLUMN daily_request_limit integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quota_policies' AND column_name = 'limit_type') THEN
        ALTER TABLE quota_policies ADD COLUMN limit_type text NOT NULL DEFAULT 'token';
        ALTER TABLE quota_policies ADD CONSTRAINT quota_policies_limit_type_check CHECK (limit_type IN ('token', 'request'));
    END IF;
END $$;

-- 安全地创建 NextAuth 相关表（如果它们还不存在）
CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY NOT NULL,
  session_token text NOT NULL UNIQUE,
  user_id text NOT NULL,
  expires timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamp with time zone NOT NULL
);

-- 安全地添加外键约束（如果它们还不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'accounts_user_id_users_id_fk') THEN
        ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sessions_user_id_users_id_fk') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;