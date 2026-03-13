'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/i18n/client';

export function UserMenu() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-9 h-9 rounded-full bg-linear-to-br from-primary/80 to-violet-500/80 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-lg p-0 hover:scale-110 hover:shadow-xl transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        >
          A
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
            <Settings className="h-4 w-4 mr-2" />
            <span>{t('Common.settings') as string}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-all duration-200"
            onClick={() => {
              signOut({ callbackUrl: '/login' });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>{t('Auth.signOut') as string}</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
