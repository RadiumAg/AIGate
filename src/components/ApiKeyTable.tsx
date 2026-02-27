import { FC } from 'react';
import type { ApiKey } from '../types/apiKey';

interface ApiKeyTableProps {
  keys: ApiKey[];
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onTest?: (key: ApiKey) => Promise<void>;
  isTestingId?: string | null;
}

const ApiKeyTable: FC<ApiKeyTableProps> = (props) => {
  const { keys, onEdit, onDelete, onToggleStatus, onTest, isTestingId } = props;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // 这里可以添加一个提示，告知用户已复制
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
                名称
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                服务商
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                API Key
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Base URL
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
                最后使用
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
            {keys.map((key) => (
              <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-text-dark">
                  {key.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {key.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <span className="mr-2">{key.key}</span>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  {key.baseUrl ? (
                    <span className="truncate block" title={key.baseUrl}>
                      {key.baseUrl}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">默认</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {key.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {key.lastUsed || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      key.status === 'active'
                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100'
                        : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100'
                    }`}
                  >
                    {key.status === 'active' ? '活跃' : '禁用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    {onTest && (
                      <button
                        onClick={() => onTest(key)}
                        disabled={isTestingId === key.id}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isTestingId === key.id ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            测试中
                          </>
                        ) : (
                          '测试'
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => onToggleStatus(key.id)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {key.status === 'active' ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => onEdit(key)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete(key.id)}
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
      {keys.length === 0 && (
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-text-dark">
            暂无 API 密钥
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            开始添加您的第一个 API 密钥
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiKeyTable;
