'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import CombinedTrendChart from '@/app/(dashboard)/components/combined-trend-chart';
import ModelDistributionChart from '@/app/(dashboard)/components/model-distribution-chart';
import RegionHeatmapChart from '@/app/(dashboard)/components/region-headmap-chart';
import RecentIpRequests from '@/app/(dashboard)/components/recent-ip-requests';
import StatCard from './components/stat-card';
import RecentActivity from './components/recent-activity';
import DateRangePicker from '@/components/date-range-picker';
import DatePickerWithRange from '@/components/date-picker-with-range';
import { Users, BarChart3, Coins, UserCheck } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

const HomePage: React.FC = () => {
  const { t, locale } = useTranslation();

  // 日期范围状态
  const [dateRange, setDateRange] = React.useState<
    'today' | 'yesterday' | '7days' | '30days' | 'custom'
  >('today');
  const [customStartDate, setCustomStartDate] = React.useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = React.useState<Date>(new Date());
  const [currentTime, setCurrentTime] = React.useState<string>('');

  React.useEffect(() => {
    setCurrentTime(new Date().toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US'));
  }, [locale]);

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
    trpc.dashboard.getRecentIpRequests.useQuery({ startDate: queryStart, endDate: queryEnd });

  return (
    <div className="space-y-6">
      {/* Header with Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/60 dark:bg-black/30 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <h1 className="text-2xl font-bold text-foreground">{t('Dashboard.title') as string}</h1>
        <p className="text-muted-foreground mt-2">{t('Dashboard.subtitle') as string}</p>
      </div>

      {/* 日期筛选器 - Liquid Glass */}
      <div className="flex justify-between items-center rounded-2xl p-4 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]">
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
          {t('Dashboard.dataUpdateTime') as string}: {currentTime}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('Dashboard.totalUsers') as string}
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
          title={t('Dashboard.requests') as string}
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
          title={t('Dashboard.tokenUsage') as string}
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
          title={t('Dashboard.activeUsers') as string}
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

      {/* Charts - Side by Side Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {/* 使用趋势（请求/Token/费用） */}
        <div className="xl:col-span-1 2xl:col-span-1 rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t('Dashboard.usageTrend') as string}
          </h2>
          <CombinedTrendChart data={usageTrend || []} loading={trendLoading} />
        </div>

        {/* 模型使用分布 */}
        <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t('Dashboard.modelDistribution') as string}
          </h2>
          <ModelDistributionChart data={modelDistribution || []} loading={distributionLoading} />
        </div>

        {/* 请求地区分布 */}
        <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t('Dashboard.regionDistribution') as string}
          </h2>
          <RegionHeatmapChart data={regionDistribution || []} loading={regionLoading} />
        </div>
      </div>

      {/* Recent IP Requests - Enhanced Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t('Dashboard.recentIpRequests') as string}
        </h2>
        <RecentIpRequests data={recentIpRequests || []} loading={ipRequestsLoading} />
      </div>

      {/* Recent Activity - Enhanced Liquid Glass */}
      <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t('Dashboard.recentActivity') as string}
        </h2>
        <RecentActivity activities={activities || []} isLoading={activitiesLoading} />
      </div>
    </div>
  );
};

export default HomePage;
