'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/client';

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
  isLoading?: boolean;
  onEdit: (rule: WhitelistRule) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const WhitelistRuleTable: React.FC<WhitelistRuleTableProps> = (props) => {
  const { rules, onEdit, onDelete, onToggleStatus, isLoading = false } = props;
  const { t } = useTranslation();

  const sortedRules = React.useMemo(
    () => [...rules].sort((a, b) => b.priority - a.priority),
    [rules]
  );

  const columns: ColumnDef<WhitelistRule>[] = React.useMemo(
    () => [
      {
        accessorKey: 'priority',
        header: t('Whitelist.priority'),
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 backdrop-blur-sm">
            {row.original.priority}
          </span>
        ),
      },
      {
        accessorKey: 'policyName',
        header: t('Whitelist.policyName'),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{row.original.policyName}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('Common.description'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-xs truncate block">
            {row.original.description || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'validationEnabled',
        header: t('Whitelist.validationRule'),
        cell: ({ row }) => {
          const rule = row.original;
          if (!rule.validationEnabled) {
            return (
              <span className="text-sm text-muted-foreground/60">{t('Whitelist.disabled')}</span>
            );
          }
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30 backdrop-blur-sm">
                {t('Whitelist.enabled')}
              </span>
              {rule.validationPattern && (
                <code
                  className="text-xs bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded-lg max-w-30 truncate block border border-white/30 dark:border-white/10"
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
        header: t('Common.status'),
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
              {rule.status === 'active' ? t('Common.active') : t('Common.inactive')}
            </Button>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('Common.createdAt'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.createdAt}</span>
        ),
      },
      {
        id: 'actions',
        header: t('Common.actions'),
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
                {t('Common.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rule.id)}
                disabled={isLoading}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                {t('Common.delete')}
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onToggleStatus, isLoading, t]
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
      emptyMessage={t('Whitelist.noRules')}
      emptyDescription={t('Whitelist.addFirstRule')}
      emptyIcon={emptyIcon}
    />
  );
};

export default WhitelistRuleTable;
