'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { ResetQuotaResult } from './types';

interface ResetTabProps {
  userId: string;
  apiKeyId: string;
  result: ResetQuotaResult | null;
  onReset: () => void;
  isLoading: boolean;
}

const ResetTab: React.FC<ResetTabProps> = ({ userId, apiKeyId, result, onReset, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {t('Debug.resetQuotaTitle') as string}
          </h3>
          <p className="text-xs text-muted-foreground">{t('Debug.resetQuotaDesc') as string}</p>
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
              {t('Debug.resetting') as string}
            </>
          ) : (
            <>
              <Trash2 className="-ml-1 mr-2 h-3 w-3" />
              {t('Debug.resetQuota') as string}
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
                {t('Debug.quotaResetSuccess') as string}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResetTab;
