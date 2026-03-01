'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import MessageInput from './message-input';
import { ApiKey } from '@/types/api-key';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  stream: boolean;
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

const RequestConfig: React.FC<RequestConfigProps> = (props) => {
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
          <Settings className="w-5 h-5 mr-2 text-indigo-500" />
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
                          <Button
                            key={modelInfo.model}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (!form) return;
                              setForm({ ...form, model: modelInfo.model });
                            }}
                            className="text-xs h-6 px-2"
                            title={`${modelInfo.model}`}
                          >
                            {modelInfo.model}
                          </Button>
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
          <Slider
            min={0}
            max={2}
            step={0.1}
            defaultValue={[form?.temperature || 0.7]}
            onValueChange={(value) => {
              if (!form) return;
              setForm({ ...form, temperature: value[0] });
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Stream 选项 */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="stream-mode"
            checked={form?.stream || false}
            onCheckedChange={(checked) => {
              if (!form) return;
              setForm({ ...form, stream: checked === true });
            }}
          />
          <Label
            htmlFor="stream-mode"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            启用 Stream 模式
          </Label>
          <span className="text-xs text-gray-500 dark:text-gray-400">（实时返回响应内容）</span>
        </div>

        {/* 预设示例 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            快速示例
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => loadExample('simple')}>
              简单对话
            </Button>
            <Button variant="secondary" size="sm" onClick={() => loadExample('system')}>
              系统提示
            </Button>
            <Button variant="secondary" size="sm" onClick={() => loadExample('conversation')}>
              多轮对话
            </Button>
          </div>
        </div>

        {/* 消息列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              消息 ({form?.messages?.length || 0})
            </label>
            <Button variant="secondary" size="sm" onClick={handleAddMessage}>
              + 添加消息
            </Button>
          </div>
          <ScrollArea className="h-0 min-h-55 max-h-96">
            <div className="flex flex-col gap-y-1.5">
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
          </ScrollArea>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onEstimateTokens}
            disabled={isEstimating || !form?.apiKeyId}
            className="flex-1"
          >
            {isEstimating ? '估算中...' : '估算 Token'}
          </Button>

          <Button
            onClick={onSubmit}
            disabled={
              isSubmitting ||
              !form?.apiKeyId ||
              !form?.model ||
              form?.messages?.some((m) => !m.content.trim())
            }
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Spinner className="-ml-1 mr-2 h-4 w-4" />
                发送中...
              </>
            ) : (
              '发送请求'
            )}
          </Button>

          {/* 生成代码按钮组 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateCode('javascript')}
              disabled={
                !form?.apiKeyId || !form?.model || form?.messages?.some((m) => !m.content.trim())
              }
              title="生成 JavaScript 代码"
            >
              JS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateCode('python')}
              disabled={
                !form?.apiKeyId || !form?.model || form?.messages?.some((m) => !m.content.trim())
              }
              title="生成 Python 代码"
            >
              PY
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateCode('curl')}
              disabled={
                !form?.apiKeyId || !form?.model || form?.messages?.some((m) => !m.content.trim())
              }
              title="生成 cURL 命令"
            >
              cURL
            </Button>
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
