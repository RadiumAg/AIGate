'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { ResetQuotaResult } from './types';

interface ResetTabProps {
  userId: string;
  apiKeyId: string;
  result: ResetQuotaResult | null;
  onReset: () => void;
  isLoading: boolean;
}

const ResetTab: React.FC<ResetTabProps> = ({ userId, apiKeyId, result, onReset, isLoading }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            重置配额 (resetQuota)
          </h3>
          <p className="text-xs text-muted-foreground">
            重置用户今日的配额计数（谨慎操作）
          </p>
        </div>
        <Button
          onClick={onReset}
          disabled={isLoading || !userId || !apiKeyId}
          variant="destructive"
          size="sm"
        >
          {isLoading ? (
            <>
              <Spinner className="-ml-1 mr-2 h-3 w-3" />
              重置中...
            </>
          ) : (
            <>
              <Trash2 className="-ml-1 mr-2 h-3 w-3" />
              重置配额
            </>
          )}
        </Button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-xl backdrop-blur-lg ${
            result.error
              ? 'bg-red-500/10 dark:bg-red-500/10 border border-red-500/30'
              : 'bg-green-500/10 dark:bg-green-500/10 border border-green-500/30'
          }`}
        >
          {result.error ? (
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">{result.error}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                配额重置成功
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResetTab;
