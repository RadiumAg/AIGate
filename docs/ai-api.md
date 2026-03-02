# AI API 调用文档

本文档提供 AIGate AI 网关的完整 API 调用说明，包括参数详解、返回值说明和调用示例。

---

## API 概述

| 项目                 | 说明                                                 |
| -------------------- | ---------------------------------------------------- |
| **基础路径**         | `/api/trpc`                                          |
| **协议**             | tRPC                                                 |
| **认证方式**         | 通过 `userId` 和 `apiKeyId` 进行身份验证             |
| **支持的 AI 提供商** | OpenAI, Anthropic, Google, DeepSeek, Moonshot, Spark |

---

## 1. 聊天补全接口 (`chatCompletion`)

向 AI 模型发送对话请求并获得回复。支持多个 AI 提供商和模型。

### 基本信息

- **接口类型**: `mutation`
- **调用路径**: `ai.chatCompletion`
- **请求方法**: POST

### 请求参数详解

```typescript
{
  userId: string;           // ✓ 必需 | 用户邮箱，用于身份验证和配额检查
  apiKeyId: string;         // ✓ 必需 | API Key ID，用于选择使用的 AI 提供商和密钥
  request: {
    model: string;          // ✓ 必需 | 模型名称，见下表支持的模型列表
    messages: Array<{       // ✓ 必需 | 对话消息数组（至少一条消息）
      role: 'system' | 'user' | 'assistant';  // 消息角色
      content: string;      // 消息内容
    }>;
    temperature?: number;   // ○ 可选 | 采样温度，范围 0-2，默认 1
                            // 0: 确定性回复，2: 随机性最大
    max_tokens?: number;    // ○ 可选 | 最多生成的 token 数，默认模型限制
    stream?: boolean;       // ○ 可选 | 是否使用流式响应，默认 false
                            // 注意: 如果 stream=true，必须使用 /api/ai/chat/stream 端点
  };
}
```

### 支持的模型列表

| 提供商        | 模型名称          | 说明                   |
| ------------- | ----------------- | ---------------------- |
| **OpenAI**    | `gpt-4o`          | 最新旗舰模型，性能最强 |
|               | `gpt-4o-mini`     | 轻量级模型，更快更便宜 |
|               | `gpt-4-turbo`     | 上一代高性能模型       |
| **Anthropic** | `claude-3-opus`   | 最强能力，最高成本     |
|               | `claude-3-sonnet` | 平衡性能和成本         |
|               | `claude-3-haiku`  | 轻量级模型             |
| **Google**    | `gemini-pro`      | Google 主力模型        |
|               | `gemini-ultra`    | 超大规模模型           |
| **DeepSeek**  | `deepseek-chat`   | 对话优化               |
|               | `deepseek-coder`  | 代码优化               |
| **Moonshot**  | `moonshot-v1-8k`  | 8k 上下文窗口          |
|               | `moonshot-v1-32k` | 32k 上下文窗口         |
| **Spark**     | `spark-v3.5`      | 讯飞星火模型           |

### 响应格式详解

#### 成功响应 (HTTP 200)

```typescript
{
  id: string;                       // 响应的唯一标识符，用于追踪
  object: string;                   // 对象类型，通常为 "chat.completion"
  created: number;                  // 创建时间戳（Unix timestamp）
  model: string;                    // 实际使用的模型名称

  choices: Array<{                  // 生成的选项数组（通常只有一个）
    index: number;                  // 选项索引，从 0 开始
    message: {
      role: string;                 // 角色，通常为 "assistant"
      content: string;              // AI 的回复内容（最重要的字段）
    };
    finish_reason: string;          // 结束原因：
                                    // "stop" - 正常完成
                                    // "length" - 达到 max_tokens
                                    // "content_filter" - 内容过滤
  }>;

  usage?: {                         // 使用量统计（可选）
    prompt_tokens: number;          // 输入 token 数量
    completion_tokens: number;      // 输出 token 数量
    total_tokens: number;           // 总 token 数量
  };

  aigate_metadata: {                // AIGate 自定义扩展数据
    requestId: string;              // 请求 ID，与输入 requestId 对应
    provider: string;               // 实际调用的 AI 提供商名称
    processingTime: number;         // 处理时间，单位毫秒
    quotaRemaining: {
      tokens?: number;              // Token 限制模式下的剩余配额
      requests?: number;            // 请求次数限制模式下的剩余请求数
    };
  };
}
```

#### 错误响应

