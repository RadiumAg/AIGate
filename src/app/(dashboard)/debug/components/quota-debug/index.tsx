'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { QuotaDebugProps, TabType, GetUserUsageResult, ResetQuotaResult } from './types';
import CheckQuotaTab from './check-quota-tab';
import UsageTab from './usage-tab';
import ResetTab from './reset-tab';
import { confirm } from '@/components/ui/confirm';

const QuotaDebug: React.FC<QuotaDebugProps> = ({ userId, apiKeyId }) => {
  const { t } = useTranslation();
  const [checkQuotaResult, setCheckQuotaResult] = React.useState<Record<string, any>>({});
  const [getUserUsageResult, setGetUserUsageResult] = React.useState<GetUserUsageResult | null>(
    null
  );
  const [resetQuotaResult, setResetQuotaResult] = React.useState<ResetQuotaResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>('check');

  const checkQuotaQuery = trpc.ai.getQuotaInfo.useMutation({ onSuccess() {} });
  const getUserUsageQuery = trpc.quota.getUserUsage.useQuery(
    { userId, apiKeyId },
    { enabled: false }
  );
  const resetQuotaMutation = trpc.quota.resetQuota.useMutation();

  const handleCheckQuota = async () => {
    if (!userId || !apiKeyId) {
      setCheckQuotaResult({ error: t('Debug.fillUserIdAndApiKey') as string });
      return;
    }
    try {
      const result = await checkQuotaQuery.mutateAsync({ userId, apiKeyId });
      if (result) {
        setCheckQuotaResult(result);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setCheckQuotaResult({ error: err.message || (t('Debug.checkQuotaFailed') as string) });
    }
  };

  const handleGetUserUsage = async () => {
    if (!userId || !apiKeyId) {
      setGetUserUsageResult({ error: t('Debug.fillUserIdAndApiKey') as string });
      return;
    }
    try {
      const result = await getUserUsageQuery.refetch();
      if (result.data) {
        setGetUserUsageResult(result.data as GetUserUsageResult);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setGetUserUsageResult({ error: err.message || (t('Debug.getUsageFailed') as string) });
    }
  };

  const handleResetQuota = async () => {
    if (!userId || !apiKeyId) {
      setResetQuotaResult({ error: t('Debug.fillUserIdAndApiKey') as string });
      return;
    }
    if (await confirm(t('Debug.confirmResetQuota') as string)) {
      return;
    }
    try {
      const result = await resetQuotaMutation.mutateAsync({
        userId,
        apiKeyId,
      });
      setResetQuotaResult(result as ResetQuotaResult);
    } catch (error: unknown) {
      const err = error as Error;
      setResetQuotaResult({ error: err.message || (t('Debug.resetQuotaFailed') as string) });
    }
  };

  const tabs = [
    { id: 'check' as TabType, label: t('Debug.tabCheckQuota') as string, icon: CheckCircle },
    { id: 'usage' as TabType, label: t('Debug.tabUsage') as string, icon: RefreshCw },
    { id: 'reset' as TabType, label: t('Debug.tabResetQuota') as string, icon: Trash2 },
  ];

  return (
    <div className="rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] overflow-hidden">
      <div className="p-6 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <div className="p-1.5 rounded-lg bg-primary/20 backdrop-blur-sm mr-2">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          {t('Debug.quotaDebug') as string}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('Debug.quotaDebugDesc') as string}</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Tab 切换 */}
        <div className="flex space-x-2 border-b border-white/20 dark:border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-white/10 hover:backdrop-blur-sm'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 参数显示 */}
        <div className="p-3 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/20 border border-white/30 dark:border-white/10">
          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">User ID:</span>
              <span className="ml-2 font-mono text-foreground">
                {userId || (t('Debug.notSet') as string)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">API Key ID:</span>
              <span className="ml-2 font-mono text-foreground">
                {apiKeyId || (t('Debug.notSelected') as string)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab 内容 */}
        {activeTab === 'check' && (
          <CheckQuotaTab
            userId={userId}
            apiKeyId={apiKeyId}
            result={checkQuotaResult}
            isLoading={checkQuotaQuery.isPending}
            onCheck={handleCheckQuota}
          />
        )}

        {activeTab === 'usage' && (
          <UsageTab
            userId={userId}
            apiKeyId={apiKeyId}
            result={getUserUsageResult}
            isLoading={getUserUsageQuery.isFetching}
            onGetUsage={handleGetUserUsage}
          />
        )}

        {activeTab === 'reset' && (
          <ResetTab
            userId={userId}
            apiKeyId={apiKeyId}
            result={resetQuotaResult}
            isLoading={resetQuotaMutation.isPending}
            onReset={handleResetQuota}
          />
        )}
      </div>
    </div>
  );
};

export default QuotaDebug;
