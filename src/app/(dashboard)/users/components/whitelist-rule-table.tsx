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
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 backdrop-blur-sm">
            {row.original.priority}
          </span>
        ),
      },
      {
        accessorKey: 'policyName',
        header: '策略名称',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{row.original.policyName}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: '描述',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-xs truncate block">
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
            return <span className="text-sm text-muted-foreground/60">未启用</span>;
          }
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30 backdrop-blur-sm">
                已启用
              </span>
              {rule.validationPattern && (
                <code
                  className="text-xs bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded-lg max-w-[120px] truncate block border border-white/30 dark:border-white/10"
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
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm transition-all duration-200 ${
                rule.status === 'active'
                  ? 'text-green-700 dark:text-green-300 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30'
                  : 'text-red-700 dark:text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30'
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
          <span className="text-sm text-muted-foreground">{row.original.createdAt}</span>
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
                className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rule.id)}
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
    [onEdit, onDelete, onToggleStatus, isLoading]
  );

  const emptyIcon = (
    <div className="w-16 h-16 rounded-2xl backdrop-blur-lg bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 flex items-center justify-center">
      <FileText className="h-8 w-8 text-muted-foreground/60" />
    </div>
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
