'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/components/trpc-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

// 定义表单验证 schema
const settingsFormSchema = z
  .object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码长度至少6位'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type SettingsFormData = z.infer<typeof settingsFormSchema>;

const SettingsPage: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof SettingsFormData, string>>>({});
  const router = useRouter();

  // 获取当前账户信息
  const { data: accountInfo, isLoading: infoLoading } = trpc.settings.getAdminAccount.useQuery();

  const updateMutation = trpc.settings.updateAdminAccount.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // 使用 Zod 验证表单数据
    const result = settingsFormSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      // 将 Zod 错误转换为表单错误
      const formErrors: Partial<Record<keyof SettingsFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof SettingsFormData;
        formErrors[field] = error.message;
      });
      setErrors(formErrors);
      return;
    }

    // 验证通过，提交表单
    updateMutation.mutate({
      email: result.data.email,
      password: result.data.password,
    });
  };

  // 当账户信息加载完成后，更新 email
  React.useEffect(() => {
    if (accountInfo?.email) {
      setEmail(accountInfo.email);
    }
  }, [accountInfo]);

  if (infoLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-pulse">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-md mx-auto">
        <div className="rounded-2xl p-6 backdrop-blur-md bg-card border border-(--card-border) shadow-(--card-shadow)">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">管理员账户设置</h1>
            <p className="text-muted-foreground">修改管理员登录邮箱和密码</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="bg-background border-input"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  新密码
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入新密码"
                    className="bg-background border-input pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  确认密码
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                    className="bg-background border-input pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存更改'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                返回
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
