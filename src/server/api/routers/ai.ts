import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ChatCompletionRequestSchema, UsageRecord } from '@/lib/types';
import { checkQuota, recordUsage } from '@/lib/quota';
import {
  getProviderByModel,
  getApiKeyWithBaseUrl,
  providers,
  type AIProvider,
} from '@/lib/ai-providers';
import { v4 as uuidv4 } from 'uuid';

export const aiRouter = createTRPCRouter({
  // 聊天完成接口 - 核心的 AI 代理功能
  chatCompletion: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        email: z.string().email().optional(),
        apiKeyId: z.string().optional(),
        request: ChatCompletionRequestSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { userId, email, apiKeyId, request } = input;
      const requestId = uuidv4();

      try {
        // 1. 根据 userId 匹配白名单规则并校验
        const { whitelistRuleDb } = await import('../../../lib/database');
        const validationResult = await whitelistRuleDb.validateUserById(userId);

        if (!validationResult.valid) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: validationResult.reason || '用户校验未通过',
          });
        }

        // 2. 获取 API Key 和 Provider
        let provider: AIProvider;
        let apiKeyInfo: { key: string; baseUrl?: string } | null;

        if (apiKeyId) {
          const { apiKeyDb } = await import('../../../lib/database');
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

          provider = foundProvider;
          apiKeyInfo = {
            key: apiKey.key,
            baseUrl: apiKey.baseUrl || undefined,
          };
        } else {
          const foundProvider = getProviderByModel(request.model);
          if (!foundProvider) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `不支持的模型: ${request.model}`,
            });
          }

          provider = foundProvider;
          apiKeyInfo = await getApiKeyWithBaseUrl(provider.name);
          if (!apiKeyInfo) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `${provider.name} API Key 未配置`,
            });
          }
        }

        // 3. 估算 Token 消耗
        const estimatedTokens = provider.estimateTokens(request);

        // 4. 检查配额（使用 userId 或 email 作为标识符）
        const identifier = email || userId;
        const quotaCheck = await checkQuota({ email: identifier }, estimatedTokens);
        if (!quotaCheck.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: quotaCheck.reason || '配额已用完',
          });
        }

        // 5. 调用 AI 服务
        const startTime = Date.now();
        const response = await provider.makeRequest(apiKeyInfo.key, request, apiKeyInfo.baseUrl);
        const endTime = Date.now();

        // 6. 记录实际使用量
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
        };

        recordUsage(actualUsage, identifier).catch((error) => {
          console.error('Failed to record usage:', error);
        });

        // 7. 返回响应
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
    const { providers } = await import('../../../lib/ai-providers');

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
});
