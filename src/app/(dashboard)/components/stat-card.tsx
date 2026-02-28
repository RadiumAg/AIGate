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
      <div className="rounded-2xl p-6 animate-pulse backdrop-blur-md bg-[var(--card)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-[var(--muted)] rounded-xl w-20 mb-2"></div>
            <div className="h-8 bg-[var(--muted)] rounded-xl w-16"></div>
          </div>
          <div className="w-12 h-12 bg-[var(--muted)] rounded-xl"></div>
        </div>
        <div className="h-4 bg-[var(--muted)] rounded-xl w-12 mt-2"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 backdrop-blur-md bg-[var(--card)] border border-[var(--card-border)] shadow-[var(--card-shadow)] transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--muted-foreground)] text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{formatValue(value)}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--primary-glass)] to-violet-500/10 text-[var(--primary)] backdrop-blur-sm border border-[var(--primary)]/10">
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
