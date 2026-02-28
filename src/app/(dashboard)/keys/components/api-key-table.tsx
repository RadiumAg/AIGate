'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { ApiKey } from '@/types/api-key';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

interface ApiKeyTableProps {
  keys: ApiKey[];
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onTest?: (key: ApiKey) => Promise<void>;
  isTestingId?: string | null;
}

const ApiKeyTable: React.FC<ApiKeyTableProps> = (props) => {
  const { keys, onEdit, onDelete, onToggleStatus, onTest, isTestingId } = props;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const columns: ColumnDef<ApiKey>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: '名称',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-text-dark">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'provider',
        header: '服务商',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">{row.original.provider}</span>
        ),
      },
      {
        accessorKey: 'key',
        header: 'API Key',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <span className="mr-2">{row.original.key}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(row.original.key)}
              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
          <div className="text-gray-500 dark:text-gray-400 max-w-xs">
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
          <span className="text-gray-500 dark:text-gray-400">{row.original.createdAt}</span>
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
                className="text-[var(--primary)] hover:text-[var(--primary)]/80"
              >
                {key.status === 'active' ? '禁用' : '启用'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(key)}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(key.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );

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
