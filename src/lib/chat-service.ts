import { providers } from '@/lib/ai-providers';
import { v4 as uuidv4 } from 'uuid';
import { getRegionFromRequest, extractClientIp } from '@/lib/ip-region';
import type { UsageRecord } from '@/lib/types';
import { apiKeyDb } from '@/lib/database';
import { checkQuota, recordUsage } from '@/lib/quota';

// 通用对象类型
export type AnyObject = Record<string, any>;

// 请求接口
export interface ChatRequest {
  model: string;
  messages: AnyObject[];
  [key: string]: any;
}

// 请求上下文接口
export interface RequestContext {
  userId: string;
  apiKeyId: string;
  clientIp: string;
  region: string;
  requestId: string;
}

// 验证结果接口
export interface ValidationResult {
  valid: boolean;
  reason?: string;
  generatedUserId?: string;
}

// API Key信息接口
export interface ApiKeyInfo {
  key: string;
  baseUrl?: string;
  provider: string;
  providerInstance: AnyObject;
}

// 使用量统计接口
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * 验证请求的公共逻辑
 */
export async function validateRequest(
  apiKeyId: string,
  userId: string,
  clientIp: string
): Promise<{
  context: RequestContext;
  apiKeyInfo: ApiKeyInfo;
  validationResult: ValidationResult;
}> {
  // 生成请求上下文
  const context: RequestContext = {
    userId,
    apiKeyId,
    clientIp,
    region: 'Unknown', // 将在调用时传入实际值
    requestId: uuidv4(),
  };

  // 1. 根据 apiKeyId 获取白名单规则
  const { whitelistRuleDb } = await import('@/lib/database');
  const whitelistRule = await whitelistRuleDb.getByApiKeyId(apiKeyId);

  if (!whitelistRule || whitelistRule.status !== 'active') {
    throw new Error('该 API Key 未绑定有效的白名单规则');
  }

  // 2. 根据白名单规则校验 userId 格式
  const validationResult = await whitelistRuleDb.validateUserByApiKey(apiKeyId, userId, clientIp);

  if (!validationResult.valid) {
    throw new Error(validationResult.reason || '用户校验未通过');
  }

  // 3. 获取 API Key 和 Provider
  const apiKey = await apiKeyDb.getById(apiKeyId);

  if (!apiKey || apiKey.status !== 'ACTIVE') {
    throw new Error('API Key 不存在或已禁用');
  }

  const providerKey = apiKey.provider.toLowerCase();
  const foundProvider = providers[providerKey];

  if (!foundProvider) {
    throw new Error(`不支持的提供商: ${apiKey.provider}`);
  }

  const apiKeyInfo: ApiKeyInfo = {
    key: apiKey.key,
    baseUrl: apiKey.baseUrl || undefined,
    provider: apiKey.provider,
    providerInstance: foundProvider,
  };

  return {
    context: {
      ...context,
      userId: validationResult.generatedUserId || userId,
    },
    apiKeyInfo,
    validationResult,
  };
}

/**
 * 检查配额
 */
export async function checkRequestQuota(
  userId: string,
  apiKeyId: string,
  request: any,
  provider: any
): Promise<{ allowed: boolean; reason?: string }> {
  const estimatedTokens = provider.estimateTokens(request);

  return await checkQuota({ userId, apiKey: apiKeyId }, estimatedTokens);
}

/**
 * 记录使用量
 */
export async function recordRequestUsage(
  usage: TokenUsage,
  context: RequestContext,
  model: string,
  providerName: string
): Promise<void> {
  const actualUsage: UsageRecord = {
    id: context.requestId,
    userId: context.userId,
    requestId: context.requestId,
    model,
    provider: providerName,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    timestamp: new Date().toISOString(),
    cost: 0,
    region: context.region,
    clientIp: context.clientIp,
  };

  await recordUsage(actualUsage, context.apiKeyId, context.userId);
}

/**
 * 估算 Prompt Tokens
 */
export function estimatePromptTokens(request: any, provider: any): number {
  return Math.round(provider.estimateTokens(request) * 0.7);
}

/**
 * 从流式响应中统计 Completion Tokens
 */
export function calculateCompletionTokensFromStream(chunks: string[]): number {
  let completionTokens = 0;

  for (const chunk of chunks) {
    try {
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          const data = line.slice(6);
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            completionTokens += Math.max(1, Math.ceil(content.length / 4));
          }
        }
      }
    } catch {
      // 忽略解析错误
    }
  }

  return completionTokens;
}

/**
 * 从非流式响应中提取 Completion Tokens
 */
export function calculateCompletionTokensFromResponse(response: any): {
  content: string;
  tokens: number;
} {
  let content = '';
  let tokens = 0;

  if (
    response.choices &&
    response.choices[0] &&
    response.choices[0].message &&
    response.choices[0].message.content
  ) {
    content = response.choices[0].message.content as string;
    tokens = Math.max(1, Math.ceil(content.length / 4));
  }

  return { content, tokens };
}

/**
 * 构造 OpenAI 标准响应格式
 */
export function createOpenAIResponse(
  requestId: string,
  model: string,
  content: string,
  usage: TokenUsage
) {
  return {
    id: `chatcmpl-${requestId}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
    },
  };
}

/**
 * 转换为 OpenAI 流式响应格式
 */
export function convertToOpenAIStreamFormat(chunk: string): any[] {
  const openAIChunks: any[] = [];

  try {
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = line.slice(6);
        const parsed = JSON.parse(data);

        const openAIChunk = {
          id: parsed.id || `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: parsed.model || 'gpt-3.5-turbo',
          choices: [
            {
              index: 0,
              delta: {
                content: parsed.choices?.[0]?.delta?.content || '',
              },
              finish_reason: parsed.choices?.[0]?.finish_reason || null,
            },
          ],
        };

        openAIChunks.push(openAIChunk);
      }
    }
  } catch (error) {
    console.warn('Failed to parse stream chunk:', error);
  }

  return openAIChunks;
}
