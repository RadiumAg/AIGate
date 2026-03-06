import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { whitelistRuleDb } from '@/lib/database';
import { getTodayString } from '@/lib/date';

// 白名单规则 Schema
const WhitelistRuleSchema = z.object({
  id: z.string(),
  policyName: z.string(),
  description: z.string().optional().nullable(),
  priority: z.number(),
  status: z.enum(['active', 'inactive']),
  validationPattern: z.string().optional().nullable(),
  userIdPattern: z.string().optional().nullable(),
  validationEnabled: z.boolean().default(false),
  apiKeyId: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const whitelistRouter = createTRPCRouter({
  // 获取所有白名单规则
  getAll: protectedProcedure.query(async () => {
    try {
      const rules = await whitelistRuleDb.getAll();
      return rules.map((rule) => ({
        ...rule,
        validationEnabled: Boolean(rule.validationEnabled),
        createdAt: getTodayString(rule.createdAt),
      }));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取白名单规则失败',
        cause: error,
      });
    }
  }),

  // 根据 ID 获取白名单规则
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      const rule = await whitelistRuleDb.getById(input.id);
      if (!rule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '白名单规则不存在',
        });
      }

      return {
        ...rule,
        createdAt: getTodayString(rule.createdAt),
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取白名单规则失败',
        cause: error,
      });
    }
  }),

  // 创建白名单规则
  create: protectedProcedure
    .input(WhitelistRuleSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      try {
        const { validationEnabled, apiKeyId, ...rest } = input;

        // 验证 API Key 约束：每个 API Key 只能绑定一个白名单规则
        if (apiKeyId) {
          const existingRule = await whitelistRuleDb.getByApiKeyId(apiKeyId);
          if (existingRule) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: '该 API Key 已经绑定了其他白名单规则',
            });
          }
        }

        const rule = await whitelistRuleDb.create({
          ...rest,
          apiKeyId: apiKeyId || null,
          validationEnabled: validationEnabled ? 1 : 0,
        });
        return {
          ...rule,
          validationEnabled: Boolean(rule.validationEnabled),
          createdAt: getTodayString(rule.createdAt),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建白名单规则失败',
          cause: error,
        });
      }
    }),

  // 更新白名单规则
  update: protectedProcedure
    .input(WhitelistRuleSchema.omit({ createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      try {
        const { id, validationEnabled, apiKeyId, ...updates } = input;

        // 验证 API Key 约束：每个 API Key 只能绑定一个白名单规则
        if (apiKeyId) {
          const existingRule = await whitelistRuleDb.getByApiKeyId(apiKeyId);
          // 如果找到的规则不是当前正在更新的规则，则抛出错误
          if (existingRule && existingRule.id !== id) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: '该 API Key 已经绑定了其他白名单规则',
            });
          }
        }

        const rule = await whitelistRuleDb.update(id, {
          ...updates,
          apiKeyId: apiKeyId || null,
          validationEnabled: validationEnabled ? 1 : 0,
        });
        if (!rule) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '白名单规则不存在',
          });
        }

        return {
          ...rule,
          validationEnabled: Boolean(rule.validationEnabled),
          createdAt: getTodayString(rule.createdAt),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '更新白名单规则失败',
          cause: error,
        });
      }
    }),

  // 删除白名单规则
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    try {
      const success = await whitelistRuleDb.delete(input.id);
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '白名单规则不存在',
        });
      }
      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '删除白名单规则失败',
        cause: error,
      });
    }
  }),

  // 切换白名单规则状态
  toggleStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const rule = await whitelistRuleDb.toggleStatus(input.id);
        if (!rule) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '白名单规则不存在',
          });
        }
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '切换白名单规则状态失败',
          cause: error,
        });
      }
    }),

  // 获取白名单规则统计信息
  getStats: protectedProcedure.query(async () => {
    try {
      return await whitelistRuleDb.getStats();
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取白名单规则统计失败',
        cause: error,
      });
    }
  }),

  // 匹配用户邮箱到策略
  matchUserPolicy: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        return await whitelistRuleDb.matchUserPolicy(input.email);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '匹配用户策略失败',
          cause: error,
        });
      }
    }),
});
