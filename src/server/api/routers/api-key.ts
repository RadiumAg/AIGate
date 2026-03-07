import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ApiKeySchema } from '../../../lib/types';
import { redis, RedisKeys } from '../../../lib/redis';
import { apiKeyDb, usageRecordDb } from '../../../lib/database';
import { getTodayString } from '@/lib/date';
import { convertProviderFromDb } from '@/lib/provider-utils';

// 辅助函数：隐藏 API Key
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return key;
  }

  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(Math.min(key.length - 8, 20));

  return `${start}${middle}${end}`;
}

// 辅助函数：格式化日期
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return getTodayString(d);
}

// 辅助函数：转换提供商名称（前端小写 -> 数据库大写）
export function convertProviderToDb(
  provider: string
): 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'DEEPSEEK' | 'MOONSHOT' | 'SPARK' {
  const mapping: Record<
    string,
    'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'DEEPSEEK' | 'MOONSHOT' | 'SPARK'
  > = {
    openai: 'OPENAI',
    anthropic: 'ANTHROPIC',
    google: 'GOOGLE',
    deepseek: 'DEEPSEEK',
    moonshot: 'MOONSHOT',
    spark: 'SPARK',
  };
  return mapping[provider.toLowerCase()] || 'OPENAI';
}

// 辅助函数：转换状态（前端 -> 数据库）
function convertStatusToDb(status: string): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' {
  const mapping: Record<string, 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'> = {
    active: 'ACTIVE',
    disabled: 'INACTIVE',
    inactive: 'INACTIVE',
    suspended: 'SUSPENDED',
  };
  return mapping[status.toLowerCase()] || 'ACTIVE';
}

// 辅助函数：转换状态（数据库 -> 前端）
function convertStatusFromDb(status: string): 'active' | 'disabled' {
  const mapping: Record<string, 'active' | 'disabled'> = {
    ACTIVE: 'active',
    INACTIVE: 'disabled',
    SUSPENDED: 'disabled',
  };
  return mapping[status.toUpperCase()] || 'active';
}

