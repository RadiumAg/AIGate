'use client';

import React, { FC } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string | number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatCard: FC<StatCardProps> = (props) => {
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mt-2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {formatValue(value)}
          </p>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
          {icon}
        </div>
      </div>
      <p className={`text-sm mt-2 ${getChangeColor()}`}>
        {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''}
        {typeof change === 'number' ? `${change > 0 ? '+' : ''}${change}` : change}
        {changeType !== 'neutral' && '%'}
      </p>
    </div>
  );
};

export default StatCard;