| HTTP 状态码 | 错误码                  | 说明                                     | 处理建议                                  |
| ----------- | ----------------------- | ---------------------------------------- | ----------------------------------------- |
| 403         | `FORBIDDEN`             | 用户校验未通过，用户不在白名单或已被禁用 | 检查用户是否在白名单中，是否被禁用        |
| 400         | `BAD_REQUEST`           | API Key 不存在/已禁用 或 不支持的提供商  | 检查 apiKeyId 是否正确，provider 是否有效 |
| 429         | `TOO_MANY_REQUESTS`     | 配额已用完（达到每日限制或 RPM 限制）    | 等待配额重置或升级用户配额                |
| 500         | `INTERNAL_SERVER_ERROR` | 服务器内部错误                           | 检查服务器日志，联系管理员                |

### 调用示例

#### TypeScript - tRPC 客户端

```typescript
// 基础调用
const response = await trpc.ai.chatCompletion.mutate({
  userId: 'user@example.com',
  apiKeyId: 'key-id-abc123',
  request: {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: '你是一个有帮助的编程助手',
      },
      {
        role: 'user',
        content: '用 TypeScript 写一个快速排序函数',
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  },
});

// 处理响应
console.log('AI 回复:', response.choices[0].message.content);
console.log('消耗 Token:', response.usage?.total_tokens);
console.log('剩余配额:', response.aigate_metadata.quotaRemaining.tokens);
console.log('处理耗时:', response.aigate_metadata.processingTime, 'ms');
```

#### TypeScript - 带错误处理

```typescript
try {
  const response = await trpc.ai.chatCompletion.mutate({
    userId: 'user@example.com',
    apiKeyId: 'key-id-abc123',
    request: {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: '你好' }],
    },
  });

  console.log(response.choices[0].message.content);
} catch (error: any) {
  switch (error.data?.code) {
    case 'TOO_MANY_REQUESTS':
      console.error('❌ 配额已用完:', error.message);
      // 显示用户升级提示
      break;
    case 'FORBIDDEN':
      console.error('❌ 用户未授权:', error.message);
      // 重定向到登录或授权页面
      break;
    case 'BAD_REQUEST':
      console.error('❌ 请求参数错误:', error.message);
      // 检查参数是否正确
      break;
    default:
      console.error('❌ 请求失败:', error.message);
  }
}
```

#### cURL 命令

```bash
curl -X POST http://localhost:3000/api/trpc/ai.chatCompletion \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "userId": "user@example.com",
      "apiKeyId": "key-id-abc123",
      "request": {
        "model": "gpt-4o",
        "messages": [
          {
            "role": "system",
            "content": "你是一个翻译助手"
          },
          {
            "role": "user",
            "content": "请将以下英文翻译成中文: Hello, how are you?"
          }
        ],
        "temperature": 0.3,
        "max_tokens": 1000
      }
    }
  }'
```

#### JavaScript 原生 fetch

```javascript
async function callAI() {
  const response = await fetch('/api/trpc/ai.chatCompletion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: {
        userId: 'user@example.com',
        apiKeyId: 'key-id-abc123',
        request: {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: '今天天气如何？' }],
          temperature: 0.7,
        },
      },
    }),
  });

  const data = await response.json();
  if (data.result.ok) {
    console.log('回复:', data.result.data.choices[0].message.content);
  } else {
    console.error('错误:', data.result.error);
  }
}
```

---

## 2. 流式聊天接口 (`Stream`)

用于获取实时流式响应，适合需要逐字显示 AI 回复的场景。

### 基本信息

- **接口类型**: HTTP POST
- **调用路径**: `/api/ai/chat/stream`
- **协议**: Server-Sent Events (SSE)
- **响应类型**: `text/event-stream`

### 请求参数

```typescript
{
  userId: string;           // ✓ 必需 | 用户邮箱
  apiKeyId: string;         // ✓ 必需 | API Key ID
  request: {
    model: string;          // ✓ 必需 | 模型名称
    messages: Array<{       // ✓ 必需 | 对话消息数组
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    temperature?: number;   // ○ 可选 | 采样温度（0-2）
    max_tokens?: number;    // ○ 可选 | 最大 token 数
    stream: true;           // ✓ 必需 | 必须设置为 true
  };
}
```

### 响应格式

SSE 流式数据，每条消息格式：

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" "}}]}

data: {"choices":[{"delta":{"content":"world"}}]}

data: [DONE]
```

### 调用示例

#### JavaScript - EventSource API

```javascript
const eventSource = new EventSource('/api/ai/chat/stream?userId=user@example.com&apiKeyId=key-id');

let fullContent = '';

