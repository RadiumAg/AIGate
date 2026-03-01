'use client';

import React from 'react';
import { nanoid } from 'nanoid';
import { useLocalStorageState } from 'ahooks';
import { trpc } from '@/components/trpc-provider';
import RequestConfig from './components/request-config';
import ResponseResult from './components/response-result';
import CodeModal from './components/code-modal';
import { DebugRequestForm, ResponseData } from './components/types';
import { Spinner } from '@/components/ui/spinner';

const DebugPage: React.FC = () => {
  // 获取支持的模型列表
  const { data: supportedModels, isLoading: isLoadingModels } =
    trpc.ai.getSupportedModels.useQuery();

  // 获取所有 API Keys
  const { data: apiKeys, isLoading: isLoadingKeys } = trpc.apiKey.getAll.useQuery();

  const isLoading = isLoadingModels || isLoadingKeys;

  // 聊天完成 mutation
  const chatCompletionMutation = trpc.ai.chatCompletion.useMutation();

  // Stream 响应状态
  const [streamContent, setStreamContent] = React.useState<string>('');
  const [isStreaming, setIsStreaming] = React.useState(false);

  // 状态管理 - 使用 localStorage 持久化
  const [form, setForm] = useLocalStorageState<DebugRequestForm>('aigate-debug-form', {
    defaultValue: {
      userId: 'debug-user-' + nanoid(8),
      apiKeyId: '',
      model: '',
      messages: [{ role: 'user', content: '' }],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    },
  });

  const [response, setResponse] = useLocalStorageState<ResponseData | null>(
    'aigate-debug-response',
    {
      defaultValue: null,
    }
  );

  const [error, setError] = useLocalStorageState<string | null>('aigate-debug-error', {
    defaultValue: null,
  });

  const [estimatedTokens, setEstimatedTokens] = useLocalStorageState<number | null>(
    'aigate-debug-estimated-tokens',
    {
      defaultValue: null,
    }
  );

  const [generatedCode, setGeneratedCode] = useLocalStorageState<string>(
    'aigate-debug-generated-code',
    {
      defaultValue: '',
    }
  );

  const [showCodeModal, setShowCodeModal] = useLocalStorageState<boolean>(
    'aigate-debug-show-code-modal',
    {
      defaultValue: false,
    }
  );

  const [isEstimating, setIsEstimating] = useLocalStorageState<boolean>(
    'aigate-debug-is-estimating',
    {
      defaultValue: false,
    }
  );

  // 估算 Token 消耗
  const handleEstimateTokens = async () => {
    if (!form.apiKeyId || !form.model || form.messages.some((m) => !m.content.trim())) {
      return;
    }

    setIsEstimating(true);
    try {
      // 使用简单的字符数估算，因为 tRPC 的 estimateTokens 可能是 query 类型
      const totalChars = form.messages
        .filter((m) => m.content.trim())
        .reduce((sum, msg) => sum + msg.content.length, 0);
      const estimated = Math.ceil(totalChars / 4); // 简单估算：4个字符约等于1个token
      setEstimatedTokens(estimated);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '估算失败');
    } finally {
      setIsEstimating(false);
    }
  };

  // 生成代码示例
  const generateCode = (language: 'javascript' | 'python' | 'curl') => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const messages = form.messages.filter((m) => m.content.trim());
    const selectedApiKey = apiKeys?.find((key) => key.id === form.apiKeyId);

    let code = '';

    switch (language) {
      case 'javascript':
        code = `// JavaScript 示例 (使用 fetch)
// 使用 API Key: ${selectedApiKey?.name || 'Unknown'} (${selectedApiKey?.provider || 'Unknown'})
const response = await fetch('${baseUrl}/api/ai/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key-ID': '${form.apiKeyId}', // AIGate API Key ID
  },
  body: JSON.stringify({
    userId: '${form.userId}',
    model: '${form.model}',
    messages: ${JSON.stringify(messages, null, 2)},
    temperature: ${form.temperature},
    max_tokens: ${form.max_tokens}${form.stream ? `,\n    stream: true` : ''}
  })
});${
          form.stream
            ? `

// Stream 模式处理
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  console.log(chunk);
}`
            : `

