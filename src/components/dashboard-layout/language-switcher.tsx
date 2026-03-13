'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="p-4 mt-auto">
      <div className="rounded-2xl p-4 backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_1px_1px_0_rgba(255,255,255,0.5)]">
        <div className="text-sm text-foreground/60 mb-3 font-medium">
          {t('Common.language') as string}
        </div>
        <div className="flex gap-2 p-1 rounded-xl bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/5">
          <button
            onClick={() => setLocale('zh')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              locale === 'zh'
                ? 'bg-white/60 dark:bg-white/15 text-primary shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/40 dark:border-white/10'
                : 'text-foreground/60 hover:text-foreground hover:bg-white/20 dark:hover:bg-white/5'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />中
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              locale === 'en'
                ? 'bg-white/60 dark:bg-white/15 text-primary shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/40 dark:border-white/10'
                : 'text-foreground/60 hover:text-foreground hover:bg-white/20 dark:hover:bg-white/5'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
