import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 枚举定义
export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED']);
export const providerEnum = pgEnum('provider', [
  'OPENAI',
  'ANTHROPIC',
  'GOOGLE',
  'DEEPSEEK',
  'MOONSHOT',
  'SPARK',
]);
export const whitelistStatusEnum = pgEnum('whitelist_status', ['active', 'inactive']);

// 限制类型枚举
export const limitTypeEnum = pgEnum('limit_type', ['token', 'request']);

// 配额策略表
export const quotaPolicies = pgTable('quota_policies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  limitType: text('limit_type').notNull().default('token'), // 'token' 或 'request'
  dailyTokenLimit: integer('daily_token_limit'),
  monthlyTokenLimit: integer('monthly_token_limit'),
  dailyRequestLimit: integer('daily_request_limit'), // 新增：每日请求次数限制
  rpmLimit: integer('rpm_limit').notNull().default(60),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API 密钥表
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: providerEnum('provider').notNull(),
  key: text('key').notNull(),
  baseUrl: text('base_url'), // AI 服务商的自定义 baseUrl
  status: statusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用量记录表
export const usageRecords = pgTable('usage_records', {
  id: text('id').primaryKey(),
  apiKey: text('api_key').notNull(),
  userId: text('user_id').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  cost: decimal('cost', { precision: 10, scale: 6 }).notNull(),
  region: text('region'),
  clientIp: text('client_ip'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 用户表
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'), // 用于凭证登录
  role: roleEnum('role').default('USER').notNull(),
  status: statusEnum('status').default('ACTIVE').notNull(),
  quotaPolicyId: text('quota_policy_id').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 白名单规则表
export const whitelistRules = pgTable('whitelist_rules', {
  id: text('id').primaryKey(),
  policyName: text('policy_name').notNull(),
  description: text('description'),
  priority: integer('priority').notNull().default(1),
  status: whitelistStatusEnum('status').default('active').notNull(),
  validationPattern: text('validation_pattern'),
  userIdPattern: text('user_id_pattern'), // 用于校验传入 userId 格式的正则表达式
  validationEnabled: integer('validation_enabled').notNull().default(0),
  apiKeyId: text('api_key_id'), // 关联的 API Key ID
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NextAuth.js 相关表
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull().unique(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// 关系定义
export const whitelistRulesRelations = relations(whitelistRules, ({ one }) => ({
  quotaPolicy: one(quotaPolicies, {
    fields: [whitelistRules.policyName],
    references: [quotaPolicies.name],
  }),
}));

// 类型导出
export type QuotaPolicy = typeof quotaPolicies.$inferSelect;
export type NewQuotaPolicy = typeof quotaPolicies.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
export type WhitelistRule = typeof whitelistRules.$inferSelect;
export type NewWhitelistRule = typeof whitelistRules.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
