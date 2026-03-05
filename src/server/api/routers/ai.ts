import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ChatCompletionRequestSchema } from '@/lib/types';
import type { ChatCompletionRequest, ChatCompletionResponse, UsageRecord } from '@/lib/types';
import { checkQuota, recordUsage, getDailyUsage, getQuotaPolicyByApiKey } from '@/lib/quota';
import { getProviderByModel, providers } from '@/lib/ai-providers';
import type { AIProvider } from '@/lib/ai-providers';
import { v4 as uuidv4 } from 'uuid';
import { getRegionFromRequest, extractClientIp } from '@/lib/ip-region';
import { apiKeyDb, whitelistRuleDb } from '../../../lib/database';

// 请求处理参数类型
interface RequestHandlerParams {
  apiKeyInfo: { key: string; baseUrl?: string };
  request: ChatCompletionRequest;
  provider: AIProvider;
  requestId: string;
  identifier: string;
  startTime: number;
  quotaCheck: {
    allowed: boolean;
    reason?: string;
    remainingTokens?: number;
    remainingRequests?: number;
  };
  region?: string;
  clientIp?: string;
  estimatedTokens: number;
}

// Non-stream 请求处理
async function handleNonStreamRequest(
  params: RequestHandlerParams
): Promise<ChatCompletionResponse & { aigate_metadata: unknown }> {
  const {
    apiKeyInfo,
    request,
    provider,
    requestId,
    identifier,
    startTime,
    quotaCheck,
    region,
    clientIp,
    estimatedTokens,
  } = params;

  const response = await provider.makeRequest(apiKeyInfo.key, request, apiKeyInfo.baseUrl);
  const endTime = Date.now();

  // 记录实际使用量
  const actualUsage: UsageRecord = {
    id: requestId,
    userId: identifier,
    requestId,
    model: request.model,
    provider: provider.name,
    promptTokens: response.usage?.prompt_tokens || estimatedTokens * 0.7,
    completionTokens: response.usage?.completion_tokens || estimatedTokens * 0.3,
    totalTokens: response.usage?.total_tokens || estimatedTokens,
    timestamp: new Date().toISOString(),
    cost: 0,
    region,
    clientIp,
  };

  recordUsage(actualUsage, apiKeyInfo.key, identifier).catch((error) => {
    console.error('Failed to record usage:', error);
  });

  return {
    ...response,
    aigate_metadata: {
      requestId,
      provider: provider.name,
      processingTime: endTime - startTime,
      quotaRemaining: {
        tokens: quotaCheck.remainingTokens,
        requests: quotaCheck.remainingRequests,
      },
    },
  };
}

