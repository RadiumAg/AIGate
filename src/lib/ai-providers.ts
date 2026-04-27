import { getActiveApiKey, apiKeyDb } from './database';
import { redis, RedisKeys } from './redis';
import { convertProviderToDb } from '@/server/api/routers/api-key';
import type { ChatCompletionRequest, ChatCompletionResponse, ChatMessage } from './types';

// AI 服务商配置
export interface AIProvider {
  name: string;
  models: string[];
  makeRequest: (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ) => Promise<ChatCompletionResponse>;
  makeStreamRequest?: (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ) => Promise<ReadableStream>;
  estimateTokens: (request: ChatCompletionRequest) => number;
}

export function estimateTokens(text: string): number {
  // 简单的 token 估算：大约 4 个字符 = 1 个 token
  return Math.ceil(text.length / 4);
}

const openaiProvider: AIProvider = {
  name: 'OpenAI',
  models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.openai.com/v1',
    });

    const response = await openai.chat.completions.create({
      ...request,
      stream: false,
    });

    return response as ChatCompletionResponse;
  },
  makeStreamRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ReadableStream> => {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.openai.com/v1',
    });

    const stream = await openai.chat.completions.create({
      ...request,
      stream: true,
    });

    // 转换为 Web ReadableStream
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  },
  estimateTokens: (request: ChatCompletionRequest) => {
    const text = request.messages.map((m: ChatMessage) => m.content).join(' ');
    return estimateTokens(text);
  },
};

