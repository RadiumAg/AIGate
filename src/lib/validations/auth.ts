import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, { message: '邮箱不能为空' }).email({ message: '请输入有效的邮箱地址' }),
  password: z
    .string()
    .min(1, { message: '密码不能为空' })
    .min(6, { message: '密码至少需要6个字符' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
