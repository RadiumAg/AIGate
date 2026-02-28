'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

interface UserData {
  id: string;
  name: string;
  email: string;
  tokensUsed: number;
  requests: number;
  status: 'active' | 'inactive';
}

interface UserListProps {
  users: UserData[];
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

const UserList: React.FC<UserListProps> = (props) => {
  const { users } = props;

  const columns: ColumnDef<UserData>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: '用户',
        cell: ({ row }) => (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                {row.original.name.charAt(0)}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-text-dark">
                {row.original.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">#{row.index + 1}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'tokensUsed',
        header: 'Token 消耗',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 dark:text-text-dark">
            {formatNumber(row.original.tokensUsed)}
          </span>
        ),
      },
      {
        accessorKey: 'requests',
        header: '请求次数',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 dark:text-text-dark">
            {formatNumber(row.original.requests)}
          </span>
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
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {row.original.status === 'active' ? '活跃' : '非活跃'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">操作</div>,
        cell: () => (
          <div className="flex justify-end space-x-2 text-sm font-medium">
            <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer">
              详情
            </button>
            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer">
              重置配额
            </button>
          </div>
        ),
      },
    ],
    []
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
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-text-dark">用户用量排行</h2>
      </div>
      <DataTable
        columns={columns}
        data={users}
        emptyMessage="暂无用户数据"
        emptyDescription="还没有用户使用您的服务"
        emptyIcon={emptyIcon}
      />
    </div>
  );
};

export default UserList;
