import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { userDb } from '@/lib/database';
import { nanoid } from 'nanoid';

// 环境变量更新输入验证
const updateEnvSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度至少6位'),
});

export const settingsRouter = createTRPCRouter({
  // 更新管理员账户设置 - 直接删除所有用户并重建
  updateAdminAccount: protectedProcedure.input(updateEnvSchema).mutation(async ({ input }) => {
    try {
      // 1. 删除所有现有用户
      console.log('🗑️ 删除所有现有用户...');
      const deleteResult = await userDb.deleteAll();
      console.log(`✅ 删除了 ${deleteResult.deletedCount} 个用户`);

      // 2. 创建新的管理员用户
      console.log('🆕 创建新的管理员用户...');
      const newAdmin = {
        id: nanoid(),
        name: '系统管理员',
        email: input.email,
        password: input.password,
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        quotaPolicyId: 'default',
      };

      const createdUser = await userDb.create(newAdmin);

      console.log(`✅ 管理员用户创建成功:`);
      console.log(`   ID: ${createdUser.id}`);
      console.log(`   邮箱: ${createdUser.email}`);
      console.log(`   姓名: ${createdUser.name}`);
      console.log(`   角色: ${createdUser.role}`);

      return {
        success: true,
        message: '管理员账户信息已成功更新',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('更新管理员账户失败:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '更新管理员账户失败',
      });
    }
  }),

  // 获取管理员账户信息 - 直接返回第一个用户
  getAdminAccount: protectedProcedure.query(async () => {
    try {
      // 获取所有用户，返回第一个
      const users = await userDb.getAll();
      const firstUser = users[0];

      if (!firstUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '未找到任何用户',
        });
      }

      return {
        email: firstUser.email,
        name: firstUser.name,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取账户信息失败',
      });
    }
  }),
});
