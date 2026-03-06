'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { GetUserUsageResult } from './types';

interface UsageTabProps {
  userId: string;
  apiKeyId: string;
  result: GetUserUsageResult | null;
  onGetUsage: () => void;
  isLoading: boolean;
}

const UsageTab: React.FC<UsageTabProps> = ({ userId, apiKeyId, result, onGetUsage, isLoading }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-800 dark:text-white">
            获取使用情况 (getUserUsage)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">获取用户今日的使用统计</p>
        </div>
        <Button onClick={onGetUsage} disabled={isLoading || !userId || !apiKeyId} size="sm">
          {isLoading ? (
            <>
              <Spinner className="-ml-1 mr-2 h-3 w-3" />
              获取中...
            </>
          ) : (
            '获取数据'
          )}
        </Button>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">今日使用统计</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">已用 Tokens</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-white">
                  {result.tokensUsed || 0}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">今日请求数</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-white">
                  {result.requestsToday || 0}
                </p>
              </div>
            </div>
            {result.policy && (
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  当前策略: {result.policy.name}
                </p>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-gray-500">限制类型:</span>
                    <span className="ml-2">{result.policy.limitType}</span>
                  </div>
                </div>
              </div>
            )}
            <details>
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                查看完整响应
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageTab;
