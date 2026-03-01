'use client';

import React from 'react';

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
  const { response, error, isLoading, streamContent, isStreaming } = props;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          响应结果
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {/* AI 回复 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI 回复
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                <p className="text-gray-800 dark:text-white whitespace-pre-wrap font-mono text-sm">
                  {response.choices?.[0]?.message?.content || '无回复内容'}
                </p>
              </div>
            </div>

            {/* 使用统计 */}
            {response.usage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token 使用统计
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Prompt</p>
                    <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {response.usage.prompt_tokens}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-center">
                    <p className="text-xs text-green-600 dark:text-green-400">Completion</p>
                    <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                      {response.usage.completion_tokens}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md text-center">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Total</p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AIGate 元数据
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">请求 ID:</span>
                      <span className="ml-2 font-mono text-gray-800 dark:text-white">
                        {response.aigate_metadata.requestId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">提供商:</span>
                      <span className="ml-2 font-semibold text-gray-800 dark:text-white">
                        {response.aigate_metadata.provider}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">处理时间:</span>
                      <span className="ml-2 text-gray-800 dark:text-white">
                        {response.aigate_metadata.processingTime}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">剩余配额:</span>
                      <span className="ml-2 text-gray-800 dark:text-white">
                        {response.aigate_metadata.quotaRemaining.tokens} tokens
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 原始响应 */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                查看原始响应 JSON
              </summary>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                实时响应 (Stream)
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                <p className="text-gray-800 dark:text-white whitespace-pre-wrap font-mono text-sm">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI 回复 (Stream)
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                <p className="text-gray-800 dark:text-white whitespace-pre-wrap font-mono text-sm">
                  {streamContent}
                </p>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Stream 响应已完成
              </p>
            </div>
          </div>
        )}

        {!response && !error && !isLoading && !streamContent && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              配置请求参数后点击发送请求查看响应结果
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseResult;
