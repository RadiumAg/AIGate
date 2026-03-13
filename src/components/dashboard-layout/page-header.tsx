'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const getNavigation = (t: (key: string) => string | Record<string, string>) => [
  {
    name: t('Navigation.dashboard'),
    href: '/',
  },
  {
    name: t('Navigation.debug'),
    href: '/debug',
  },
  {
    name: t('Navigation.quotas'),
    href: '/quotas',
  },
  {
    name: t('Navigation.keys'),
    href: '/keys',
  },
  {
    name: t('Navigation.users'),
    href: '/users',
  },
];

interface NavigationItem {
  name: string | Record<string, string>;
  href: string;
}

interface PageHeaderProps {
  children: React.ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const navigation = React.useMemo(() => getNavigation(t), [t]);

  return (
    <header className="sticky top-0 z-10 backdrop-blur-2xl bg-white/60 dark:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold text-foreground">
          {
            ((navigation as NavigationItem[]).find((item) => item.href === pathname)?.name ||
              t('Navigation.dashboard')) as string
          }
        </h2>
        <div className="flex items-center space-x-3">{children}</div>
      </div>
    </header>
  );
}
