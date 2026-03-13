'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { demoConfig } from '@/lib/demo-config';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: async () => {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return demoConfig.demoCredentials;
      }
      return {
        email: '',
        password: '',
      };
    },
    mode: 'onChange',
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setServerError('');

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError(t('Auth.loginFailed') as string);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setServerError(t('Auth.loginError') as string);
    } finally {
      setLoading(false);
    }
  };

  const onError = () => {
    // React Hook Form will automatically show validation errors
    setServerError('');
  };

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

          <form onSubmit={handleSubmit(onSubmit, onError)} id="login-form">
            <FieldGroup className="space-y-6">
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">{t('Auth.email') as string}</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all data-[invalid=true]:border-red-500/50 data-[invalid=true]:ring-red-500/20"
                      placeholder={t('Auth.emailPlaceholder') as string}
                    />
                    <FieldDescription>
                      {fieldState.error?.message || (t('Auth.emailPlaceholder') as string)}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">{t('Auth.password') as string}</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all pr-10 data-[invalid=true]:border-red-500/50 data-[invalid=true]:ring-red-500/20"
                        placeholder={t('Auth.passwordPlaceholder') as string}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FieldDescription>
                      {fieldState.error?.message || (t('Auth.passwordPlaceholder') as string)}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                  </Field>
                )}
              />

              {/* Server-side errors */}
              {serverError && (
                <Field data-invalid>
                  <FieldError>{serverError}</FieldError>
                </Field>
              )}

              <Button
                type="submit"
                form="login-form"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (t('Auth.loggingIn') as string) : (t('Auth.signIn') as string)}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
