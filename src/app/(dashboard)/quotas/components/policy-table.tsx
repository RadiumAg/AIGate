'use client';

import React, { FC } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
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

const PolicyTable: FC<PolicyTableProps> = (props) => {
  const { policies, onEdit, onDelete, isLoading = false } = props;

  const columns: ColumnDef<QuotaPolicy>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: '策略名称',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-white">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: '描述',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-300 max-w-xs truncate block">
            {row.original.description || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'dailyTokenLimit',
        header: '每日限额',
        cell: ({ row }) => (
          <span className="text-gray-900 dark:text-white">
            {row.original.dailyTokenLimit.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'monthlyTokenLimit',
        header: '每月限额',
        cell: ({ row }) => (
          <span className="text-gray-900 dark:text-white">
            {row.original.monthlyTokenLimit.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'rpmLimit',
        header: 'RPM 限制',
        cell: ({ row }) => (
          <span className="text-gray-900 dark:text-white">{row.original.rpmLimit}</span>
        ),
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
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(policy.id)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
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