const anthropicProvider: AIProvider = {
  name: 'Anthropic',
  models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    try {
      // 使用自定义 baseUrl 或默认 Anthropic API 地址
      const apiUrl = baseUrl || 'https://api.anthropic.com';
      const prompt = request.messages
        .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // 使用 fetch 调用 Anthropic API（支持自定义 baseUrl）
      const response = await fetch(`${apiUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.max_tokens || 1000,
          messages: request.messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 转换为标准格式
      return {
        id: data.id || `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content:
                data.content?.[0]?.text || `Claude response for: ${prompt.substring(0, 100)}...`,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: data.usage?.input_tokens || estimateTokens(prompt),
          completion_tokens: data.usage?.output_tokens || estimateTokens('Claude response'),
          total_tokens:
            (data.usage?.input_tokens || estimateTokens(prompt)) +
            (data.usage?.output_tokens || estimateTokens('Claude response')),
        },
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  },
  makeStreamRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ReadableStream> => {
    const apiUrl = baseUrl || 'https://api.anthropic.com';

    const response = await fetch(`${apiUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.max_tokens || 1000,
        messages: request.messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    // 将 Anthropic SSE 流转换为 OpenAI 格式
    return new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  // 转换 Anthropic 格式到 OpenAI 格式
                  if (parsed.type === 'content_block_delta') {
                    const chunk = {
                      id: parsed.id || `chatcmpl-${Date.now()}`,
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: request.model,
                      choices: [
                        {
                          index: 0,
                          delta: {
                            content: parsed.delta?.text || '',
                          },
                          finish_reason: null,
                        },
                      ],
                    };
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
                    );
                  } else if (parsed.type === 'message_stop') {
                    const chunk = {
                      id: `chatcmpl-${Date.now()}`,
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: request.model,
                      choices: [
                        {
                          index: 0,
                          delta: {},
                          finish_reason: 'stop',
                        },
                      ],
                    };
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
                    );
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  },
  estimateTokens: (request: ChatCompletionRequest) => {
    const text = request.messages.map((m: ChatMessage) => m.content).join(' ');
    return estimateTokens(text);
  },
};

const googleProvider: AIProvider = {
  name: 'Google',
  models: ['gemini-pro', 'gemini-pro-vision'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    try {
      // 使用自定义 baseUrl 或默认 Google API 地址
      const apiUrl = baseUrl || 'https://generativelanguage.googleapis.com';
      const prompt = request.messages
        .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // 使用 fetch 调用 Google Gemini API（支持自定义 baseUrl）
      const response = await fetch(
        `${apiUrl}/v1beta/models/${request.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: request.max_tokens || 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Google response';

      return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: text,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: estimateTokens(prompt),
          completion_tokens: estimateTokens(text),
          total_tokens: estimateTokens(prompt + text),
        },
      };
    } catch (error) {
      console.error('Google AI API error:', error);
      throw error;
    }
  },
  makeStreamRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ReadableStream> => {
    const apiUrl = baseUrl || 'https://generativelanguage.googleapis.com';
    const prompt = request.messages
      .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const response = await fetch(
      `${apiUrl}/v1beta/models/${request.model}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.max_tokens || 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    // 将 Google SSE 流转换为 OpenAI 格式
    return new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  // 转换 Google 格式到 OpenAI 格式
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (text) {
                    const chunk = {
                      id: `chatcmpl-${Date.now()}`,
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: request.model,
                      choices: [
                        {
                          index: 0,
                          delta: {
                            content: text,
                          },
                          finish_reason: parsed.candidates?.[0]?.finishReason ? 'stop' : null,
                        },
                      ],
                    };
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
                    );
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  },
  estimateTokens: (request: ChatCompletionRequest) => {
    const text = request.messages.map((m: ChatMessage) => m.content).join(' ');
    return estimateTokens(text);
  },
};

const deepseekProvider: AIProvider = {
  name: 'DeepSeek',
  models: ['deepseek-chat', 'deepseek-coder'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    try {
      // DeepSeek 使用 OpenAI 兼容的 API
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey,
        baseURL: baseUrl || 'https://api.deepseek.com/v1',
      });

      const response = await openai.chat.completions.create({
        ...request,
        stream: false,
      });

      return response as ChatCompletionResponse;
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  },
  makeStreamRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ReadableStream> => {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.deepseek.com/v1',
    });

    const stream = await openai.chat.completions.create({
      ...request,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  },
  estimateTokens: (request: ChatCompletionRequest) => {
    const text = request.messages.map((m: ChatMessage) => m.content).join(' ');
    return estimateTokens(text);
  },
};

const moonshotProvider: AIProvider = {
  name: 'Moonshot',
  models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    try {
      // Moonshot 使用 OpenAI 兼容的 API
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey,
        baseURL: baseUrl || 'https://api.moonshot.cn/v1',
      });

      const response = await openai.chat.completions.create({
        ...request,
        stream: false,
      });

      return response as ChatCompletionResponse;
    } catch (error) {
      console.error('Moonshot API error:', error);
      throw error;
    }
  },
  makeStreamRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ReadableStream> => {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.moonshot.cn/v1',
    });

    const stream = await openai.chat.completions.create({
      ...request,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  },
  estimateTokens: (request: ChatCompletionRequest) => {
    const text = request.messages.map((m: ChatMessage) => m.content).join(' ');
    return estimateTokens(text);
  },
};

const sparkProvider: AIProvider = {
  name: 'Spark',
  models: ['spark-3.5', 'spark-3.0', 'spark-2.0', 'spark-lite'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    try {
      // 星火大模型使用 OpenAI 兼容的 API
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey,
        baseURL: baseUrl || 'https://spark-api.xf-yun.com/v1',
      });

      const response = await openai.chat.completions.create({
        ...request,
        stream: false,
      });

      return response as ChatCompletionResponse;
    } catch (error) {
      console.error('Spark API error:', error);
      throw error;
    }
  },
  makeStreamRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ReadableStream> => {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://spark-api.xf-yun.com/v1',
    });

    const stream = await openai.chat.completions.create({
      ...request,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  },
  estimateTokens: (request: ChatCompletionRequest) => {
    const text = request.messages.map((m: ChatMessage) => m.content).join(' ');
    return estimateTokens(text);
  },
};

// 导出所有提供商
export const providers: Record<string, AIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  deepseek: deepseekProvider,
  moonshot: moonshotProvider,
  spark: sparkProvider,
};

export function getProviderByModel(model: string): AIProvider | null {
  if (model.startsWith('gpt-')) return providers.openai;
  if (model.startsWith('claude-')) return providers.anthropic;
  if (model.startsWith('gemini-')) return providers.google;
  if (model.startsWith('deepseek-')) return providers.deepseek;
  if (model.startsWith('moonshot-')) return providers.moonshot;
  if (model.startsWith('spark-')) return providers.spark;

  // 默认返回 OpenAI
  return providers.openai;
}

// 获取指定提供商的 API Key
export async function getApiKey(providerName: string): Promise<string | null> {
  try {
    // 首先尝试从 Redis 缓存获取
    const cacheKey = RedisKeys.apiKeys(providerName);
    const cachedKey = await redis.get(cacheKey);

    if (cachedKey) {
      return cachedKey;
    }

    // 缓存未命中，从数据库获取
    const activeKey = await getActiveApiKey(providerName);

    if (activeKey) {
      // 缓存到 Redis，过期时间 1 小时
      await redis.setEx(cacheKey, 3600, activeKey);
      return activeKey;
    }

    return null;
  } catch (error) {
    console.error(`Failed to get API key for ${providerName}:`, error);
    // 如果 Redis 失败，直接从数据库获取
    return await getActiveApiKey(providerName);
  }
}

// 获取指定提供商的 API Key 和 baseUrl
export async function getApiKeyWithBaseUrl(
  providerName: string
): Promise<{ key: string; baseUrl?: string } | null> {
  try {
    // 从数据库获取活跃的 API Key（包含 baseUrl）
    const apiKeysList = await apiKeyDb.getByProvider(convertProviderToDb(providerName));
    const activeKey = apiKeysList.find((key) => key.status === 'ACTIVE');

    if (activeKey) {
      return {
        key: activeKey.key,
        baseUrl: activeKey.baseUrl || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to get API key with baseUrl for ${providerName}:`, error);
    return null;
  }
}