eventSource.addEventListener('message', (event) => {
  if (event.data === '[DONE]') {
    console.log('流式响应完成');
    eventSource.close();
    return;
  }

  try {
    const data = JSON.parse(event.data);
    const content = data.choices?.[0]?.delta?.content;
    if (content) {
      fullContent += content;
      // 实时更新 UI
      document.getElementById('response').textContent = fullContent;
    }
  } catch (e) {
    console.error('解析失败:', e);
  }
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream 错误:', event);
  eventSource.close();
});
```

#### JavaScript - fetch + ReadableStream

```javascript
async function streamChat() {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user@example.com',
      apiKeyId: 'key-id-abc123',
      request: {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: '讲个故事' }],
        stream: true,
      },
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('完成');
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              console.log('收到:', content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

#### React 组件示例

```typescript
import { useState, useRef } from 'react';

export function StreamChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStream = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user@example.com',
        apiKeyId: 'key-id-abc123',
        request: {
          model: 'gpt-4o',
          messages: [...messages, { role: 'user', content: input }],
          stream: true
        }
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let aiContent = '';

    try {
      while (true) {
        const { done, value } = await reader?.read() ?? {};
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: aiContent }
              ]);
              break;
            }

            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              aiContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                  newMessages[newMessages.length - 1].content += content;
                } else {
                  newMessages.push({ role: 'assistant', content });
                }
                return newMessages;
              });
            }
          }
        }
      }
    } finally {
      reader?.releaseLock();
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入问题..."
      />
      <button onClick={handleStream} disabled={loading}>
        {loading ? '流式中...' : '发送'}
      </button>
    </div>
  );
}
```

---

## 3. 获取支持的模型列表 (`getSupportedModels`)

查询系统中所有可用的 AI 模型及其对应的提供商。

### 基本信息

- **接口类型**: `query`
- **调用路径**: `ai.getSupportedModels`
- **参数**: 无

### 响应格式

```typescript
Array<{
  model: string; // 模型名称
  provider: string; // 提供商名称 (e.g., "OpenAI", "Anthropic")
}>;
```

### 调用示例

```typescript
const models = await trpc.ai.getSupportedModels.query();

console.log(models);
// 输出:
// [
//   { model: 'gpt-4o', provider: 'OpenAI' },
//   { model: 'gpt-4o-mini', provider: 'OpenAI' },
//   { model: 'claude-3-opus', provider: 'Anthropic' },
//   ...
// ]

// 按提供商分组
const byProvider = models.reduce(
  (acc, item) => {
    if (!acc[item.provider]) acc[item.provider] = [];
    acc[item.provider].push(item.model);
    return acc;
  },
  {} as Record<string, string[]>
);

console.log(byProvider);
// { OpenAI: [...], Anthropic: [...], ... }
```

---

## 4. 估算 Token 消耗 (`estimateTokens`)

在发送请求前估算消耗的 Token 数量，用于配额检查和成本预估。

### 基本信息

- **接口类型**: `query`
- **调用路径**: `ai.estimateTokens`

### 请求参数

```typescript
{
  model: string;          // ✓ 必需 | 模型名称
  messages: Array<{       // ✓ 必需 | 消息数组
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;   // ○ 可选 | 采样温度
  max_tokens?: number;    // ○ 可选 | 最大 token 数
  stream?: boolean;       // ○ 可选 | 是否流式
}
```

### 响应格式

```typescript
{
  estimatedTokens: number; // 预估的 token 消耗量
}
```

### 调用示例

```typescript
// 单次查询
const estimate = await trpc.ai.estimateTokens.query({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: '你是一个代码审查助手' },
    { role: 'user', content: '请审查以下代码...' },
  ],
});

console.log(`预计消耗: ${estimate.estimatedTokens} tokens`);

// 多模型成本对比
async function compareCosts(userMessage: string) {
  const models = ['gpt-4o', 'gpt-4o-mini', 'claude-3-opus'];
  const estimates = await Promise.all(
    models.map((model) =>
      trpc.ai.estimateTokens.query({
        model,
        messages: [{ role: 'user', content: userMessage }],
      })
    )
  );

  const costs = models.map((model, i) => ({
    model,
    tokens: estimates[i].estimatedTokens,
    // 这里可以根据实际价格计算成本
  }));

  return costs.sort((a, b) => a.tokens - b.tokens);
}
```

---

## 配额管理

### 配额限制模式

系统支持两种配额限制方式：

#### 1. Token 限制模式

- 根据每日/每月消耗的 Token 数量限制
- 适用于 Token 消耗不均匀的场景

#### 2. 请求次数限制模式

- 根据每日请求次数限制
- 适用于需要控制调用频率的场景

### 配额标识逻辑

配额基于 **`userId + apiKeyId`** 的组合计算：

```
配额标识符 = `${userId}:${apiKeyId}`
```

**含义**:

- 同一用户使用不同的 API Key，配额分开计算
- 同一 API Key 被不同用户使用，配额也分开计算
- 每个组合都有独立的每日配额和 RPM 限制

### 从响应中获取配额信息

```typescript
const response = await trpc.ai.chatCompletion.mutate({...});

// 在 aigate_metadata 中获取剩余配额
const { quotaRemaining } = response.aigate_metadata;

if (quotaRemaining.tokens !== undefined) {
  // Token 限制模式
  console.log(`剩余 Token: ${quotaRemaining.tokens}`);
} else if (quotaRemaining.requests !== undefined) {
  // 请求次数限制模式
  console.log(`剩余请求次数: ${quotaRemaining.requests}`);
}

// 配额即将用完时的提醒
if (quotaRemaining.tokens < 1000) {
  showWarning('配额即将用完，请联系管理员');
}
```

---

## 最佳实践

### 1. 错误处理

```typescript
async function safeAICall(params: any) {
  try {
    return await trpc.ai.chatCompletion.mutate(params);
  } catch (error: any) {
    const code = error.data?.code;

    if (code === 'TOO_MANY_REQUESTS') {
      // 配额已用完 - 提示升级或等待
      throw new Error('配额已用完');
    } else if (code === 'FORBIDDEN') {
      // 用户未授权 - 检查白名单
      throw new Error('用户未授权');
    } else if (code === 'BAD_REQUEST') {
      // 参数错误 - 检查输入
      throw new Error(`参数错误: ${error.message}`);
    } else {
      // 其他错误
      throw new Error(`请求失败: ${error.message}`);
    }
  }
}
```

### 2. 预估成本

```typescript
async function estimateCost(messages: any[], model: string) {
  const estimate = await trpc.ai.estimateTokens.query({
    model,
    messages,
  });

  // 根据模型定价计算成本（示例价格）
  const prices: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  };

  const price = prices[model];
  if (!price) return 0;

  // 假设输入和输出各占一半
  const inputTokens = estimate.estimatedTokens * 0.7;
  const outputTokens = estimate.estimatedTokens * 0.3;

  return inputTokens * price.input + outputTokens * price.output;
}
```

### 3. 配额检查

```typescript
// 发送前先检查配额
async function quotaAwareCall(params: any) {
  // 先估算 token
  const estimate = await trpc.ai.estimateTokens.query(params.request);

  // 从配额接口检查是否有足够配额
  const quotaInfo = await trpc.quota.getQuotaInfo.query({
    userId: params.userId,
    apiKeyId: params.apiKeyId,
  });

  const remaining = quotaInfo.remaining.daily || quotaInfo.remaining.monthly;

  if (remaining && estimate.estimatedTokens > remaining) {
    throw new Error('配额不足，无法处理此请求');
  }

  // 配额充足，发送请求
  return await trpc.ai.chatCompletion.mutate(params);
}
```

### 4. 流式响应处理

```typescript
async function handleStream(
  userId: string,
  apiKeyId: string,
  messages: any[],
  onChunk: (content: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  try {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        apiKeyId,
        request: {
          model: 'gpt-4o',
          messages,
          stream: true,
        },
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = (await reader?.read()) ?? {};
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  } finally {
    reader?.releaseLock();
  }
}
```

---

## 相关 API

- **配额管理**: [`quota.checkQuota`](./quota-api.md) - 检查用户配额状态
- **配额信息**: [`quota.getQuotaInfo`](./quota-api.md) - 获取用户配额策略和使用情况
- **API Key 管理**: [`apiKey.*`](./api-key-api.md) - 管理 AI 提供商的 API Key

---

## 常见问题

### Q: Stream 模式的响应不显示？

**A**: 确保请求中设置了 `stream: true`，并使用 `/api/ai/chat/stream` 端点而不是 `ai.chatCompletion`。

### Q: 如何选择合适的模型？

**A**:

- 需要最强能力：`gpt-4o` 或 `claude-3-opus`
- 平衡性能和成本：`gpt-4o-mini` 或 `claude-3-sonnet`
- 仅需简单任务：选择轻量级模型

### Q: 如何处理配额已用完的情况？

**A**: 捕获 `TOO_MANY_REQUESTS` 错误，引导用户升级配额或等待配额重置。

### Q: 支持多轮对话吗？

**A**: 支持，在 `messages` 数组中按顺序传入历史消息即可。系统会保持对话上下文。

---

最后更新: 2024年
