import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ChatCompletionRequestSchema, UsageRecord, IdentifyBy } from '@/lib/types';
import { checkQuota, recordUsage, extractIdentifier } from '@/lib/quota';
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
        email: z.string().email().optional(),
        userId: z.string().optional(),
        ip: z.string().optional(),
        origin: z.string().optional(),
        apiKeyId: z.string().optional(),
        request: ChatCompletionRequestSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { email, userId, ip, origin, apiKeyId, request } = input;
      const requestId = uuidv4();

      // 至少需要一种标识信息
      if (!email && !userId && !ip && !origin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '必须提供 email、userId、ip 或 origin 中的至少一个',
        });
      }

      try {
        let provider: AIProvider;
        let apiKeyInfo: { key: string; baseUrl?: string } | null;

        if (apiKeyId) {
          // 1. 根据 API Key ID 获取具体的 API Key 信息
          const { apiKeyDb } = await import('../../../lib/database');
          const apiKey = await apiKeyDb.getById(apiKeyId);

          if (!apiKey || apiKey.status !== 'ACTIVE') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'API Key 不存在或已禁用',
            });
          }

          // 2. 根据 API Key 的 provider 获取对应的 AI 提供商
          const providerKey = apiKey.provider.toLowerCase();
          const foundProvider = providers[providerKey];

          if (!foundProvider) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `不支持的提供商: ${apiKey.provider}`,
            });
          }

          provider = foundProvider;

          // 3. 使用指定的 API Key
          apiKeyInfo = {
            key: apiKey.key,
            baseUrl: apiKey.baseUrl || undefined,
          };
        } else {
          // 兼容旧版本：根据模型名称推断 provider
          const foundProvider = getProviderByModel(request.model);
          if (!foundProvider) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `不支持的模型: ${request.model}`,
            });
          }

          provider = foundProvider;

          // 获取该 provider 的默认 API Key
          apiKeyInfo = await getApiKeyWithBaseUrl(provider.name);
          if (!apiKeyInfo) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `${provider.name} API Key 未配置`,
            });
          }
        }

        // 4. 估算 Token 消耗
        const estimatedTokens = provider.estimateTokens(request);

        // 5. 检查配额（传入所有标识信息，由策略的 identifyBy 决定使用哪个）
        const requestInfo = { email, userId, ip, origin };
        const quotaCheck = await checkQuota(requestInfo, estimatedTokens);
        if (!quotaCheck.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: quotaCheck.reason || '配额已用完',
          });
        }

        // 根据策略的 identifyBy 提取实际使用的标识符
        const policyIdentifyBy: IdentifyBy = (quotaCheck.policy?.identifyBy ||
          'email') as IdentifyBy;
        const identifier = extractIdentifier(requestInfo, policyIdentifyBy);

        // 6. 调用 AI 服务（使用 API Key 中的 baseUrl）
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
          cost: 0, // 这里可以根据不同模型计算成本
        };

        // 异步记录使用量，不阻塞响应
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