export const apiKeyRouter = createTRPCRouter({
  // 获取所有 API Keys
  getAll: protectedProcedure.query(async () => {
    try {
      const apiKeys = await apiKeyDb.getAll();

      // 转换数据格式以匹配前端期望
      const maskedApiKeys = apiKeys.map((key) => ({
        originId: key.id,
        originKey: key.key,
        name: key.name,
        baseUrl: key.baseUrl || undefined,
        provider: convertProviderFromDb(key.provider),
        key: maskApiKey(key.key),
        id: maskApiKey(key.id),
        status: convertStatusFromDb(key.status),
        createdAt: formatDate(key.createdAt),
      }));

      return maskedApiKeys;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取 API Keys 失败',
        cause: error,
      });
    }
  }),

  // 根据 ID 获取 API Key
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      const apiKey = await apiKeyDb.getById(input.id);

      if (!apiKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API Key 不存在',
        });
      }

      return {
        id: apiKey.id,
        name: apiKey.name,
        provider: convertProviderFromDb(apiKey.provider),
        key: apiKey.key,
        baseUrl: apiKey.baseUrl || undefined,
        status: convertStatusFromDb(apiKey.status),
        createdAt: formatDate(apiKey.createdAt),
        lastUsed: undefined, // 数据库模式中没有 lastUsed 字段
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取 API Key 失败',
        cause: error,
      });
    }
  }),

  // 创建 API Key
  create: protectedProcedure
    .input(ApiKeySchema.omit({ id: true, createdAt: true }))
    .mutation(async ({ input }) => {
      try {
        // 生成唯一 ID
        const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

        // 创建新的 API Key
        const newApiKey = await apiKeyDb.create({
          id: keyId,
          name: input.name,
          provider: convertProviderToDb(input.provider),
          key: input.key,
          baseUrl: input.baseUrl || null,
          status: convertStatusToDb(input.status || 'active'),
        });

        // 更新 Redis 缓存
        try {
          const cacheKey = RedisKeys.apiKeys(input.provider);
          await redis.setEx(cacheKey, 3600, input.key); // 缓存 1 小时
        } catch (redisError) {
          console.warn('Redis 缓存更新失败:', redisError);
          // Redis 失败不影响主要功能
        }

        return {
          id: newApiKey.id,
          name: newApiKey.name,
          provider: convertProviderFromDb(newApiKey.provider),
          key: maskApiKey(newApiKey.key),
          baseUrl: newApiKey.baseUrl || undefined,
          status: convertStatusFromDb(newApiKey.status),
          createdAt: formatDate(newApiKey.createdAt),
          lastUsed: undefined, // 数据库模式中没有 lastUsed 字段
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建 API Key 失败',
          cause: error,
        });
      }
    }),

  // 更新 API Key
  update: protectedProcedure.input(ApiKeySchema).mutation(async ({ input }) => {
    try {
      // 更新数据库中的 API Key
      const updatedApiKey = await apiKeyDb.update(input.id, {
        name: input.name,
        provider: convertProviderToDb(input.provider),
        key: input.key,
        baseUrl: input.baseUrl || null,
        status: convertStatusToDb(input.status),
      });

      if (!updatedApiKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API Key 不存在',
        });
      }

      // 更新 Redis 缓存
      try {
        const cacheKey = RedisKeys.apiKeys(input.provider);
        await redis.setEx(cacheKey, 3600, input.key); // 缓存 1 小时
      } catch (redisError) {
        console.warn('Redis 缓存更新失败:', redisError);
        // Redis 失败不影响主要功能
      }

      return {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        provider: convertProviderFromDb(updatedApiKey.provider),
        key: updatedApiKey.key,
        baseUrl: updatedApiKey.baseUrl || undefined,
        status: convertStatusFromDb(updatedApiKey.status),
        createdAt: formatDate(updatedApiKey.createdAt),
        lastUsed: undefined, // 数据库模式中没有 lastUsed 字段
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '更新 API Key 失败',
        cause: error,
      });
    }
  }),

  // 删除 API Key
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    try {
      // 先获取 API Key 信息以便清除缓存
      const apiKey = await apiKeyDb.getById(input.id);

      if (!apiKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API Key 不存在',
        });
      }

      // 从数据库删除 API Key
      const success = await apiKeyDb.delete(input.id);

      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '删除 API Key 失败',
        });
      }

      // 清除 Redis 缓存
      try {
        const cacheKey = RedisKeys.apiKeys(convertProviderFromDb(apiKey.provider));
        await redis.del(cacheKey);
      } catch (redisError) {
        console.warn('Redis 缓存清除失败:', redisError);
        // Redis 失败不影响主要功能
      }

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '删除 API Key 失败',
        cause: error,
      });
    }
  }),

  // 切换 API Key 状态
  toggleStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // 获取当前 API Key
        const currentApiKey = await apiKeyDb.getById(input.id);

        if (!currentApiKey) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'API Key 不存在',
          });
        }

        // 切换状态
        const newStatus = currentApiKey.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        const updatedApiKey = await apiKeyDb.update(input.id, {
          status: newStatus,
        });

        if (!updatedApiKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '状态切换失败',
          });
        }

        // 如果禁用了 API Key，清除 Redis 缓存
        if (newStatus === 'INACTIVE') {
          try {
            const cacheKey = RedisKeys.apiKeys(convertProviderFromDb(currentApiKey.provider));
            await redis.del(cacheKey);
          } catch (redisError) {
            console.warn('Redis 缓存清除失败:', redisError);
          }
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '切换 API Key 状态失败',
          cause: error,
        });
      }
    }),

  // 获取 API Key 使用统计
  getUsageStats: protectedProcedure.input(z.object({ id: z.string() })).query(async () => {
    try {
      // 获取最近7天的使用记录
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // 从数据库获取使用记录
      const usageRecords = await usageRecordDb.getByDateRange(sevenDaysAgo, now);

      // 计算统计数据
      const totalRequests = usageRecords.length;
      const totalTokens = usageRecords.reduce((sum, record) => sum + record.totalTokens, 0);

      // 获取最后使用时间
      const lastUsed = usageRecords.length > 0 ? usageRecords[0].timestamp.toISOString() : null;

      // 按日期分组计算每日使用量
      const dailyUsageMap = new Map<string, { requests: number; tokens: number }>();

      usageRecords.forEach((record) => {
        const date = formatDate(record.timestamp);
        const existing = dailyUsageMap.get(date) || { requests: 0, tokens: 0 };
        dailyUsageMap.set(date, {
          requests: existing.requests + 1,
          tokens: existing.tokens + record.totalTokens,
        });
      });

      // 转换为数组格式
      const dailyUsage = Array.from(dailyUsageMap.entries())
        .map(([date, usage]) => ({
          date,
          requests: usage.requests,
          tokens: usage.tokens,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalRequests,
        totalTokens,
        lastUsed,
        dailyUsage,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取使用统计失败',
        cause: error,
      });
    }
  }),
});
