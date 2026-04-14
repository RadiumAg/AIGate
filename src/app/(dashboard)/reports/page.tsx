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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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

  // 分页状态
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

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
      [
        t('Reports.table.time'),
        t('Reports.table.userId'),
        t('Reports.table.ipAddress'),
        t('Reports.table.region'),
        t('Reports.table.model'),
        t('Reports.table.provider'),
        t('Reports.table.tokenCount'),
      ].join(','),
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

  // 分页数据
  const paginatedRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  // 获取唯一的模型和提供商列表
  const uniqueModels = React.useMemo(() => {
    if (!modelDistribution) return [];
    return modelDistribution.map((m) => m.name);
  }, [modelDistribution]);

  const uniqueProviders = React.useMemo(() => {
    if (!usageRecords) return [];
    return Array.from(new Set(usageRecords.map((r) => r.provider)));
  }, [usageRecords]);

  // 重置页码当筛选条件变化时
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModel, selectedProvider, startDate, endDate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('Reports.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">{t('Reports.subtitle')}</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatSummaryCard
          title={t('Reports.totalRequests')}
          value={stats?.requests.value.toLocaleString() || '-'}
          subtitle={
            stats
              ? t('Reports.comparedToLast', {
                  change: `${stats.requests.change > 0 ? '+' : ''}${stats.requests.change}%`,
                })
              : undefined
          }
          trend={stats?.requests.trend as 'up' | 'down' | 'neutral'}
          icon={<BarChart3 className="w-5 h-5 text-indigo-500" />}
        />
        <StatSummaryCard
          title={t('Reports.tokenConsumption')}
          value={stats?.tokens.value.toLocaleString() || '-'}
          subtitle={
            stats
              ? t('Reports.comparedToLast', {
                  change: `${stats.tokens.change > 0 ? '+' : ''}${stats.tokens.change}%`,
                })
              : undefined
          }
          trend={stats?.tokens.trend as 'up' | 'down' | 'neutral'}
          icon={<FileText className="w-5 h-5 text-emerald-500" />}
        />
        <StatSummaryCard
          title={t('Reports.activeUsers')}
          value={stats?.activeUsers.value.toLocaleString() || '-'}
          subtitle={
            stats
              ? t('Reports.comparedToLast', {
                  change: `${stats.activeUsers.change > 0 ? '+' : ''}${stats.activeUsers.change}%`,
                })
              : undefined
          }
          trend={stats?.activeUsers.trend as 'up' | 'down' | 'neutral'}
          icon={<Users className="w-5 h-5 text-amber-500" />}
        />
        <StatSummaryCard
          title={t('Reports.coveredRegions')}
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
                placeholder={t('Reports.searchPlaceholder')}
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
                <SelectValue placeholder={t('Reports.allModels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Reports.allModels')}</SelectItem>
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
                <SelectValue placeholder={t('Reports.allProviders')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Reports.allProviders')}</SelectItem>
                {uniqueProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 导出按钮 */}
            <Button onClick={handleExport} disabled={!usageRecords || usageRecords.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {t('Reports.exportCsv')}
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
            {t('Reports.detailedRecords')}
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({t('Reports.recordsCount', { count: filteredRecords.length })})
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
              <p>{t('Reports.noData')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-600 dark:text-slate-400">
                    {t('Reports.table.time')}
                  </TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">
                    {t('Reports.table.userId')}
                  </TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">
                    {t('Reports.table.ipAddress')}
                  </TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">
                    {t('Reports.table.region')}
                  </TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">
                    {t('Reports.table.model')}
                  </TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">
                    {t('Reports.table.provider')}
                  </TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400 text-right">
                    {t('Reports.table.tokenCount')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
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

        {/* 分页控件 */}
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="text-sm  min-w-max text-slate-600 dark:text-slate-400">
              {t('Reports.pagination.showing', {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, filteredRecords.length),
                total: filteredRecords.length,
              })}
            </div>
            <Pagination className="flex-1">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    className={cn(
                      'bg-white/50 dark:bg-black/20 border-white/20 hover:bg-white/70 dark:hover:bg-black/30',
                      currentPage === 1 && 'pointer-events-none opacity-50'
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  // 显示省略号逻辑
                  if (totalPages > 5) {
                    if (currentPage > 3 && i === 0) {
                      return (
                        <PaginationItem key="start-ellipsis">
                          <PaginationEllipsis className="text-slate-600 dark:text-slate-400" />
                        </PaginationItem>
                      );
                    }
                    if (currentPage < totalPages - 2 && i === 4) {
                      return (
                        <PaginationItem key="end-ellipsis">
                          <PaginationEllipsis className="text-slate-600 dark:text-slate-400" />
                        </PaginationItem>
                      );
                    }
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={cn(
                      'bg-white/50 dark:bg-black/20 border-white/20 hover:bg-white/70 dark:hover:bg-black/30',
                      currentPage === totalPages && 'pointer-events-none opacity-50'
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
