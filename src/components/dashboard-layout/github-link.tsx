'use client';

import React from 'react';
import { Github } from 'lucide-react';
import { isDemoMode } from '@/lib/demo-config';

export function GithubLink() {
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
