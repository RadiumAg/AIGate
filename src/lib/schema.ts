import { pgTable, text, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
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

// 配额策略表
export const quotaPolicies = pgTable('quota_policies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  dailyTokenLimit: integer('daily_token_limit').notNull(),
  monthlyTokenLimit: integer('monthly_token_limit').notNull(),
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
  userId: text('user_id').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  cost: decimal('cost', { precision: 10, scale: 6 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 白名单规则表
export const whitelistRules = pgTable('whitelist_rules', {
  id: text('id').primaryKey(),
  policyName: text('policy_name').notNull(),
  description: text('description'),
  priority: integer('priority').notNull().default(1),
  status: whitelistStatusEnum('status').default('active').notNull(),
  validationPattern: text('validation_pattern'),
  validationEnabled: integer('validation_enabled').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
