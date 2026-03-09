'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/components/trpc-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // 获取当前账户信息
  const { data: accountInfo, isLoading: infoLoading } = trpc.settings.getAdminAccount.useQuery();

  // 使用 accountInfo.email 作为 email 的初始值
  const [email, setEmail] = React.useState(accountInfo?.email || '');

  const updateMutation = trpc.settings.updateAdminAccount.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('请填写所有字段');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }

    setLoading(true);
    updateMutation.mutate({ email, password });
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  邮箱地址
                </Label>
                <Input
                  required
                  id="email"
                  type="email"
                  value={email}
                  defaultValue={accountInfo?.email}
                  placeholder="admin@example.com"
                  className="bg-background border-input"
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                    required
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
                    required
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
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || updateMutation.isPending}
              >
                {loading || updateMutation.isPending ? '保存中...' : '保存更改'}
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
