import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { getUserQuotaPolicy, getUserDailyUsage, resetUserQuota, checkUserQuota } from '@/lib/quota';
import { redis, RedisKeys } from '@/lib/redis';
import { quotaPolicyDb } from '@/lib/database';

/**
 * 清除所有配额策略相关的 Redis 缓存
 * 包括 policy:email:* 和 user_policy:* 两类缓存 key
 */
async function clearPolicyCacheKeys(): Promise<void> {
  try {
    const patterns = ['policy:email:*', 'user_policy:*'];

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
  // 获取用户配额策略
  getUserPolicy: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const policy = await getUserQuotaPolicy(input.userId);
        return policy;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取用户配额策略失败',
          cause: error,
        });
      }
    }),

  // 设置用户配额策略
  setUserPolicy: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        policy: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          dailyTokenLimit: z.number(),
          monthlyTokenLimit: z.number(),
          rpmLimit: z.number().default(60),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { userId, policy } = input;

        // 将策略存储到 Redis 缓存
        const policyKey = RedisKeys.userPolicy(userId);
        await redis.setEx(policyKey, 24 * 60 * 60, JSON.stringify(policy)); // 缓存 24 小时

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '设置用户配额策略失败',
          cause: error,
        });
      }
    }),

  // 获取用户今日使用情况
  getUserUsage: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    try {
      const usage = await getUserDailyUsage(input.userId);
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
  checkQuota: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        estimatedTokens: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await checkUserQuota(input.userId, input.estimatedTokens);
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
  resetQuota: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await resetUserQuota(input.userId);
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
  getAllPolicies: publicProcedure.query(async () => {
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
  createPolicy: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        dailyTokenLimit: z.number(),
        monthlyTokenLimit: z.number(),
        rpmLimit: z.number().default(60),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await quotaPolicyDb.create(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建配额策略失败',
          cause: error,
        });
      }
    }),

  // 更新配额策略
  updatePolicy: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        dailyTokenLimit: z.number(),
        monthlyTokenLimit: z.number(),
        rpmLimit: z.number().default(60),
      })
    )
    .mutation(async ({ input }) => {
      try {
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
  deletePolicy: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
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
