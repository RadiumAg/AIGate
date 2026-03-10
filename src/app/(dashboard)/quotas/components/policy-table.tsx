'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  limitType: 'token' | 'request';
  dailyTokenLimit?: number;
  monthlyTokenLimit?: number;
  dailyRequestLimit?: number;
  rpmLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PolicyTableProps {
  policies: QuotaPolicy[];
  onEdit: (policy: QuotaPolicy) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const PolicyTable: React.FC<PolicyTableProps> = (props) => {
  const { policies, onEdit, onDelete, isLoading = false } = props;

  const columns: ColumnDef<QuotaPolicy>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: '策略名称',
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'description',
        header: '描述',
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-xs truncate block">
            {row.original.description || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'limitType',
        header: '限制类型',
        cell: ({ row }) => {
          const policy = row.original;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                policy.limitType === 'token'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  : 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30'
              }`}
            >
              {policy.limitType === 'token' ? 'Token 限制' : '请求次数'}
            </span>
          );
        },
      },
      {
        accessorKey: 'dailyLimit',
        header: '每日限额',
        cell: ({ row }) => {
          const policy = row.original;
          if (policy.limitType === 'token') {
            return (
              <span className="text-foreground">
                {policy.dailyTokenLimit?.toLocaleString() || '-'} Tokens
              </span>
            );
          } else {
            return (
              <span className="text-foreground">
                {policy.dailyRequestLimit?.toLocaleString() || '-'} 次
              </span>
            );
          }
        },
      },
      {
        accessorKey: 'monthlyTokenLimit',
        header: '每月限额',
        cell: ({ row }) => {
          const policy = row.original;
          if (policy.limitType === 'token' && policy.monthlyTokenLimit) {
            return (
              <span className="text-foreground">
                {policy.monthlyTokenLimit.toLocaleString()} Tokens
              </span>
            );
          }
          return <span className="text-muted-foreground/60">-</span>;
        },
      },
      {
        accessorKey: 'rpmLimit',
        header: 'RPM 限制',
        cell: ({ row }) => <span className="text-foreground">{row.original.rpmLimit}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: '创建时间',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-300">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">操作</div>,
        cell: ({ row }) => {
          const policy = row.original;

          return (
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(policy)}
                disabled={isLoading}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(policy.id)}
                disabled={isLoading}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                删除
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, isLoading]
  );

  const emptyIcon = (
    <div className="w-16 h-16 rounded-2xl backdrop-blur-lg bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 flex items-center justify-center">
      <FileText className="h-8 w-8 text-muted-foreground/60" />
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={policies}
      emptyMessage="暂无配额策略"
      emptyDescription="开始添加您的第一个配额策略"
      emptyIcon={emptyIcon}
    />
  );
};

export default PolicyTable;
