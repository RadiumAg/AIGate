'use client';

import React from 'react';
import { SidebarHeader } from './sidebar-header';
import { SidebarNav } from './sidebar-nav';
import { LanguageSwitcher } from './language-switcher';
import { PageHeader } from './page-header';
import { GithubLink } from './github-link';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-linear-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
      {/* Sidebar - Enhanced Liquid Glass */}
      <aside className="w-64 flex flex-col backdrop-blur-2xl bg-white/70 dark:bg-black/40 border-r border-white/20 dark:border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.08)]">
        <SidebarHeader />
        <SidebarNav />
        <LanguageSwitcher />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <PageHeader>
          <GithubLink />
          <ThemeToggle />
          <UserMenu />
        </PageHeader>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
