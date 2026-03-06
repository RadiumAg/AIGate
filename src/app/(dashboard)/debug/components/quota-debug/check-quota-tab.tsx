'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface CheckQuotaTabProps {
  userId: string;
  apiKeyId: string;
  result: Record<string, any>;
  isLoading: boolean;
  onCheck: () => void;
}

const CheckQuotaTab: React.FC<CheckQuotaTabProps> = ({
  userId,
  apiKeyId,
  result,
  isLoading,
  onCheck,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-800 dark:text-white">
            检查配额 (checkQuota)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            检查用户是否有足够的配额进行请求
          </p>
        </div>
        <Button onClick={onCheck} disabled={isLoading || !userId || !apiKeyId} size="sm">
          {isLoading ? (
            <>
              <Spinner className="-ml-1 mr-2 h-3 w-3" />
              检查中...
            </>
          ) : (
            '执行检查'
          )}
        </Button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-md ${
            result.error
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : result.allowed
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}
        >
          {result.error ? (
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-800 dark:text-red-200">{result.error}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                {result.remaining && (
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    {result?.remaining?.type === 'token'
                      ? `剩余token ${result?.remaining?.daily}`
                      : `剩余请求次数 ${result?.remaining?.daily}`}
                  </span>
                )}
              </div>
              {result.policy && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    配额策略
                  </p>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-gray-500">策略名称:</span>
                      <span className="ml-2">{result.policy.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">限制类型:</span>
                      <span className="ml-2">{result.policy.limitType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">每日限制:</span>
                      <span className="ml-2">
                        {result.policy.limitType === 'token'
                          ? result.policy.dailyTokenLimit
                          : result.policy.dailyRequestLimit}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">RPM 限制:</span>
                      <span className="ml-2">{result.policy.rpmLimit}</span>
                    </div>
                  </div>
                </div>
              )}
              {(result.remainingTokens !== undefined || result.remainingRequests !== undefined) && (
                <div className="mt-2 text-xs">
                  {result.remainingTokens !== undefined && (
                    <div>
                      <span className="text-gray-500">剩余 Tokens:</span>
                      <span className="ml-2 font-mono">{result.remainingTokens}</span>
                    </div>
                  )}
                  {result.remainingRequests !== undefined && (
                    <div>
                      <span className="text-gray-500">剩余请求次数:</span>
                      <span className="ml-2 font-mono">{result.remainingRequests}</span>
                    </div>
                  )}
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  查看完整响应
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckQuotaTab;
