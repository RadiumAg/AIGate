'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, KeyRound } from 'lucide-react';
import type { ApiKey } from '@/types/api-key';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/client';
import { useMemoizedFn } from 'ahooks';

interface ApiKeyTableProps {
  keys: ApiKey[];
  isTestingId?: string | null;
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onTest?: (key: ApiKey) => Promise<void>;
}

const ApiKeyTable: React.FC<ApiKeyTableProps> = (props) => {
  const { keys, onEdit, onDelete, onToggleStatus } = props;
  const { t } = useTranslation();

  const handleCopyToClipboard = useMemoizedFn((text: string) => {
    navigator.clipboard.writeText(text);
    toast(t('ApiKey.copied') as string);
  });

  const columns: ColumnDef<ApiKey>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('ApiKey.name') as string,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'provider',
        header: t('ApiKey.provider') as string,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.provider}</span>,
      },
      {
        accessorKey: 'apiKeyId',
        header: 'API Key ID',
        cell: ({ row }) => (
          <div className="flex items-center text-muted-foreground">
            <span className="mr-2">{row.original.maskId}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopyToClipboard(row.original.id)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'key',
        header: t('ApiKey.apiKey') as string,
        cell: ({ row }) => (
          <div className="flex items-center text-gray-500 dark:text-white">
            <span className="mr-2">{row.original.maskKey}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopyToClipboard(row.original.key)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'baseUrl',
        header: t('ApiKey.baseUrl') as string,
        cell: ({ row }) => (
          <div className="text-muted-foreground max-w-xs">
            {row.original.baseUrl ? (
              <span className="truncate block" title={row.original.baseUrl}>
                {row.original.baseUrl}
              </span>
            ) : (
              <span className="text-muted-foreground/60 italic">
                {t('ApiKey.default') as string}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('ApiKey.createdAt') as string,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.createdAt}</span>,
      },
      {
        accessorKey: 'lastUsed',
        header: t('ApiKey.lastUsed') as string,
        cell: ({ row }) => (
          <span className="text-muted-foreground/80">{row.original.lastUsed || '-'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('ApiKey.status') as string,
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg backdrop-blur-sm ${
              row.original.status === 'active'
                ? 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30'
                : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
            }`}
          >
            {
              (row.original.status === 'active'
                ? t('ApiKey.activeStatus')
                : t('ApiKey.disabledStatus')) as string
            }
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('ApiKey.actions') as string}</div>,
        cell: ({ row }) => {
          const key = row.original;

          return (
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(key.id)}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                {(key.status === 'active' ? t('ApiKey.disable') : t('ApiKey.enable')) as string}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(key)}
                className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
              >
                {t('ApiKey.edit') as string}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(key.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                {t('ApiKey.delete') as string}
              </Button>
            </div>
          );
        },
      },
    ],
    [onDelete, onEdit, onToggleStatus, t, handleCopyToClipboard]
  );

  const emptyIcon = (
    <div className="w-16 h-16 rounded-2xl backdrop-blur-lg bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 flex items-center justify-center">
      <KeyRound className="h-8 w-8 text-muted-foreground/60" />
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={keys}
      emptyMessage={t('ApiKey.noKeys') as string}
      emptyDescription={t('ApiKey.addFirstKey') as string}
      emptyIcon={emptyIcon}
    />
  );
};

export default ApiKeyTable;
