'use client';

import React, { FC } from 'react';
import { trpc } from '@/components/trpc-provider';
import type { ActivityItem as ActivityItemType } from '@/types/dashboard';
import UsageTrendChart from '@/app/(dashboard)/components/usage-trend-chart';
import ModelDistributionChart from '@/app/(dashboard)/components/model-distribution-chart';
import StatCard from './components/stat-card';
import ActivityItem from './components/activity-item';

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
