'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

interface WhitelistRule {
  id: string;
  policyName: string;
  priority: number;
  status: 'active' | 'inactive';
  validationPattern?: string | null;
  validationEnabled: boolean;
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
        accessorKey: 'validationEnabled',
        header: '校验规则',
        cell: ({ row }) => {
          const rule = row.original;
          if (!rule.validationEnabled) {
            return <span className="text-sm text-gray-400">未启用</span>;
          }
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                已启用
              </span>
              {rule.validationPattern && (
                <code
                  className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded max-w-[120px] truncate block"
                  title={rule.validationPattern}
                >
                  {rule.validationPattern}
                </code>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(rule.id)}
              disabled={isLoading}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rule.status === 'active'
                  ? 'text-green-700 bg-green-100 hover:bg-green-200'
                  : 'text-red-700 bg-red-100 hover:bg-red-200'
              }`}
            >
              {rule.status === 'active' ? '启用' : '禁用'}
            </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(rule)}
                disabled={isLoading}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rule.id)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                删除
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onToggleStatus, isLoading]
  );

  const emptyIcon = <FileText className="h-12 w-12 text-gray-400" />;

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
