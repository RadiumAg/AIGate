import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  getUserDailyUsage,
  getDailyUsage,
  resetUserQuota,
  checkQuota,
  getQuotaPolicyByApiKey,
} from '@/lib/quota';
import { redis, RedisKeys } from '@/lib/redis';
import { quotaPolicyDb } from '@/lib/database';

/**
 * 清除所有配额策略相关的 Redis 缓存
 * 包括 policy:userId:* 和 user_policy:* 两类缓存 key
 */
async function clearPolicyCacheKeys(): Promise<void> {
  try {
    const patterns = [RedisKeys.userPolicy('userId:*'), RedisKeys.userPolicy('user_policy:*')];

    for (const pattern of patterns) {
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        if (result.keys.length > 0) {
          await redis.del(result.keys);
        }
      } while (cursor !== 0);
    }
  } catch (error) {
    console.error('清除配额策略缓存失败:', error);
  }
}

export const quotaRouter = createTRPCRouter({
  getQuotaInfo: protectedProcedure
    .input(z.object({ userId: z.string(), apiKeyId: z.string() }))
    .query(async ({ input }) => {
      try {
        const policy = await getQuotaPolicyByApiKey(input.apiKeyId);
        // 使用新的 getDailyUsage 函数，支持 apiKey 参数
        const usage = await getDailyUsage({
          userId: input.userId,
          apiKey: input.apiKeyId,
        });
        const today = new Date().toISOString().split('T')[0];

        // 计算剩余配额
        let remaining;
        if (policy.limitType === 'token') {
          remaining = {
            type: 'token' as const,
            daily: policy.dailyTokenLimit ? policy.dailyTokenLimit - usage.tokensUsed : null,
            monthly: policy.monthlyTokenLimit ? policy.monthlyTokenLimit - usage.tokensUsed : null,
          };
        } else {
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
          message: '获取用户配额信息失败',
          cause: error,
        });
      }
    }),

  // 获取用户今日使用情况
  getUserUsage: protectedProcedure
    .input(z.object({ userId: z.string(), apiKeyId: z.string() }))
    .query(async ({ input }) => {
      try {
        const usage = await getUserDailyUsage(input.userId, input.apiKeyId);
        return usage;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取用户使用情况失败',
          cause: error,
        });
      }
    }),

  // 检查用户配额
  checkQuota: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        apiKeyId: z.string(),
        estimatedTokens: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { userId, apiKeyId } = input;
        // 使用新的 checkQuota 函数，支持 apiKey 参数
        const result = await checkQuota({ userId, apiKey: apiKeyId }, input.estimatedTokens);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '检查用户配额失败',
          cause: error,
        });
      }
    }),

  // 重置用户配额
  resetQuota: protectedProcedure
    .input(z.object({ userId: z.string(), apiKeyId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await resetUserQuota(input.userId, input.apiKeyId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '重置用户配额失败',
          cause: error,
        });
      }
    }),

  // 获取所有配额策略
  getAllPolicies: protectedProcedure.query(async () => {
    try {
      return await quotaPolicyDb.getAll();
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取配额策略列表失败',
        cause: error,
      });
    }
  }),

  // 创建配额策略
  createPolicy: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        limitType: z.enum(['token', 'request']).default('token'),
        dailyTokenLimit: z.number().optional(),
        monthlyTokenLimit: z.number().optional(),
        dailyRequestLimit: z.number().optional(),
        rpmLimit: z.number().default(60),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 验证：limitType 为 token 时，dailyTokenLimit 必须存在
        if (input.limitType === 'token' && !input.dailyTokenLimit) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Token 限制模式必须设置每日 Token 上限',
          });
        }
        // 验证：limitType 为 request 时，dailyRequestLimit 必须存在
        if (input.limitType === 'request' && !input.dailyRequestLimit) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '请求次数限制模式必须设置每日请求次数上限',
          });
        }
        return await quotaPolicyDb.create(input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建配额策略失败',
          cause: error,
        });
      }
    }),

  // 更新配额策略
  updatePolicy: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        limitType: z.enum(['token', 'request']).default('token'),
        dailyTokenLimit: z.number().optional(),
        monthlyTokenLimit: z.number().optional(),
        dailyRequestLimit: z.number().optional(),
        rpmLimit: z.number().default(60),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 验证：limitType 为 token 时，dailyTokenLimit 必须存在
        if (input.limitType === 'token' && !input.dailyTokenLimit) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Token 限制模式必须设置每日 Token 上限',
          });
        }
        // 验证：limitType 为 request 时，dailyRequestLimit 必须存在
        if (input.limitType === 'request' && !input.dailyRequestLimit) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '请求次数限制模式必须设置每日请求次数上限',
          });
        }

        const { id, ...rest } = input;
        const policy = await quotaPolicyDb.update(id, rest);
        if (!policy) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '配额策略不存在',
          });
        }

        await clearPolicyCacheKeys();

        return policy;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '更新配额策略失败',
          cause: error,
        });
      }
    }),

  // 删除配额策略
  deletePolicy: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await quotaPolicyDb.delete(input.id);
        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '配额策略不存在',
          });
        }

        await clearPolicyCacheKeys();

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '删除配额策略失败',
          cause: error,
        });
      }
    }),
});
