'use client';

import React from 'react';

interface ActivityItemProps {
  id: string;
  description: string;
  time: string;
  details?: {
    model?: string;
    provider?: string;
    tokens?: number;
    cost?: number | string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = (props) => {
  const { description, time, details } = props;

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else {
      return `${diffDays} 天前`;
    }
  };

  const getProviderColor = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'openai':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'anthropic':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'google':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
      <div className="shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
          AI
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-white">{description}</p>
        {details && (
          <div className="flex items-center space-x-2 mt-1">
            {details.provider && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProviderColor(details.provider)}`}
              >
                {details.provider}
              </span>
            )}
            {details.tokens && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {details.tokens.toLocaleString()} tokens
              </span>
            )}
            {details.cost && (
              <span className="text-xs text-gray-500 dark:text-gray-400">${details.cost}</span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTime(time)}</p>
      </div>
    </div>
  );
};

export default ActivityItem;
