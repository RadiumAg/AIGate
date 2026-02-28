'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

type IdentifyBy = 'ip' | 'origin' | 'email' | 'userId';

const IDENTIFY_BY_LABELS: Record<IdentifyBy, string> = {
  ip: 'IP 地址',
  origin: 'Origin',
  email: 'Email',
  userId: 'User ID',
};

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  rpmLimit: number;
  identifyBy: IdentifyBy;
  validationPattern?: string;
  validationEnabled: boolean;
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
        accessorKey: 'identifyBy',
        header: '用户标识',
        cell: ({ row }) => {
          const identifyBy = row.original.identifyBy || 'email';
          const hasValidation =
            row.original.validationEnabled && (identifyBy === 'email' || identifyBy === 'userId');
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-900 dark:text-white">
                {IDENTIFY_BY_LABELS[identifyBy]}
              </span>
              {hasValidation && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  title={row.original.validationPattern || ''}
                >
                  校验
                </span>
              )}
            </div>
          );
        },
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
              <button
                onClick={() => onEdit(policy)}
                disabled={isLoading}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(policy.id)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                删除
              </button>
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
