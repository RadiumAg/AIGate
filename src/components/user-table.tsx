'use client';

import { FC, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './ui/data-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'vip';
  status: 'active' | 'inactive';
  createdAt: string;
  lastActive?: string;
  quotaPolicy: string;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    case 'vip':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return '管理员';
    case 'vip':
      return 'VIP用户';
    default:
      return '普通用户';
  }
};

const UserTable: FC<UserTableProps> = (props) => {
  const { users, onEdit, onDelete, onToggleStatus } = props;

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: '用户',
        cell: ({ row }) => (
          <div className="flex items-center">
            <div className="shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                {row.original.name.charAt(0)}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-text-dark">
                {row.original.name}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: '邮箱',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: '角色',
        cell: ({ row }) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(row.original.role)}`}
          >
            {getRoleLabel(row.original.role)}
          </span>
        ),
      },
      {
        accessorKey: 'quotaPolicy',
        header: '配额策略',
        cell: ({ row }) => (
          <span className="text-gray-900 dark:text-text-dark">{row.original.quotaPolicy}</span>
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
        accessorKey: 'lastActive',
        header: '最后活跃',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">{row.original.lastActive || '-'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(row.original.status)}`}
          >
            {row.original.status === 'active' ? '活跃' : '非活跃'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">操作</div>,
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => onToggleStatus(user.id)}
                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer"
              >
                {user.status === 'active' ? '禁用' : '启用'}
              </button>
              <button
                onClick={() => onEdit(user)}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
              >
                删除
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onToggleStatus]
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
    <DataTable
      columns={columns}
      data={users}
      emptyMessage="暂无用户"
      emptyDescription="开始添加您的第一个用户"
      emptyIcon={emptyIcon}
    />
  );
};

export default UserTable;