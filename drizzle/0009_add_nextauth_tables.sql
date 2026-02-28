ALTER TABLE users ADD COLUMN password text;
ALTER TABLE users ADD COLUMN email_verified timestamp with time zone;
ALTER TABLE users ADD COLUMN image text;

CREATE TABLE accounts (
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
  session_state text,
  CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  id text PRIMARY KEY NOT NULL,
  session_token text NOT NULL UNIQUE,
  user_id text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamp with time zone NOT NULL
);