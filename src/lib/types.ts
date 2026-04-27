import { z } from 'zod';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// 配额策略类型
export const QuotaPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  limitType: z.enum(['token', 'request']).default('token'), // 'token' 或 'request'
  dailyTokenLimit: z.number().optional(),
  monthlyTokenLimit: z.number().optional(),
  dailyRequestLimit: z.number().optional(), // 新增：每日请求次数限制
  rpmLimit: z.number().default(60),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type QuotaPolicy = z.infer<typeof QuotaPolicySchema>;

// API Key 类型
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1, '名称不能为空'),
  provider: z.enum(['openai', 'deepseek', 'moonshot', 'spark', 'kimi', 'minimax']),
  key: z.string().min(1, 'API Key 不能为空'),
  baseUrl: z.string().optional(),
  defaultModel: z.string().optional(), // 默认模型，优先于用户传递的 model
  status: z.enum(['active', 'disabled']).default('active'),
  // 定价相关
  promptPrice: z.number().optional(),
  completionPrice: z.number().optional(),
  createdAt: z.string(),
  lastUsed: z.string().optional(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// 用户类型
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'user', 'vip']),
  status: z.enum(['active', 'inactive']),
  quotaPolicyId: z.string(),
  createdAt: z.string(),
  lastActive: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

// AI 请求类型（OpenAI Chat Completion 兼容格式，passthrough 透传未知字段）
export const ChatCompletionRequestSchema = z
  .object({
    model: z.string(),
    messages: z.custom<ChatCompletionMessageParam[]>((v) => Array.isArray(v)), // 透传消息体，兼容 OpenAI SDK 类型
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
    stream: z.boolean().optional(),
  })
  .loose();

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

// 用量记录类型
export const UsageRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requestId: z.string(),
  model: z.string(),
  provider: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  timestamp: z.string(),
  cost: z.number().optional(),
  region: z.string().optional(),
  clientIp: z.string().optional(),
});

export type UsageRecord = z.infer<typeof UsageRecordSchema>;

// 配额检查结果类型
export const QuotaCheckResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  remainingTokens: z.number().optional(),
  remainingRequests: z.number().optional(),
  policy: QuotaPolicySchema.optional(),
});

export type QuotaCheckResult = z.infer<typeof QuotaCheckResultSchema>;

// AI 响应类型
export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
    })
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;
