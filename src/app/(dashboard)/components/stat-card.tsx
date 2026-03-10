'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string | number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = (props) => {
  const { title, value, change, changeType, icon, isLoading = false } = props;

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-muted/50 rounded-xl w-20 mb-2"></div>
            <div className="h-8 bg-muted/50 rounded-xl w-16"></div>
          </div>
          <div className="w-12 h-12 bg-muted/50 rounded-xl"></div>
        </div>
        <div className="h-4 bg-muted/50 rounded-xl w-12 mt-2"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.03] hover:bg-white/60 dark:hover:bg-black/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatValue(value)}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary backdrop-blur-sm border border-white/40 dark:border-white/20 shadow-lg">
          {icon}
        </div>
      </div>
      <p className={`text-sm mt-3 font-medium ${getChangeColor()}`}>
        {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''}
        {typeof change === 'number' ? `${change > 0 ? '+' : ''}${change}` : change}
        {changeType !== 'neutral' && '%'}
      </p>
    </div>
  );
};

export default StatCard;
