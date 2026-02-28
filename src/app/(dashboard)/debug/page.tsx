'use client';

import { FC } from 'react';
import { nanoid } from 'nanoid';
import { useLocalStorageState } from 'ahooks';
import { trpc } from '@/components/trpc-provider';
import RequestConfig from './components/RequestConfig';
import ResponseResult from './components/ResponseResult';
import CodeModal from './components/CodeModal';
import { DebugRequestForm, ResponseData } from './components/types';

const DebugPage: FC = () => {
  // 获取支持的模型列表
  const { data: supportedModels } = trpc.ai.getSupportedModels.useQuery();

  // 获取所有 API Keys
  const { data: apiKeys } = trpc.apiKey.getAll.useQuery();

  // 聊天完成 mutation
  const chatCompletionMutation = trpc.ai.chatCompletion.useMutation();

  // 状态管理 - 使用 localStorage 持久化
  const [form, setForm] = useLocalStorageState<DebugRequestForm>('aigate-debug-form', {
    defaultValue: {
      userId: 'debug-user-' + nanoid(8),
      apiKeyId: '',
      model: '',
      messages: [{ role: 'user', content: '' }],
      temperature: 0.7,
      max_tokens: 1000,
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
    max_tokens: ${form.max_tokens}
  })
});

const data = await response.json();
console.log(data);`;
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
    'max_tokens': ${form.max_tokens}
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(json.dumps(result, indent=2))`;
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
    "max_tokens": ${form.max_tokens}
  }'`;
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

    try {
      const result = await chatCompletionMutation.mutateAsync({
        userId: form.userId,
        apiKeyId: form.apiKeyId, // 传递选择的 API Key ID
        request: {
          model: form.model,
          messages: form.messages.filter((m) => m.content.trim()),
          temperature: form.temperature,
          max_tokens: form.max_tokens,
        },
      });

      // 转换响应数据以匹配本地类型
      const responseData: ResponseData = {
        ...result,
        aigate_metadata: {
          ...result.aigate_metadata,
          quotaRemaining: {
            tokens: result.aigate_metadata.quotaRemaining.tokens || 0,
            requests: result.aigate_metadata.quotaRemaining.requests || 0,
          },
        },
      };
      setResponse(responseData);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '请求失败');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">接口调试</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">测试和调试 AI 接口功能</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestConfig
          form={form}
          setForm={setForm}
          apiKeys={apiKeys}
          supportedModels={supportedModels}
          estimatedTokens={estimatedTokens}
          isEstimating={isEstimating}
          onEstimateTokens={handleEstimateTokens}
          onGenerateCode={generateCode}
          onSubmit={handleSubmit}
          isSubmitting={chatCompletionMutation.isPending}
        />

        <ResponseResult
          response={response}
          error={error}
          isLoading={chatCompletionMutation.isPending}
        />
      </div>

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
