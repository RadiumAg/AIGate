'use client';

import { FC } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MessageInput from './message-input';
import { ApiKey } from '@/types/apiKey';

interface DebugRequestForm {
  userId: string;
  apiKeyId: string;
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

interface SupportedModel {
  model: string;
  provider: string;
}

interface RequestConfigProps {
  form: DebugRequestForm | undefined;
  setForm: (value: DebugRequestForm | ((prev?: DebugRequestForm) => DebugRequestForm)) => void;
  apiKeys: ApiKey[] | undefined;
  supportedModels: SupportedModel[] | undefined;
  estimatedTokens: number | null;
  isEstimating: boolean;
  onEstimateTokens: () => void;
  onGenerateCode: (language: 'javascript' | 'python' | 'curl') => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const RequestConfig: FC<RequestConfigProps> = (props) => {
  const {
    form,
    setForm,
    apiKeys,
    supportedModels,
    estimatedTokens,
    isEstimating,
    onEstimateTokens,
    onGenerateCode,
    onSubmit,
    isSubmitting,
  } = props;

  // 消息操作
  const handleMessageChange = (index: number, field: 'role' | 'content', value: string) => {
    if (!form) return;
    setForm({
      ...form,
      messages: form.messages.map((msg, i) => (i === index ? { ...msg, [field]: value } : msg)),
    });
  };

  const handleAddMessage = () => {
    if (!form) return;
    setForm({
      ...form,
      messages: [...form.messages, { role: 'user', content: '' }],
    });
  };

  const handleRemoveMessage = (index: number) => {
    if (!form) return;
    setForm({
      ...form,
      messages: form.messages.filter((_, i) => i !== index),
    });
  };

  // 预设示例
  const loadExample = (type: 'simple' | 'system' | 'conversation') => {
    const examples = {
      simple: [{ role: 'user' as const, content: '你好，请介绍一下你自己。' }],
      system: [
        {
          role: 'system' as const,
          content: '你是一个专业的 AI 助手，请用简洁明了的方式回答用户问题。',
        },
        { role: 'user' as const, content: '什么是机器学习？' },
      ],
      conversation: [
        { role: 'user' as const, content: '我想学习 Python 编程，有什么建议吗？' },
        {
          role: 'assistant' as const,
          content:
            '学习 Python 的建议：1. 从基础语法开始 2. 多做练习项目 3. 阅读优秀代码。你有编程基础吗？',
        },
        { role: 'user' as const, content: '我是完全的初学者，应该从哪里开始？' },
      ],
    };

    if (!form) return;
    setForm({
      ...form,
      messages: examples[type],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            />
          </svg>
          请求配置
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {/* 基础配置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <Select
              value={form?.apiKeyId || ''}
              onValueChange={(value: string) => {
                if (!form) return;
                setForm({ ...form, apiKeyId: value });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择 API Key" />
              </SelectTrigger>
              <SelectContent>
                {apiKeys ? (
                  apiKeys
                    .filter((key) => key.status === 'active')
                    .map((apiKey) => (
                      <SelectItem key={apiKey.id} value={apiKey.id}>
                        {apiKey.name} ({apiKey.provider}) - {apiKey.key}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="no-keys" disabled>
                    暂无可用 API Key
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              模型
            </label>
            <input
              type="text"
              value={form?.model || ''}
              onChange={(e) => {
                if (!form) return;
                setForm({ ...form, model: e.target.value });
              }}
              placeholder={
                form?.apiKeyId
                  ? `请输入${apiKeys?.find((k) => k.id === form.apiKeyId)?.provider || ''}模型名称`
                  : '请先选择 API Key'
              }
              disabled={!form?.apiKeyId}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {form?.apiKeyId &&
              supportedModels &&
              supportedModels.length > 0 &&
              (() => {
                const selectedApiKey = apiKeys?.find((k) => k.id === form.apiKeyId);
                const providerModels = supportedModels.filter(
                  (m) => m.provider.toLowerCase() === selectedApiKey?.provider?.toLowerCase()
                );

                return (
                  providerModels.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {selectedApiKey?.provider} 支持的模型：
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {providerModels.slice(0, 8).map((modelInfo) => (
                          <button
                            key={modelInfo.model}
                            onClick={() => {
                              if (!form) return;
                              setForm({ ...form, model: modelInfo.model });
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={`${modelInfo.model}`}
                          >
                            {modelInfo.model}
                          </button>
                        ))}
                        {providerModels.length > 8 && (
                          <span className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                            +{providerModels.length - 8} 更多...
                          </span>
                        )}
                      </div>
                    </div>
                  )
                );
              })()}
          </div>
        </div>

        {/* 用户 ID 和高级参数 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              用户 ID
            </label>
            <input
              type="text"
              value={form?.userId || ''}
              onChange={(e) => {
                if (!form) return;
                setForm({ ...form, userId: e.target.value });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="4000"
              value={form?.max_tokens || 1000}
              onChange={(e) => {
                if (!form) return;
                setForm({ ...form, max_tokens: parseInt(e.target.value) || 1000 });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Temperature 参数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Temperature: {form?.temperature || 0.7}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={form?.temperature || 0.7}
            onChange={(e) => {
              if (!form) return;
              setForm({ ...form, temperature: parseFloat(e.target.value) });
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* 预设示例 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            快速示例
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadExample('simple')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              简单对话
            </button>
            <button
              onClick={() => loadExample('system')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              系统提示
            </button>
            <button
              onClick={() => loadExample('conversation')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              多轮对话
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              消息 ({form?.messages?.length || 0})
            </label>
            <button
              onClick={handleAddMessage}
              className="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              + 添加消息
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {form?.messages?.map((message, index) => (
              <MessageInput
                key={index}
                message={message}
                index={index}
                onChange={handleMessageChange}
                onRemove={handleRemoveMessage}
                canRemove={(form?.messages?.length || 0) > 1}
              />
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onEstimateTokens}
            disabled={isEstimating || !form?.apiKeyId}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEstimating ? '估算中...' : '估算 Token'}
          </button>

          <button
            onClick={onSubmit}
            disabled={
              isSubmitting ||
              !form?.apiKeyId ||
              !form?.model ||
              form?.messages?.some((m) => !m.content.trim())
            }
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                发送中...
              </>
            ) : (
              '发送请求'
            )}
          </button>

          {/* 生成代码按钮组 */}
          <div className="flex gap-2">
            <button
              onClick={() => onGenerateCode('javascript')}
              disabled={
                !form?.apiKeyId || !form?.model || form?.messages?.some((m) => !m.content.trim())
              }
              className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="生成 JavaScript 代码"
            >
              JS
            </button>
            <button
              onClick={() => onGenerateCode('python')}
              disabled={
                !form?.apiKeyId || !form?.model || form?.messages?.some((m) => !m.content.trim())
              }
              className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="生成 Python 代码"
            >
              PY
            </button>
            <button
              onClick={() => onGenerateCode('curl')}
              disabled={
                !form?.apiKeyId || !form?.model || form?.messages?.some((m) => !m.content.trim())
              }
              className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="生成 cURL 命令"
            >
              cURL
            </button>
          </div>
        </div>

        {/* Token 估算结果 */}
        {estimatedTokens && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              预估 Token 消耗: <span className="font-mono font-semibold">{estimatedTokens}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestConfig;
