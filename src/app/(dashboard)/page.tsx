'use client';

import React, { useState } from 'react';
import { trpc } from '@/components/trpc-provider';
import UsageTrendChart from '@/app/(dashboard)/components/usage-trend-chart';
import ModelDistributionChart from '@/app/(dashboard)/components/model-distribution-chart';
import RegionHeatmapChart from '@/app/(dashboard)/components/region-heatmap-chart';
import RecentIpRequests from '@/app/(dashboard)/components/recent-ip-requests';
import StatCard from './components/stat-card';
import RecentActivity from './components/recent-activity';
import DateRangePicker from '@/components/date-range-picker';
import CustomDateRangePicker from '@/components/custom-date-range-picker';
import { Users, BarChart3, Coins, UserCheck } from 'lucide-react';

const HomePage: React.FC = () => {
  // 日期范围状态
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'custom'>(
    'today'
  );
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  // 计算日期范围
  const getDateRange = () => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case '7days':
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case '30days':
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const { start: queryStart, end: queryEnd } = getDateRange();

  // 获取仪表盘统计数据
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery({
    startDate: queryStart,
    endDate: queryEnd,
  });

  // 获取最近活动
  const { data: activities, isLoading: activitiesLoading } =
    trpc.dashboard.getRecentActivity.useQuery({
      startDate: queryStart,
      endDate: queryEnd
    });
    
  // 获取使用趋势
  const { data: usageTrend, isLoading: trendLoading } = trpc.dashboard.getUsageTrend.useQuery({
    startDate: queryStart,
    endDate: queryEnd
  });
    
  // 获取模型分布
  const { data: modelDistribution, isLoading: distributionLoading } =
    trpc.dashboard.getModelDistribution.useQuery({
      startDate: queryStart,
      endDate: queryEnd
    });
    
  // 获取地区分布
  const { data: regionDistribution, isLoading: regionLoading } =
    trpc.dashboard.getRegionDistribution.useQuery({
      startDate: queryStart,
      endDate: queryEnd
    });

  // 获取最近 IP 请求记录
  const { data: recentIpRequests, isLoading: ipRequestsLoading } =
    trpc.dashboard.getRecentIpRequests.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">仪表板</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">欢迎来到 AIGate 管理后台</p>
      </div>

      {/* 日期筛选器 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          {dateRange === 'custom' && (
            <CustomDateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              onDateRangeChange={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
            />
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          数据更新时间: {new Date().toLocaleString('zh-CN')}
        </div>
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
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="请求数"
          value={stats?.requests.value || 0}
          change={stats?.requests.change || 0}
          changeType={
            stats?.requests.trend === 'up'
              ? 'positive'
              : stats?.requests.trend === 'down'
                ? 'negative'
                : 'neutral'
          }
          isLoading={statsLoading}
          icon={<BarChart3 className="h-6 w-6" />}
        />
        <StatCard
          title="Token 消耗"
          value={stats?.tokens.value || 0}
          change={stats?.tokens.change || 0}
          changeType={
            stats?.tokens.trend === 'up'
              ? 'positive'
              : stats?.tokens.trend === 'down'
                ? 'negative'
                : 'neutral'
          }
          isLoading={statsLoading}
          icon={<Coins className="h-6 w-6" />}
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
          icon={<UserCheck className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 backdrop-blur-md bg-card border border-(--card-border) shadow-(--card-shadow)">
          <h2 className="text-lg font-semibold text-foreground mb-4">近期请求趋势</h2>
          <UsageTrendChart data={usageTrend || []} loading={trendLoading} />
        </div>

        <div className="rounded-2xl p-6 backdrop-blur-md bg-card border border-(--card-border) shadow-(--card-shadow)">
          <h2 className="text-lg font-semibold text-foreground mb-4">模型使用分布</h2>
          <ModelDistributionChart data={modelDistribution || []} loading={distributionLoading} />
        </div>
      </div>

      {/* Region Heatmap */}
      <div className="rounded-2xl p-6 backdrop-blur-md bg-card border border-(--card-border) shadow-(--card-shadow)">
        <h2 className="text-lg font-semibold text-foreground mb-4">请求地区分布</h2>
        <RegionHeatmapChart data={regionDistribution || []} loading={regionLoading} />
      </div>

      {/* Recent IP Requests */}
      <div className="rounded-2xl p-6 backdrop-blur-md bg-card border border-(--card-border) shadow-(--card-shadow)">
        <h2 className="text-lg font-semibold text-foreground mb-4">最近 IP 请求记录</h2>
        <RecentIpRequests data={recentIpRequests || []} loading={ipRequestsLoading} />
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl p-6 backdrop-blur-md bg-card border border-(--card-border) shadow-(--card-shadow)">
        <h2 className="text-lg font-semibold text-foreground mb-4">最近活动</h2>
        <RecentActivity activities={activities || []} isLoading={activitiesLoading} />
      </div>
    </div>
  );
};

export default HomePage;
