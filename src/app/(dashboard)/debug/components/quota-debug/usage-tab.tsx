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
          <h3 className="text-sm font-medium text-foreground">
            获取使用情况 (getUserUsage)
          </h3>
          <p className="text-xs text-muted-foreground">获取用户今日的使用统计</p>
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
        <div className="p-4 rounded-xl backdrop-blur-lg bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/30">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">今日使用统计</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 text-center">
                <p className="text-xs text-muted-foreground">已用 Tokens</p>
                <p className="text-xl font-semibold text-foreground">
                  {result.tokensUsed || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 text-center">
                <p className="text-xs text-muted-foreground">今日请求数</p>
                <p className="text-xl font-semibold text-foreground">
                  {result.requestsToday || 0}
                </p>
              </div>
            </div>
            {result.policy && (
              <div className="p-3 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10">
                <p className="text-xs font-medium text-foreground/70 mb-2">
                  当前策略: {result.policy.name}
                </p>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-muted-foreground">限制类型:</span>
                    <span className="ml-2 text-foreground">{result.policy.limitType}</span>
                  </div>
                </div>
              </div>
            )}
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                查看完整响应
              </summary>
              <pre className="mt-2 p-2 rounded-lg backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 text-xs overflow-x-auto">
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