const data = await response.json();
console.log(data);`
        }`;
        break;

      case 'python':
        code = `# Python 示例 (使用 requests)
# 使用 API Key: ${selectedApiKey?.name || 'Unknown'} (${selectedApiKey?.provider || 'Unknown'})
import requests
import json

url = '${baseUrl}/api/ai/chat/completions'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key-ID': '${form.apiKeyId}'  # AIGate API Key ID
}

data = {
    'userId': '${form.userId}',
    'model': '${form.model}',
    'messages': ${JSON.stringify(messages, null, 4).replace(/"/g, "'")},
    'temperature': ${form.temperature},
    'max_tokens': ${form.max_tokens}${form.stream ? `,\n    'stream': True` : ''}
}
${
  form.stream
    ? `
response = requests.post(url, headers=headers, json=data, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))`
    : `
response = requests.post(url, headers=headers, json=data)
result = response.json()
print(json.dumps(result, indent=2))`
}`;
        break;

      case 'curl':
        code = `# cURL 示例
# 使用 API Key: ${selectedApiKey?.name || 'Unknown'} (${selectedApiKey?.provider || 'Unknown'})
curl -X POST '${baseUrl}/api/ai/chat/completions' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key-ID: ${form.apiKeyId}' \\
  -d '{
    "userId": "${form.userId}",
    "model": "${form.model}",
    "messages": ${JSON.stringify(messages, null, 2)},
    "temperature": ${form.temperature},
    "max_tokens": ${form.max_tokens}${form.stream ? `,\n    "stream": true` : ''}
  }'${
    form.stream
      ? ` \\
  --no-buffer`
      : ''
  }`;
        break;
    }

    setGeneratedCode(code);
    setShowCodeModal(true);
  };

  // 复制代码到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加一个成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 发送请求
  const handleSubmit = async () => {
    if (!form.apiKeyId || !form.model || form.messages.some((m) => !m.content.trim())) {
      setError('请填写完整的请求信息');
      return;
    }

    setError(null);
    setResponse(null);
    setStreamContent('');

    try {
      // Stream 模式使用独立的 SSE API
      if (form.stream) {
        setIsStreaming(true);
        const response = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: form.userId,
            apiKeyId: form.apiKeyId,
            request: {
              model: form.model,
              messages: form.messages.filter((m) => m.content.trim()),
              temperature: form.temperature,
              max_tokens: form.max_tokens,
              stream: true,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '请求失败');
        }

        // 处理 SSE 流
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder();
        let content = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    content += delta;
                    setStreamContent(content);
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          setIsStreaming(false);
        }
      } else {
        // Non-stream 模式使用 tRPC
        const result = await chatCompletionMutation.mutateAsync({
          userId: form.userId,
          apiKeyId: form.apiKeyId,
          request: {
            model: form.model,
            messages: form.messages.filter((m) => m.content.trim()),
            temperature: form.temperature,
            max_tokens: form.max_tokens,
            stream: false,
          },
        });

        const responseData = result as ResponseData;
        setResponse(responseData);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '请求失败');
      setIsStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">接口调试</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">测试和调试 AI 接口功能</p>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RequestConfig
            form={form}
            apiKeys={apiKeys}
            supportedModels={supportedModels}
            estimatedTokens={estimatedTokens}
            isSubmitting={chatCompletionMutation.isPending}
            isEstimating={isEstimating}
            setForm={setForm}
            onEstimateTokens={handleEstimateTokens}
            onGenerateCode={generateCode}
            onSubmit={handleSubmit}
          />

          <ResponseResult
            response={response}
            error={error}
            isLoading={chatCompletionMutation.isPending}
            streamContent={streamContent}
            isStreaming={isStreaming}
          />
        </div>
      )}

      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        generatedCode={generatedCode}
        onCopyToClipboard={copyToClipboard}
      />
    </div>
  );
};

export default DebugPage;
