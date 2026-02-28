import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ChatCompletionRequestSchema } from '@/lib/types';
import type { ChatCompletionRequest, ChatCompletionResponse, UsageRecord } from '@/lib/types';
import { checkQuota, recordUsage } from '@/lib/quota';
import { getProviderByModel, providers } from '@/lib/ai-providers';
import type { AIProvider } from '@/lib/ai-providers';
import { v4 as uuidv4 } from 'uuid';
import { getRegionFromRequest, extractClientIp } from '@/lib/ip-region';
import { ReadableStream } from 'stream/web';

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

  recordUsage(actualUsage, identifier).catch((error) => {
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

// Stream 请求处理 - 使用 provider 的 makeStreamRequest 方法
async function handleStreamRequest(params: RequestHandlerParams): Promise<ReadableStream> {
  const {
    apiKeyInfo,
    request,
    provider,
    requestId,
    identifier,
    region,
    clientIp,
    estimatedTokens,
  } = params;

  // 检查 provider 是否支持 stream
  if (!provider.makeStreamRequest) {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: `Provider ${provider.name} 暂不支持 stream 模式`,
    });
  }

  const promptTokens = Math.round(estimatedTokens * 0.7);
  let completionTokens = 0;
  let hasRecordedUsage = false;

  // 使用 provider 的 makeStreamRequest 方法创建流
  const sourceStream = await provider.makeStreamRequest(
    apiKeyInfo.key,
    request,
    apiKeyInfo.baseUrl
  );

  // 包装流以添加使用量记录和统一格式转换
  const wrappedStream = new ReadableStream({
    async start(controller) {
      const reader = sourceStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 直接转发 provider 的流数据（provider 已经格式化为 SSE 格式）
          controller.enqueue(value);

          // 尝试解析 token 使用量
          try {
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                const data = line.slice(6);
                const parsed = JSON.parse(data);
                // 统计 token（支持 OpenAI 格式）
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  completionTokens += Math.max(1, Math.ceil(content.length / 4));
                }
              }
            }
          } catch {
            // 解析失败不影响流继续
          }
        }

        controller.close();

        // 记录使用量
        if (!hasRecordedUsage) {
          hasRecordedUsage = true;
          const actualUsage: UsageRecord = {
            id: requestId,
            userId: identifier,
            requestId,
            model: request.model,
            provider: provider.name,
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            timestamp: new Date().toISOString(),
            cost: 0,
            region,
            clientIp,
          };

          recordUsage(actualUsage, identifier).catch((error) => {
            console.error('Failed to record usage:', error);
          });
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return wrappedStream;
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

        const provider = foundProvider;
        const apiKeyInfo = {
          key: apiKey.key,
          baseUrl: apiKey.baseUrl || undefined,
        };

        // 3. 估算 Token 消耗
        const estimatedTokens = provider.estimateTokens(request);

        // 4. 检查配额（使用 userId 作为标识符）
        const identifier = userId;
        const quotaCheck = await checkQuota({ email: identifier }, estimatedTokens);
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
