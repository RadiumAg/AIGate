'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function SidebarHeader() {
  return (
    <div className="p-4 border-b border-white/20 dark:border-white/10">
      <h1 className="text-xl font-bold text-foreground flex items-center">
        <div className="p-2 rounded-xl bg-linear-to-br from-primary/20 to-violet-500/20 backdrop-blur-sm border border-white/30 dark:border-white/10 mr-3 shadow-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        AIGate
      </h1>
    </div>
  );
}
