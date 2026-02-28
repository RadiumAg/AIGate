'use client';

import React from 'react';

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

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                优先级
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                匹配模式
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                策略名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {rule.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {rule.pattern}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {rule.policyName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                  {rule.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(rule.id)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      rule.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {rule.status === 'active' ? '启用' : '禁用'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {rule.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(rule)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete(rule.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {sortedRules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">暂无白名单规则</p>
        </div>
      )}
    </div>
  );
};

export default WhitelistRuleTable;
