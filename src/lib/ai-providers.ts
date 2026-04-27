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

// Kimi（月之暗面）使用 OpenAI 兼容 API
const kimiProvider: AIProvider = {
  name: 'Kimi',
  models: ['kimi-latest', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
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

// MiniMax 使用 OpenAI 兼容 API
const minimaxProvider: AIProvider = {
  name: 'MiniMax',
  models: ['MiniMax-Text-01', 'MiniMax-M1', 'abab6.5s-chat'],
  makeRequest: async (
    apiKey: string,
    request: ChatCompletionRequest,
    baseUrl?: string
  ): Promise<ChatCompletionResponse> => {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.minimax.chat/v1',
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
      baseURL: baseUrl || 'https://api.minimax.chat/v1',
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
  deepseek: deepseekProvider,
  moonshot: moonshotProvider,
  spark: sparkProvider,
  kimi: kimiProvider,
  minimax: minimaxProvider,
};

export function getProviderByModel(model: string): AIProvider | null {
  if (model.startsWith('gpt-') || model.startsWith('o1')) return providers.openai;
  if (model.startsWith('deepseek-')) return providers.deepseek;
  if (model.startsWith('moonshot-')) return providers.moonshot;
  if (model.startsWith('spark-')) return providers.spark;
  if (model.startsWith('kimi-') || model.startsWith('kimi')) return providers.kimi;
  if (model.startsWith('MiniMax-') || model.startsWith('minimax-') || model.startsWith('abab'))
    return providers.minimax;

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
