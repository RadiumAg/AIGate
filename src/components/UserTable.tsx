import { FC } from 'react';

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

const UserTable: FC<UserTableProps> = (props) => {
  const { users, onEdit, onDelete, onToggleStatus } = props;

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

  return (
    <div className="bg-white dark:bg-card-dark rounded-xl shadow-card-light dark:shadow-card-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                用户
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                邮箱
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                角色
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                配额策略
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                创建时间
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                最后活跃
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                状态
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-card-dark divide-y divide-gray-200 dark:divide-slate-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                        {user.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-text-dark">
                        {user.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}
                  >
                    {user.role === 'admin' && '管理员'}
                    {user.role === 'vip' && 'VIP用户'}
                    {user.role === 'user' && '普通用户'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-text-dark">
                  {user.quotaPolicy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.lastActive || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}
                  >
                    {user.status === 'active' ? '活跃' : '非活跃'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => onToggleStatus(user.id)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {user.status === 'active' ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-text-dark">暂无用户</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">开始添加您的第一个用户</p>
        </div>
      )}
    </div>
  );
};

export default UserTable;