export const aiRouter = createTRPCRouter({
  // 聊天完成接口 - 支持 stream 和 non-stream 模式
  chatCompletion: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        apiKeyId: z.string(),
        request: ChatCompletionRequestSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, apiKeyId, request } = input;
      const isStream = request.stream === true;

      // 提取客户端 IP 并查询归属地省份
      const clientIp = ctx.req ? extractClientIp(ctx.req) : undefined;
      const region = ctx.req ? getRegionFromRequest(ctx.req) : undefined;
      const requestId = uuidv4();

      try {
        // 1. 根据 apiKeyId 获取白名单规则
        const whitelistRule = await whitelistRuleDb.getByApiKeyId(apiKeyId);

        if (!whitelistRule || whitelistRule.status !== 'active') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: '该 API Key 未绑定有效的白名单规则',
          });
        }

        // 2. 根据 apiKeyId 和 userId 进行白名单规则校验
        const validationResult = await whitelistRuleDb.validateUserByApiKey(
          apiKeyId,
          userId,
          clientIp
        );

        if (!validationResult.valid) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: validationResult.reason || '用户校验未通过',
          });
        }

        // 使用生成的 userId（如果有的话）
        const finalUserId = validationResult.generatedUserId || userId;

        // 3. 获取 API Key 和 Provider
        const apiKey = await apiKeyDb.getById(apiKeyId);

        if (!apiKey || apiKey.status !== 'ACTIVE') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'API Key 不存在或已禁用',
          });
        }

        const providerKey = apiKey.provider.toLowerCase();
        const foundProvider = providers[providerKey];

        if (!foundProvider) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `不支持的提供商: ${apiKey.provider}`,
          });
        }

        const provider = foundProvider;
        const apiKeyInfo = {
          key: apiKey.key,
          baseUrl: apiKey.baseUrl || undefined,
        };

        // 3. 估算 Token 消耗
        const estimatedTokens = provider.estimateTokens(request);

        // 4. 检查配额（使用 finalUserId + apiKeyId 组合作为标识符，确保不同 API Key 配额分开计算）
        const identifier = `${finalUserId}:${apiKeyId}`;
        const quotaCheck = await checkQuota(
          { userId: finalUserId, apiKey: apiKeyId },
          estimatedTokens
        );
        if (!quotaCheck.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: quotaCheck.reason || '配额已用完',
          });
        }

        // 5. 根据是否 stream 模式处理请求
        const startTime = Date.now();

        if (isStream) {
          // Stream 模式：应该使用 /api/ai/chat/stream 端点
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Stream 模式请使用 /api/ai/chat/stream 端点',
          });
        } else {
          // Non-stream 模式：返回完整响应
          return handleNonStreamRequest({
            apiKeyInfo,
            request,
            provider,
            requestId,
            identifier,
            startTime,
            quotaCheck,
            region,
            clientIp,
            estimatedTokens,
          });
        }
      } catch (error) {
        console.error('AI request failed:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '请求处理失败',
          cause: error,
        });
      }
    }),

  // 获取支持的模型列表
  getSupportedModels: publicProcedure.query(async () => {
    const models = Object.values(providers).flatMap((provider) =>
      provider.models.map((model) => ({
        model,
        provider: provider.name,
      }))
    );

    return models;
  }),

  // 估算请求的 Token 消耗
  estimateTokens: publicProcedure.input(ChatCompletionRequestSchema).query(async ({ input }) => {
    const provider = getProviderByModel(input.model);
    if (!provider) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `不支持的模型: ${input.model}`,
      });
    }

    const estimatedTokens = provider.estimateTokens(input);
    return { estimatedTokens };
  }),

  // 获取配额信息（包括剩余 Token 或请求次数）
  getQuotaInfo: publicProcedure
    .input(z.object({ userId: z.string(), apiKeyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, apiKeyId } = input;
        const clientIp = ctx.req ? extractClientIp(ctx.req) : undefined;
        // 优先通过 apiKeyId 获取配额策略
        const policy = await getQuotaPolicyByApiKey(input.apiKeyId);
        const validationResult = await whitelistRuleDb.validateUserByApiKey(
          apiKeyId,
          userId,
          clientIp
        );
        // 使用 finalUserId + apiKeyId 组合标识符查询配额使用情况
        const usage = await getDailyUsage({
          userId: validationResult.generatedUserId || userId,
          apiKey: input.apiKeyId,
        });
        const today = new Date().toISOString().split('T')[0];

        // 计算剩余配额
        let remaining;
        if (policy.limitType === 'token') {
          // Token 限制模式
          remaining = {
            type: 'token' as const,
            daily: policy.dailyTokenLimit ? policy.dailyTokenLimit - usage.tokensUsed : null,
            monthly: policy.monthlyTokenLimit ? policy.monthlyTokenLimit - usage.tokensUsed : null,
          };
        } else {
          // 请求次数限制模式
          remaining = {
            type: 'request' as const,
            daily: policy.dailyRequestLimit ? policy.dailyRequestLimit - usage.requestsToday : null,
          };
        }

        return {
          policy,
          usage: {
            tokensUsed: usage.tokensUsed,
            requestsToday: usage.requestsToday,
            date: today,
          },
          remaining,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取配额信息失败',
          cause: error,
        });
      }
    }),
});
