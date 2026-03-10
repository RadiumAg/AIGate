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
          <h3 className="text-sm font-medium text-foreground">
            检查配额 (checkQuota)
          </h3>
          <p className="text-xs text-muted-foreground">
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
          className={`p-4 rounded-xl backdrop-blur-lg ${
            result.error
              ? 'bg-red-500/10 dark:bg-red-500/10 border border-red-500/30'
              : result.allowed
                ? 'bg-green-500/10 dark:bg-green-500/10 border border-green-500/30'
                : 'bg-yellow-500/10 dark:bg-yellow-500/10 border border-yellow-500/30'
          }`}
        >
          {result.error ? (
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">{result.error}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                {result.remaining && (
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {result?.remaining?.type === 'token'
                      ? `剩余token ${result?.remaining?.daily}`
                      : `剩余请求次数 ${result?.remaining?.daily}`}
                  </span>
                )}
              </div>
              {result.policy && (
                <div className="mt-3 p-3 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10">
                  <p className="text-xs font-medium text-foreground/70 mb-2">
                    配额策略
                  </p>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-muted-foreground">策略名称:</span>
                      <span className="ml-2 text-foreground">{result.policy.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">限制类型:</span>
                      <span className="ml-2 text-foreground">{result.policy.limitType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">每日限制:</span>
                      <span className="ml-2 text-foreground">
                        {result.policy.limitType === 'token'
                          ? result.policy.dailyTokenLimit
                          : result.policy.dailyRequestLimit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RPM 限制:</span>
                      <span className="ml-2 text-foreground">{result.policy.rpmLimit}</span>
                    </div>
                  </div>
                </div>
              )}
              {(result.remainingTokens !== undefined || result.remainingRequests !== undefined) && (
                <div className="mt-2 text-xs">
                  {result.remainingTokens !== undefined && (
                    <div>
                      <span className="text-muted-foreground">剩余 Tokens:</span>
                      <span className="ml-2 font-mono text-foreground">{result.remainingTokens}</span>
                    </div>
                  )}
                  {result.remainingRequests !== undefined && (
                    <div>
                      <span className="text-muted-foreground">剩余请求次数:</span>
                      <span className="ml-2 font-mono text-foreground">{result.remainingRequests}</span>
                    </div>
                  )}
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                  查看完整响应
                </summary>
                <pre className="mt-2 p-2 rounded-lg backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 text-xs overflow-x-auto">
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
