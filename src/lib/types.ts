import { z } from 'zod';

// 配额策略类型
export const QuotaPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dailyTokenLimit: z.number(),
  monthlyTokenLimit: z.number(),
  rpmLimit: z.number().default(60),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type QuotaPolicy = z.infer<typeof QuotaPolicySchema>;

// API Key 类型
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1, '名称不能为空'),
  provider: z.enum(['openai', 'anthropic', 'google', 'deepseek', 'moonshot', 'spark']),
  key: z.string().min(1, 'API Key 不能为空'),
  baseUrl: z.string().optional(),
  status: z.enum(['active', 'disabled']).default('active'),
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

// AI 请求类型
export const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional(),
});

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
