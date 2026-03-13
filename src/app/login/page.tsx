'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('Auth.loginFailed') as string);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError(t('Auth.loginError') as string);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载完成
  React.useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50/80 via-purple-50/60 to-pink-50/80 dark:from-slate-900/90 dark:via-violet-950/80 dark:to-fuchsia-950/90 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Liquid Glass Card */}
        <div className="rounded-3xl p-8 backdrop-blur-2xl bg-white/60 dark:bg-black/30 border border-white/40 dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">{t('Auth.loginTitle') as string}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('Auth.loginSubtitle') as string}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  {t('Auth.email') as string}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder={t('Auth.emailPlaceholder') as string}
                />
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  {t('Auth.password') as string}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all pr-10"
                    placeholder={t('Auth.passwordPlaceholder') as string}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm text-center py-2.5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || isLoading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-all duration-300"
            >
              {loading ? t('Auth.loggingIn') : t('Auth.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
