'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, KeyRound } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { ApiKey } from '@/types/api-key';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ApiKeyTableProps {
  keys: ApiKey[];
  isTestingId?: string | null;
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onTest?: (key: ApiKey) => Promise<void>;
}

const ApiKeyTable: React.FC<ApiKeyTableProps> = (props) => {
  const { keys, onEdit, onDelete, onToggleStatus, onTest, isTestingId } = props;

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('已复制到剪贴板');
  };

  const columns: ColumnDef<ApiKey>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: '名称',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-white">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'provider',
        header: '服务商',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-white">{row.original.provider}</span>
        ),
      },
      {
        accessorKey: 'apiKeyId',
        header: 'API Key Id',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-500 dark:text-white">
            <span className="mr-2">{row.original.id}</span>
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
        header: 'API Key',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-500 dark:text-white">
            <span className="mr-2">{row.original.key}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopyToClipboard(row.original.originKey)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'baseUrl',
        header: 'Base URL',
        cell: ({ row }) => (
          <div className="text-gray-500 dark:text-white max-w-xs">
            {row.original.baseUrl ? (
              <span className="truncate block" title={row.original.baseUrl}>
                {row.original.baseUrl}
              </span>
            ) : (
              <span className="text-gray-400 italic">默认</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: '创建时间',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-white">{row.original.createdAt}</span>
        ),
      },
      {
        accessorKey: 'lastUsed',
        header: '最后使用',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">{row.original.lastUsed || '-'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              row.original.status === 'active'
                ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100'
                : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100'
            }`}
          >
            {row.original.status === 'active' ? '活跃' : '禁用'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">操作</div>,
        cell: ({ row }) => {
          const key = row.original;
          const isTesting = isTestingId === key.id;

          return (
            <div className="flex justify-end space-x-3">
              {onTest && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTest(key)}
                  disabled={isTesting}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {isTesting ? (
                    <>
                      <Spinner className="-ml-1 mr-1 h-3 w-3" />
                      测试中
                    </>
                  ) : (
                    '测试'
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(key.id)}
                className="text-primary hover:text-(--primary)/80 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {key.status === 'active' ? '禁用' : '启用'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(key)}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(key.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                删除
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onToggleStatus, onTest, isTestingId]
  );

  const emptyIcon = <KeyRound className="h-12 w-12 text-gray-400" />;

  return (
    <DataTable
      columns={columns}
      data={keys}
      emptyMessage="暂无 API 密钥"
      emptyDescription="开始添加您的第一个 API 密钥"
      emptyIcon={emptyIcon}
    />
  );
};

export default ApiKeyTable;
