'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { useTranslation } from '@/i18n/client';
import DatePickerWithRange from '@/components/date-picker-with-range';
import { StatSummaryCard, glassCardVariants } from '@/components/stat-summary-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Download, Search, Filter, FileText, BarChart3, Globe, Users } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

// 主报表页面
const ReportsPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState<string>('all');
  const [selectedProvider, setSelectedProvider] = React.useState<string>('all');
  const [startDate, setStartDate] = React.useState<Date>(addDays(new Date(), -30));
  const [endDate, setEndDate] = React.useState<Date>(new Date());

  // 获取统计数据
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(
    {
      startDate,
      endDate,
    },
    {
      enabled: !!startDate && !!endDate,
    }
  );

  // 获取详细使用记录
  const { data: usageRecords, isLoading: recordsLoading } =
    trpc.dashboard.getRecentIpRequests.useQuery(
      {
        startDate,
        endDate,
        days: 30,
      },
      {
        enabled: !!startDate && !!endDate,
      }
    );

  // 获取模型分布
  const { data: modelDistribution } = trpc.dashboard.getModelDistribution.useQuery(
    {
      startDate,
      endDate,
    },
    {
      enabled: !!startDate && !!endDate,
    }
  );

  // 导出数据
  const handleExport = () => {
    if (!usageRecords) return;

    const csvContent = [
      ['时间', '用户ID', 'IP地址', '地区', '模型', '提供商', 'Token数'].join(','),
      ...usageRecords.map((record) =>
        [
          format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          record.userId,
          record.clientIp,
          record.region,
          record.model,
          record.provider,
          record.totalTokens,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usage-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // 过滤记录
  const filteredRecords = React.useMemo(() => {
    if (!usageRecords) return [];
    return usageRecords.filter((record) => {
      const matchesSearch =
        !searchQuery ||
        record.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.clientIp.includes(searchQuery) ||
        record.region.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModel = selectedModel === 'all' || record.model === selectedModel;
      const matchesProvider = selectedProvider === 'all' || record.provider === selectedProvider;

      return matchesSearch && matchesModel && matchesProvider;
    });
  }, [usageRecords, searchQuery, selectedModel, selectedProvider]);

  // 获取唯一的模型和提供商列表
  const uniqueModels = React.useMemo(() => {
    if (!modelDistribution) return [];
    return modelDistribution.map((m) => m.name);
  }, [modelDistribution]);

  const uniqueProviders = React.useMemo(() => {
    if (!usageRecords) return [];
    return Array.from(new Set(usageRecords.map((r) => r.provider)));
  }, [usageRecords]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">数据报表中心</h1>
        <p className="text-slate-600 dark:text-slate-400">查看和分析所有 API 使用数据</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatSummaryCard
          title="总请求数"
          value={stats?.requests.value.toLocaleString() || '-'}
          subtitle={
            stats
              ? `较上期 ${stats.requests.change > 0 ? '+' : ''}${stats.requests.change}%`
              : undefined
          }
          trend={stats?.requests.trend as 'up' | 'down' | 'neutral'}
          icon={<BarChart3 className="w-5 h-5 text-indigo-500" />}
        />
        <StatSummaryCard
          title="Token 消耗"
          value={stats?.tokens.value.toLocaleString() || '-'}
          subtitle={
            stats
              ? `较上期 ${stats.tokens.change > 0 ? '+' : ''}${stats.tokens.change}%`
              : undefined
          }
          trend={stats?.tokens.trend as 'up' | 'down' | 'neutral'}
          icon={<FileText className="w-5 h-5 text-emerald-500" />}
        />
        <StatSummaryCard
          title="活跃用户数"
          value={stats?.activeUsers.value.toLocaleString() || '-'}
          subtitle={
            stats
              ? `较上期 ${stats.activeUsers.change > 0 ? '+' : ''}${stats.activeUsers.change}%`
              : undefined
          }
          trend={stats?.activeUsers.trend as 'up' | 'down' | 'neutral'}
          icon={<Users className="w-5 h-5 text-amber-500" />}
        />
        <StatSummaryCard
          title="覆盖地区"
          value={new Set(usageRecords?.map((r) => r.region)).size || '-'}
          icon={<Globe className="w-5 h-5 text-rose-500" />}
        />
      </div>

      {/* 筛选和搜索 */}
      <Card
        className={cn(
          'p-6 mb-6 overflow-hidden rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          glassCardVariants.thin
        )}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 日期范围选择 */}
            <DatePickerWithRange
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />

            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索用户、IP、地区..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-white/50 dark:bg-black/20 border-white/20"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {/* 模型筛选 */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40 bg-white/50 dark:bg-black/20 border-white/20">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模型</SelectItem>
                {uniqueModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 提供商筛选 */}
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-40 bg-white/50 dark:bg-black/20 border-white/20">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="选择提供商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部提供商</SelectItem>
                {uniqueProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 导出按钮 */}
            <Button
              onClick={handleExport}
              disabled={!usageRecords || usageRecords.length === 0}
              className="bg-indigo-500/80 hover:bg-indigo-600/80 backdrop-blur-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              导出 CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card
        className={cn(
          'p-6 overflow-hidden rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          glassCardVariants.thick
        )}
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            详细使用记录
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({filteredRecords.length} 条记录)
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          {recordsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-indigo-500" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-600 dark:text-slate-400">时间</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">用户ID</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">IP地址</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">地区</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">模型</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">提供商</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400 text-right">
                    Token数
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-white/5 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-700 dark:text-slate-300">
                      {record.userId}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-700 dark:text-slate-300">
                      {record.clientIp}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {record.region}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        {record.model}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {record.provider}
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                      {record.totalTokens.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
