'use client';

import React from 'react';
import { Github, Sun, Moon, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isDemoMode } from '@/lib/demo-config';
import { useTranslation } from '@/i18n/client';

function ThemeToggle() {
  const [darkMode, setDarkMode] = React.useState(false);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setTimeout(() => {
      setDarkMode(isDark);
    }, 0);
  }, []);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-foreground/70 hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-sm border border-white/30 dark:border-white/10 hover:scale-110 shadow-sm"
      title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
    >
      {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function UserMenu() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-9 h-9 rounded-full bg-linear-to-br from-primary/80 to-violet-500/80 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-lg p-0 hover:scale-110 hover:shadow-xl transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        >
          <User className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-40 p-2 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,0.5)]"
      >
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl hover:bg-white/30 dark:hover:bg-white/10 hover:backdrop-blur-sm transition-all duration-200"
            disabled
          >
            <User className="h-4 w-4 mr-2" />
            <span>{t('Common.profile') as string}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl hover:bg-white/30 dark:hover:bg-white/10 hover:backdrop-blur-sm transition-all duration-200"
            onClick={() => {
              window.location.href = '/settings';
            }}
          >
            <span>{t('Common.settings') as string}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-all duration-200"
            onClick={() => {
              signOut({ callbackUrl: '/login' });
            }}
          >
            <span>{t('Auth.signOut') as string}</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GithubLink() {
  if (!isDemoMode()) return null;

  return (
    <a
      href="https://github.com/RadiumAg/AIGate"
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-foreground/70 hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-sm border border-white/30 dark:border-white/10 hover:scale-110 shadow-sm"
      title="查看项目源码"
    >
      <Github className="h-5 w-5" />
    </a>
  );
}

export function SidebarFooter() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="p-4 mt-auto">
      <div className="rounded-2xl p-4 backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_1px_1px_0_rgba(255,255,255,0.5)] space-y-4">
        {/* 操作按钮 */}
        <div className="flex items-center justify-between gap-2">
          <GithubLink />
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* 语言切换 */}
        <div>
          <div className="text-sm text-foreground/60 mb-2 font-medium">
            {t('Common.language') as string}
          </div>
          <div className="flex gap-2 p-1 rounded-xl bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/5">
            <button
              onClick={() => setLocale('zh')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                locale === 'zh'
                  ? 'bg-white/60 dark:bg-white/15 text-primary shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]'
                  : 'text-foreground/60 hover:text-foreground hover:bg-white/20 dark:hover:bg-white/5'
              }`}
            >
              中
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                locale === 'en'
                  ? 'bg-white/60 dark:bg-white/15 text-primary shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]'
                  : 'text-foreground/60 hover:text-foreground hover:bg-white/20 dark:hover:bg-white/5'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
