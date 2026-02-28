'use client';

import React, { type FC } from 'react';

interface IpRequestRecord {
  id: string;
  userId: string;
  clientIp: string;
  region: string;
  model: string;
  provider: string;
  totalTokens: number;
  timestamp: string;
}

interface RecentIpRequestsProps {
  data: IpRequestRecord[];
  loading?: boolean;
}

const RecentIpRequests: FC<RecentIpRequestsProps> = (props) => {
  const { data, loading = false } = props;

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    return `${diffDays} 天前`;
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'anthropic':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'google':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'deepseek':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse flex items-center space-x-4 p-3">
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">暂无 IP 请求记录</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="pb-3 pr-4 font-medium">IP 地址</th>
            <th className="pb-3 pr-4 font-medium">归属地</th>
            <th className="pb-3 pr-4 font-medium">用户</th>
            <th className="pb-3 pr-4 font-medium">模型</th>
            <th className="pb-3 pr-4 font-medium">Tokens</th>
            <th className="pb-3 font-medium">时间</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.map((record) => (
            <tr
              key={record.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td className="py-3 pr-4">
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-800 dark:text-gray-200">
                  {record.clientIp}
                </code>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-700 dark:text-gray-300">{record.region}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-600 dark:text-gray-400 truncate max-w-30 inline-block">
                  {record.userId}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProviderColor(record.provider)}`}
                >
                  {record.model}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-600 dark:text-gray-400">
                  {record.totalTokens.toLocaleString()}
                </span>
              </td>
              <td className="py-3">
                <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {formatTime(record.timestamp)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentIpRequests;
