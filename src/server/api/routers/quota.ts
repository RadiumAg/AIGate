import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { getUserDailyUsage, resetUserQuota } from '@/lib/quota';
import { redis, RedisKeys } from '@/lib/redis';
import { getTodayString } from '@/lib/date';
import { quotaPolicyDb, whitelistRuleDb } from '@/lib/database';
import { extractClientIp } from '@/lib/ip-region';

/**
 *
 *  更新策略后清空用户今天请求的配额
 *
 */
async function clearTodayPolicy(apiKey: string): Promise<void> {
  try {
    const today = getTodayString();
    const patterns = [
      RedisKeys.userDailyQuota('*', apiKey, today),
      RedisKeys.userDailyRequests('*', apiKey, today),
    ];

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
  // 获取用户今日使用情况
  getUserUsage: protectedProcedure
    .input(z.object({ userId: z.string(), apiKeyId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { apiKeyId, userId } = input;
        const clientIp = ctx.req ? extractClientIp(ctx.req) : undefined;
        const validationResult = await whitelistRuleDb.validateUserByApiKey(
          apiKeyId,
          userId,
          clientIp
        );
        const usage = await getUserDailyUsage(
          validationResult.generatedUserId || '',
          input.apiKeyId
        );
        return usage;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取用户使用情况失败',
          cause: error,
        });
      }
    }),

  // 重置用户配额
  resetQuota: protectedProcedure
    .input(z.object({ userId: z.string(), apiKeyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { apiKeyId, userId } = input;
      try {
        const clientIp = ctx.req ? extractClientIp(ctx.req) : undefined;
        const validationResult = await whitelistRuleDb.validateUserByApiKey(
          apiKeyId,
          userId,
          clientIp
        );
        await resetUserQuota(validationResult.generatedUserId || '', apiKeyId);
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

        await clearTodayPolicy('*');

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

        await clearTodayPolicy('*');

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
