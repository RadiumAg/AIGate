'use client';

import React, { FC } from 'react';
import { trpc } from '@/components/TRPCProvider';
import type {
  ActivityItem as ActivityItemType,
  UsageTrendItem,
  ModelDistributionItem,
} from '@/types/dashboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import UsageTrendChart from '@/components/UsageTrendChart';
import ModelDistributionChart from '@/components/ModelDistributionChart';

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

interface ActivityItemProps {
  id: string;
  description: string;
  time: string;
  details?: {
    model?: string;
    provider?: string;
    tokens?: number;
    cost?: number;
  };
}

const ActivityItem: FC<ActivityItemProps> = (props) => {
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

const HomePage: FC = () => {
  // 获取仪表盘统计数据
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();

  // 获取最近活动
  const { data: activities, isLoading: activitiesLoading } =
    trpc.dashboard.getRecentActivity.useQuery();

  // 获取使用趋势
  const { data: usageTrend, isLoading: trendLoading } = trpc.dashboard.getUsageTrend.useQuery();

  // 获取模型分布
  const { data: modelDistribution, isLoading: distributionLoading } =
    trpc.dashboard.getModelDistribution.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">仪表板</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">欢迎来到 AIGate 管理后台</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户数"
          value={stats?.totalUsers.value || 0}
          change={stats?.totalUsers.change || 0}
          changeType={
            stats?.totalUsers.trend === 'up'
              ? 'positive'
              : stats?.totalUsers.trend === 'down'
                ? 'negative'
                : 'neutral'
          }
          isLoading={statsLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="今日请求"
          value={stats?.todayRequests.value || 0}
          change={stats?.todayRequests.change || 0}
          changeType={
            stats?.todayRequests.trend === 'up'
              ? 'positive'
              : stats?.todayRequests.trend === 'down'
                ? 'negative'
                : 'neutral'
          }
          isLoading={statsLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <StatCard
          title="Token 消耗"
          value={stats?.todayTokens.value || 0}
          change={stats?.todayTokens.change || 0}
          changeType={
            stats?.todayTokens.trend === 'up'
              ? 'positive'
              : stats?.todayTokens.trend === 'down'
                ? 'negative'
                : 'neutral'
          }
          isLoading={statsLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="活跃用户"
          value={stats?.activeUsers.value || 0}
          change={stats?.activeUsers.change || 0}
          changeType={
            stats?.activeUsers.trend === 'up'
              ? 'positive'
              : stats?.activeUsers.trend === 'down'
                ? 'negative'
                : 'neutral'
          }
          isLoading={statsLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">近期请求趋势</h2>
          {trendLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="w-full h-64">
              <UsageTrendChart data={usageTrend || []} loading={trendLoading} />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">模型使用分布</h2>
          <ModelDistributionChart data={modelDistribution || []} loading={distributionLoading} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">最近活动</h2>
        {activitiesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {activities && activities.length > 0 ? (
              activities.map((activity: ActivityItemType) => (
                <ActivityItem
                  key={activity.id}
                  id={activity.id}
                  description={activity.description}
                  time={activity.time}
                  details={activity.details}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">暂无最近活动</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
