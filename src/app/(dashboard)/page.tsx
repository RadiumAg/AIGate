'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import UsageTrendChart from '@/app/(dashboard)/components/usage-trend-chart';
import ModelDistributionChart from '@/app/(dashboard)/components/model-distribution-chart';
import RegionHeatmapChart from '@/app/(dashboard)/components/region-heatmap-chart';
import RecentIpRequests from '@/app/(dashboard)/components/recent-ip-requests';
import StatCard from './components/stat-card';
import RecentActivity from './components/recent-activity';
import DateRangePicker from '@/components/date-range-picker';
import DatePickerWithRange from '@/components/date-picker-with-range';
import { Users, BarChart3, Coins, UserCheck } from 'lucide-react';

const HomePage: React.FC = () => {
  // 日期范围状态
  const [dateRange, setDateRange] = React.useState<
    'today' | 'yesterday' | '7days' | '30days' | 'custom'
  >('today');
  const [customStartDate, setCustomStartDate] = React.useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = React.useState<Date>(new Date());
  const [currentTime, setCurrentTime] = React.useState<string>('');

  React.useEffect(() => {
    setCurrentTime(new Date().toLocaleString('zh-CN'));
  }, []);

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
      endDate: queryEnd,
    });

  // 获取使用趋势
  const { data: usageTrend, isLoading: trendLoading } = trpc.dashboard.getUsageTrend.useQuery({
    startDate: queryStart,
    endDate: queryEnd,
  });

  // 获取模型分布
  const { data: modelDistribution, isLoading: distributionLoading } =
    trpc.dashboard.getModelDistribution.useQuery({
      startDate: queryStart,
      endDate: queryEnd,
    });

  // 获取地区分布
  const { data: regionDistribution, isLoading: regionLoading } =
    trpc.dashboard.getRegionDistribution.useQuery({
      startDate: queryStart,
      endDate: queryEnd,
    });

  // 获取最近 IP 请求记录
  const { data: recentIpRequests, isLoading: ipRequestsLoading } =
    trpc.dashboard.getRecentIpRequests.useQuery();

  return (
    <div className="space-y-6">
      {/* Header with Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/60 dark:bg-black/30 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <h1 className="text-2xl font-bold text-foreground">仪表板</h1>
        <p className="text-muted-foreground mt-2">欢迎来到 AIGate 管理后台</p>
      </div>

      {/* 日期筛选器 - Liquid Glass */}
      <div className="flex justify-between items-center rounded-xl p-4 backdrop-blur-lg bg-white/40 dark:bg-white/5 border border-white/25 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          {dateRange === 'custom' && (
            <DatePickerWithRange
              startDate={customStartDate}
              endDate={customEndDate}
              onDateRangeChange={(start: Date, end: Date) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
            />
          )}
        </div>
        <div className="text-sm text-muted-foreground font-medium" suppressHydrationWarning>
          数据更新时间: {currentTime}
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

      {/* Charts - Enhanced Liquid Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">近期请求趋势</h2>
          <UsageTrendChart data={usageTrend || []} loading={trendLoading} />
        </div>

        <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">模型使用分布</h2>
          <ModelDistributionChart data={modelDistribution || []} loading={distributionLoading} />
        </div>
      </div>

      {/* Region Heatmap - Enhanced Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
        <h2 className="text-lg font-semibold text-foreground mb-4">请求地区分布</h2>
        <RegionHeatmapChart data={regionDistribution || []} loading={regionLoading} />
      </div>

      {/* Recent IP Requests - Enhanced Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
        <h2 className="text-lg font-semibold text-foreground mb-4">最近 IP 请求记录</h2>
        <RecentIpRequests data={recentIpRequests || []} loading={ipRequestsLoading} />
      </div>

      {/* Recent Activity - Enhanced Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
        <h2 className="text-lg font-semibold text-foreground mb-4">最近活动</h2>
        <RecentActivity activities={activities || []} isLoading={activitiesLoading} />
      </div>
    </div>
  );
};

export default HomePage;
