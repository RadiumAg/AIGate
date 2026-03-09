'use client';

import React from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { trpc } from '@/components/trpc-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const router = useRouter();
  const { data: accountInfo, isLoading: infoLoading } = trpc.settings.getAdminAccount.useQuery();
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // 当账户信息加载完成后，更新表单默认值
  React.useEffect(() => {
    if (accountInfo?.email) {
      form.reset({
        email: accountInfo.email,
        password: '',
        confirmPassword: '',
      });
    }
  }, [accountInfo, form]);

  const updateMutation = trpc.settings.updateAdminAccount.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    updateMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

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

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-email">邮箱地址</FieldLabel>
                    <Input
                      {...field}
                      id="settings-email"
                      type="email"
                      placeholder="admin@example.com"
                      className="bg-background border-input"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>修改管理员登录邮箱</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-password">新密码</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="settings-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入新密码"
                        className="bg-background border-input pr-10"
                        aria-invalid={fieldState.invalid}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-confirm-password">确认密码</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="settings-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="请再次输入新密码"
                        className="bg-background border-input pr-10"
                        aria-invalid={fieldState.invalid}
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || updateMutation.isPending}
              >
                {form.formState.isSubmitting || updateMutation.isPending ? '保存中...' : '保存更改'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => form.reset()}
              >
                重置
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
