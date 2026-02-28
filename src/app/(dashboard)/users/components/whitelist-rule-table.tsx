'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

interface WhitelistRule {
  id: string;
  pattern: string;
  policyName: string;
  priority: number;
  status: 'active' | 'inactive';
  createdAt: string;
  description: string | null;
}

interface WhitelistRuleTableProps {
  rules: WhitelistRule[];
  onEdit: (rule: WhitelistRule) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isLoading?: boolean;
}

const WhitelistRuleTable: React.FC<WhitelistRuleTableProps> = (props) => {
  const { rules, onEdit, onDelete, onToggleStatus, isLoading = false } = props;

  const sortedRules = React.useMemo(
    () => [...rules].sort((a, b) => b.priority - a.priority),
    [rules]
  );

  const columns: ColumnDef<WhitelistRule>[] = React.useMemo(
    () => [
      {
        accessorKey: 'priority',
        header: '优先级',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {row.original.priority}
          </span>
        ),
      },
      {
        accessorKey: 'pattern',
        header: '匹配模式',
        cell: ({ row }) => (
          <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {row.original.pattern}
          </code>
        ),
      },
      {
        accessorKey: 'policyName',
        header: '策略名称',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 dark:text-white">{row.original.policyName}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: '描述',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate block">
            {row.original.description || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <button
              onClick={() => onToggleStatus(rule.id)}
              disabled={isLoading}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                rule.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {rule.status === 'active' ? '启用' : '禁用'}
            </button>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: '创建时间',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500 dark:text-gray-300">{row.original.createdAt}</span>
        ),
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(rule)}
                disabled={isLoading}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(rule.id)}
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
    [onEdit, onDelete, onToggleStatus, isLoading]
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
      data={sortedRules}
      emptyMessage="暂无白名单规则"
      emptyDescription="开始添加您的第一条白名单规则"
      emptyIcon={emptyIcon}
    />
  );
};

export default WhitelistRuleTable;
