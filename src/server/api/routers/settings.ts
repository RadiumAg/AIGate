import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import fs from 'fs';
import path from 'path';

// 环境变量更新输入验证
const updateEnvSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度至少6位'),
});

export const settingsRouter = createTRPCRouter({
  // 更新管理员账户设置
  updateAdminAccount: protectedProcedure.input(updateEnvSchema).mutation(async ({ input }) => {
    try {
      // 检查是否在开发环境（生产环境可能没有文件写入权限）
      // if (process.env.NODE_ENV === 'production') {
      //   throw new TRPCError({
      //     code: 'FORBIDDEN',
      //     message: '生产环境下不允许直接修改环境变量文件',
      //   });
      // }

      // 获取 .env 文件路径
      const envPath = path.resolve(process.cwd(), '.env');

      // 读取现有环境变量
      let envContent: string;
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '无法读取环境变量文件',
        });
      }

      // 更新 ADMIN_EMAIL 和 ADMIN_PASSWORD
      const emailRegex = /^ADMIN_EMAIL=.*$/m;
      const passwordRegex = /^ADMIN_PASSWORD=.*$/m;

      // 替换或添加环境变量
      let newEnvContent = envContent;

      if (emailRegex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(emailRegex, `ADMIN_EMAIL="${input.email}"`);
      } else {
        // 如果不存在，则添加到文件末尾
        newEnvContent += `\nADMIN_EMAIL="${input.email}"`;
      }

      if (passwordRegex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(passwordRegex, `ADMIN_PASSWORD="${input.password}"`);
      } else {
        newEnvContent += `\nADMIN_PASSWORD="${input.password}"`;
      }

      // 同步更新 NEXT_PUBLIC_ 前缀的变量（如果存在）
      const publicEmailRegex = /^NEXT_PUBLIC_ADMIN_EMAIL=.*$/m;
      const publicPasswordRegex = /^NEXT_PUBLIC_ADMIN_PASSWORD=.*$/m;

      if (publicEmailRegex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(
          publicEmailRegex,
          `NEXT_PUBLIC_ADMIN_EMAIL="${input.email}"`
        );
      } else {
        newEnvContent += `\nNEXT_PUBLIC_ADMIN_EMAIL="${input.email}"`;
      }

      if (publicPasswordRegex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(
          publicPasswordRegex,
          `NEXT_PUBLIC_ADMIN_PASSWORD="${input.password}"`
        );
      } else {
        newEnvContent += `\nNEXT_PUBLIC_ADMIN_PASSWORD="${input.password}"`;
      }

      // 写入文件
      try {
        fs.writeFileSync(envPath, newEnvContent, 'utf8');
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '无法写入环境变量文件，请检查文件权限',
        });
      }

      // 同时更新内存中的环境变量（仅在开发环境有效）
      process.env.ADMIN_EMAIL = input.email;
      process.env.ADMIN_PASSWORD = input.password;
      process.env.NEXT_PUBLIC_ADMIN_EMAIL = input.email;
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD = input.password;

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

  // 获取当前管理员账户信息（不返回密码）
  getAdminAccount: protectedProcedure.query(() => {
    return {
      email: process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@aigate.com',
    };
  }),
});
