'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Gauge, Key, Users, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

const getNavigation = (t: (key: string) => string | Record<string, string>) => [
  {
    name: t('Navigation.dashboard') as string,
    href: '/',
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: t('Navigation.reports') as string,
    href: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: t('Navigation.debug') as string,
    href: '/debug',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    name: t('Navigation.quotas') as string,
    href: '/quotas',
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    name: t('Navigation.keys') as string,
    href: '/keys',
    icon: <Key className="h-5 w-5" />,
  },
  {
    name: t('Navigation.users') as string,
    href: '/users',
    icon: <Users className="h-5 w-5" />,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const navigation = React.useMemo(() => getNavigation(t), [t]);

  return (
    <nav className="flex-1 p-4">
      <ul className="space-y-2">
        {navigation.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                pathname === item.href
                  ? 'bg-white/40 dark:bg-white/10 text-primary backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/30 dark:border-white/10 scale-[1.02]'
                  : 'text-foreground/70 hover:bg-white/30 dark:hover:bg-white/5 hover:backdrop-blur-sm hover:scale-[1.02]'
              }`}
            >
              <span className="mr-3 opacity-80">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
