'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Check, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

interface ResponseData {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  aigate_metadata: {
    requestId: string;
    provider: string;
    processingTime: number;
    quotaRemaining: {
      tokens: number;
      requests: number;
    };
  };
}

interface ResponseResultProps {
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
  streamContent?: string;
  isStreaming?: boolean;
}

const ResponseResult: React.FC<ResponseResultProps> = (props) => {
  const { t } = useTranslation();
  const { response, error, isLoading, streamContent, isStreaming } = props;

  return (
    <div className="rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] overflow-hidden">
      <div className="p-6 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <div className="p-1.5 rounded-lg bg-green-500/20 backdrop-blur-sm mr-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          {t('Debug.responseResult') as string}
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="p-4 rounded-xl backdrop-blur-lg bg-red-500/10 dark:bg-red-500/10 border border-red-500/30 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {/* AI 回复 */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                {t('Debug.aiReply') as string}
              </label>
              <div className="p-4 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <p className="text-foreground whitespace-pre-wrap font-mono text-sm">
                  {response.choices?.[0]?.message?.content || (t('Debug.noReplyContent') as string)}
                </p>
              </div>
            </div>

            {/* 使用统计 */}
            {response.usage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('Debug.tokenUsageStats') as string}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl backdrop-blur-lg bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/30 text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {t('Debug.prompt') as string}
                    </p>
                    <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {response.usage.prompt_tokens}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl backdrop-blur-lg bg-green-500/10 dark:bg-green-500/10 border border-green-500/30 text-center">
                    <p className="text-xs text-green-600 dark:text-green-400">Completion</p>
                    <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                      {response.usage.completion_tokens}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl backdrop-blur-lg bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/30 text-center">
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {t('Debug.total') as string}
                    </p>
                    <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                      {response.usage.total_tokens}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 元数据 */}
            {response.aigate_metadata && (
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  {t('Debug.aigateMetadata') as string}
                </label>
                <div className="p-4 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {t('Debug.requestId') as string}:
                      </span>
                      <span className="ml-2 font-mono text-foreground">
                        {response.aigate_metadata.requestId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t('Debug.provider') as string}:
                      </span>
                      <span className="ml-2 font-semibold text-foreground">
                        {response.aigate_metadata.provider}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t('Debug.processingTime') as string}:
                      </span>
                      <span className="ml-2 text-foreground">
                        {response.aigate_metadata.processingTime}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t('Debug.remainingQuota') as string}:
                      </span>
                      <span className="ml-2 text-foreground">
                        {response.aigate_metadata.quotaRemaining.tokens} tokens
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 原始响应 */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                {t('Debug.viewRawResponse') as string}
              </summary>
              <div className="mt-2 p-4 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Stream 模式显示 */}
        {isStreaming && streamContent && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-2 flex items-center">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t('Debug.realtimeResponse') as string}
              </label>
              <div className="p-4 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <p className="text-foreground whitespace-pre-wrap font-mono text-sm">
                  {streamContent}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stream 完成后的显示 */}
        {!isStreaming && streamContent && !response && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                {t('Debug.aiReplyStream') as string}
              </label>
              <div className="p-4 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <p className="text-foreground whitespace-pre-wrap font-mono text-sm">
                  {streamContent}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl backdrop-blur-lg bg-green-500/10 dark:bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                <Check className="w-4 h-4 mr-2" />
                {t('Debug.streamCompleted') as string}
              </p>
            </div>
          </div>
        )}

        {!response && !error && !isLoading && !streamContent && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-2xl backdrop-blur-lg bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground">{t('Debug.configureAndSend') as string}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseResult;
