'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import {
  QuotaDebugProps,
  TabType,
  CheckQuotaResult,
  GetUserUsageResult,
  ResetQuotaResult,
} from './types';
import CheckQuotaTab from './check-quota-tab';
import UsageTab from './usage-tab';
import ResetTab from './reset-tab';

const QuotaDebug: React.FC<QuotaDebugProps> = ({ userId, apiKeyId }) => {
  const [checkQuotaResult, setCheckQuotaResult] = React.useState<CheckQuotaResult | null>(null);
  const [getUserUsageResult, setGetUserUsageResult] = React.useState<GetUserUsageResult | null>(
    null
  );
  const [resetQuotaResult, setResetQuotaResult] = React.useState<ResetQuotaResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>('check');

  const checkQuotaQuery = trpc.quota.checkQuota.useQuery({ userId, apiKeyId }, { enabled: false });
  const getUserUsageQuery = trpc.quota.getUserUsage.useQuery(
    { userId, apiKeyId },
    { enabled: false }
  );
  const resetQuotaMutation = trpc.quota.resetQuota.useMutation();

  const handleCheckQuota = async () => {
    if (!userId || !apiKeyId) {
      setCheckQuotaResult({ error: '请先填写 User ID 和选择 API Key' });
      return;
    }
    try {
      const result = await checkQuotaQuery.refetch();
      if (result.data) {
        setCheckQuotaResult(result.data as CheckQuotaResult);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setCheckQuotaResult({ error: err.message || '检查配额失败' });
    }
  };

  const handleGetUserUsage = async () => {
    if (!userId || !apiKeyId) {
      setGetUserUsageResult({ error: '请先填写 User ID 和选择 API Key' });
      return;
    }
    try {
      const result = await getUserUsageQuery.refetch();
      if (result.data) {
        setGetUserUsageResult(result.data as GetUserUsageResult);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setGetUserUsageResult({ error: err.message || '获取使用情况失败' });
    }
  };

  const handleResetQuota = async () => {
    if (!userId || !apiKeyId) {
      setResetQuotaResult({ error: '请先填写 User ID 和选择 API Key' });
      return;
    }
    if (!confirm('确定要重置该用户的配额吗？')) {
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
      setResetQuotaResult({ error: err.message || '重置配额失败' });
    }
  };

  const tabs = [
    { id: 'check' as TabType, label: '检查配额', icon: CheckCircle },
    { id: 'usage' as TabType, label: '使用情况', icon: RefreshCw },
    { id: 'reset' as TabType, label: '重置配额', icon: Trash2 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-indigo-500" />
          配额调试
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          调试配额相关 API：checkQuota、getUserUsage、resetQuota
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Tab 切换 */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 参数显示 */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          <div className="text-sm space-y-1">
            <div>
              <span className="text-gray-500 dark:text-gray-400">User ID:</span>
              <span className="ml-2 font-mono text-gray-800 dark:text-white">
                {userId || '未设置'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">API Key ID:</span>
              <span className="ml-2 font-mono text-gray-800 dark:text-white">
                {apiKeyId || '未选择'}
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
            isLoading={checkQuotaQuery.isFetching}
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
