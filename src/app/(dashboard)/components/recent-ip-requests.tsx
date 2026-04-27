'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';

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

const RecentIpRequests: React.FC<RecentIpRequestsProps> = (props) => {
  const { data, loading = false } = props;
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // 计算分页
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      // 总页数小于等于7，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数大于7，显示省略号
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          'ellipsis',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          'ellipsis',
          totalPages
        );
      }
    }
    return pages;
  };

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
      case 'deepseek':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'kimi':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'minimax':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">暂无 IP 请求记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP 地址</TableHead>
            <TableHead>归属地</TableHead>
            <TableHead>用户</TableHead>
            <TableHead>模型</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {record.clientIp}
                </code>
              </TableCell>
              <TableCell>{record.region}</TableCell>
              <TableCell>
                <span className="text-muted-foreground break-all">{record.userId}</span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProviderColor(record.provider)}`}
                >
                  {record.model}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">{record.totalTokens.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatTime(record.timestamp)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 分页组件 */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default RecentIpRequests;
