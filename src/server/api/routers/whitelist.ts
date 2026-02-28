import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { whitelistRuleDb } from '@/lib/database';

// 白名单规则 Schema
const WhitelistRuleSchema = z.object({
  id: z.string(),
  policyName: z.string(),
  description: z.string().optional().nullable(),
  priority: z.number(),
  status: z.enum(['active', 'inactive']),
  validationPattern: z.string().optional().nullable(),
  validationEnabled: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const whitelistRouter = createTRPCRouter({
  // 获取所有白名单规则
  getAll: publicProcedure.query(async () => {
    try {
      const rules = await whitelistRuleDb.getAll();
      return rules.map((rule) => ({
        ...rule,
        validationEnabled: Boolean(rule.validationEnabled),
        createdAt: rule.createdAt.toISOString().split('T')[0],
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
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
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
        createdAt: rule.createdAt.toISOString().split('T')[0],
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
  create: publicProcedure
    .input(WhitelistRuleSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      try {
        const { validationEnabled, ...rest } = input;
        const rule = await whitelistRuleDb.create({
          ...rest,
          validationEnabled: validationEnabled ? 1 : 0,
        });
        return {
          ...rule,
          validationEnabled: Boolean(rule.validationEnabled),
          createdAt: rule.createdAt.toISOString().split('T')[0],
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建白名单规则失败',
          cause: error,
        });
      }
    }),

  // 更新白名单规则
  update: publicProcedure
    .input(WhitelistRuleSchema.omit({ createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      try {
        const { id, validationEnabled, ...updates } = input;
        const rule = await whitelistRuleDb.update(id, {
          ...updates,
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
          createdAt: rule.createdAt.toISOString().split('T')[0],
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
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
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
  toggleStatus: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
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
  getStats: publicProcedure.query(async () => {
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
  matchUserPolicy: publicProcedure
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
