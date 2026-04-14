'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Liquid Glass Card 样式变体
export const glassCardVariants = {
  default: [
    'bg-white/15 dark:bg-black/20',
    'backdrop-blur-xl backdrop-saturate-[1.8]',
    'border-white/25 dark:border-white/8',
    '[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),inset_0_0_8px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.12)]',
    'dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.15),inset_0_0_8px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.25)]',
  ].join(' '),
  thin: [
    'bg-white/8 dark:bg-black/12',
    'backdrop-blur-lg backdrop-saturate-[1.5]',
    'border-white/15 dark:border-white/5',
    '[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.08)]',
    'dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.2)]',
  ].join(' '),
  thick: [
    'bg-white/25 dark:bg-black/30',
    'backdrop-blur-2xl backdrop-saturate-[2]',
    'border-white/30 dark:border-white/10',
    '[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.75),inset_0_0_16px_rgba(255,255,255,0.2),0_12px_40px_rgba(0,0,0,0.16)]',
    'dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.2),inset_0_0_16px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.3)]',
  ].join(' '),
};

export interface StatSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatSummaryCard: React.FC<StatSummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend = 'neutral',
}) => {
  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-rose-500',
    neutral: 'text-slate-500',
  };

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]',
        glassCardVariants.default
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            {subtitle && <p className={`text-xs ${trendColors[trend]}`}>{subtitle}</p>}
          </div>
          <div className="p-3 rounded-xl bg-white/20 dark:bg-white/5 backdrop-blur-sm">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatSummaryCard;
