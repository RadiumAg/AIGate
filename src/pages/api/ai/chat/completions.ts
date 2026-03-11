import type { NextApiRequest, NextApiResponse } from 'next';
import { providers } from '@/lib/ai-providers';
import { v4 as uuidv4 } from 'uuid';
import { getRegionFromRequest, extractClientIp } from '@/lib/ip-region';
import type { UsageRecord } from '@/lib/types';
import { corsMiddleware } from '@/lib/cors';
import { apiKeyDb } from '@/lib/database';
import { checkQuota, recordUsage } from '@/lib/quota';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理 CORS
  if (corsMiddleware(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, apiKeyId, messages, model, stream = false, ...otherParams } = req.body;
    const finalApiKey = req.headers?.['authorization']?.replace('Bearer ', '') || apiKeyId;
    if (!finalApiKey || !messages || !model) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: userId, apiKeyId, messages, model' });
    }

    // 提取客户端 IP 并查询归属地省份
    const clientIp = extractClientIp(req);
    const region = getRegionFromRequest(req);
    const requestId = uuidv4();

    // 1. 根据 apiKeyId 获取白名单规则
    const { whitelistRuleDb } = await import('@/lib/database');
    const whitelistRule = await whitelistRuleDb.getByApiKeyId(finalApiKey);

    if (!whitelistRule || whitelistRule.status !== 'active') {
      return res.status(403).json({
        error: '该 API Key 未绑定有效的白名单规则',
      });
    }

    // 2. 根据白名单规则校验 userId 格式
    const validationResult = await whitelistRuleDb.validateUserByApiKey(
      finalApiKey,
      userId,
      clientIp
    );

    if (!validationResult.valid) {
      return res.status(403).json({
        error: validationResult.reason || '用户校验未通过',
      });
    }

    const finalUserId = validationResult.generatedUserId || '';

    // 3. 获取 API Key 和 Provider
    const apiKey = await apiKeyDb.getById(finalApiKey);

    if (!apiKey || apiKey.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'API Key 不存在或已禁用' });
    }

    const providerKey = apiKey.provider.toLowerCase();
    const foundProvider = providers[providerKey];

    if (!foundProvider) {
      return res.status(400).json({
        error: `不支持的提供商: ${apiKey.provider}`,
      });
    }

    const provider = foundProvider;
    const apiKeyInfo = {
      key: apiKey.key,
      baseUrl: apiKey.baseUrl || undefined,
    };

    // 4. 转换消息格式为 provider 需要的格式
    const convertedRequest = {
      model,
      messages,
      ...otherParams,
    };

    // 5. 估算 Token 消耗
    const estimatedTokens = provider.estimateTokens(convertedRequest);

    const quotaCheck = await checkQuota(
      { userId: finalUserId, apiKey: finalApiKey },
      estimatedTokens
    );

    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: quotaCheck.reason || '配额已用完',
      });
    }

    // 6. 处理流式和非流式响应
    if (stream) {
      // 流式响应 - OpenAI 标准格式
      await handleStreamResponse(res, provider, apiKeyInfo, convertedRequest, {
        requestId,
        finalUserId,
        apiKeyId: finalApiKey,
        region,
        clientIp,
        model,
      });
    } else {
      // 非流式响应 - OpenAI 标准格式
      await handleNonStreamResponse(res, provider, apiKeyInfo, convertedRequest, {
        requestId,
        finalUserId,
        apiKeyId: finalApiKey,
        region,
        clientIp,
        model,
      });
    }
  } catch (error) {
    console.error('API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.end();
  }
}

// 处理流式响应 - 符合 OpenAI 标准
async function handleStreamResponse(
  res: NextApiResponse,
  provider: any,
  apiKeyInfo: { key: string; baseUrl?: string },
  request: any,
  context: any
) {
  // 检查 provider 是否支持 stream
  if (!provider.makeStreamRequest) {
    return res.status(501).json({
      error: `Provider ${provider.name} 暂不支持 stream 模式`,
    });
  }

  // 设置 SSE 响应头 - OpenAI 标准
  res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const promptTokens = Math.round(provider.estimateTokens(request) * 0.7);
  let completionTokens = 0;
  let hasRecordedUsage = false;

  try {
    const sourceStream = await provider.makeStreamRequest(
      apiKeyInfo.key,
      request,
      apiKeyInfo.baseUrl
    );

    const reader = sourceStream.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // 转换为 OpenAI 标准格式
      const openAIChunks = convertToOpenAIStreamFormat(chunk);

      for (const openAIChunk of openAIChunks) {
        res.write(`data: ${JSON.stringify(openAIChunk)}\n\n`);

        // 统计 completion tokens
        if (
          openAIChunk.choices &&
          openAIChunk.choices[0] &&
          openAIChunk.choices[0].delta &&
          openAIChunk.choices[0].delta.content
        ) {
          const content = openAIChunk.choices[0].delta.content as string;
          completionTokens += Math.max(1, Math.ceil(content.length / 4));
        }
      }
    }

    reader.releaseLock();

    // 发送完成信号 - OpenAI 标准
    res.write('data: [DONE]\n\n');

    // 记录使用量
    if (!hasRecordedUsage) {
      hasRecordedUsage = true;
      const actualUsage: UsageRecord = {
        id: context.requestId,
        userId: context.finalUserId,
        requestId: context.requestId,
        model: context.model,
        provider: provider.name,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        timestamp: new Date().toISOString(),
        cost: 0,
        region: context.region,
        clientIp: context.clientIp,
      };

      recordUsage(actualUsage, context.apiKeyId, context.finalUserId).catch((error) => {
        console.error('Failed to record usage:', error);
      });
    }

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: { message: 'Stream processing failed' } })}\n\n`);
    res.end();
  }
}

// 处理非流式响应 - 符合 OpenAI 标准
async function handleNonStreamResponse(
  res: NextApiResponse,
  provider: any,
  apiKeyInfo: { key: string; baseUrl?: string },
  request: any,
  context: any
) {
  try {
    const response = await provider.makeRequest(apiKeyInfo.key, request, apiKeyInfo.baseUrl);

    let completionTokens = 0;
    let content = '';

    // 提取响应内容并计算 tokens
    if (
      response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      content = response.choices[0].message.content as string;
      completionTokens = Math.max(1, Math.ceil(content.length / 4));
    }

    const promptTokens = Math.round(provider.estimateTokens(request) * 0.7);
    const totalTokens = promptTokens + completionTokens;

    // 构造 OpenAI 标准响应格式
    const openAIResponse = {
      id: `chatcmpl-${context.requestId}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: context.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
    };

    // 记录使用量
    const actualUsage: UsageRecord = {
      id: context.requestId,
      userId: context.finalUserId,
      requestId: context.requestId,
      model: context.model,
      provider: provider.name,
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp: new Date().toISOString(),
      cost: 0,
      region: context.region,
      clientIp: context.clientIp,
    };

    recordUsage(actualUsage, context.apiKeyId, context.finalUserId).catch((error) => {
      console.error('Failed to record usage:', error);
    });

    res.status(200).json(openAIResponse);
  } catch (error) {
    console.error('Non-stream error:', error);
    res.status(500).json({
      error: {
        message: 'Request failed',
        type: 'server_error',
      },
    });
  }
}

// 将 provider 的流式响应转换为 OpenAI 标准格式
function convertToOpenAIStreamFormat(chunk: string): any[] {
  const openAIChunks: any[] = [];

  try {
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = line.slice(6);
        const parsed = JSON.parse(data);

        // 转换为 OpenAI 标准格式
        const openAIChunk = {
          id: parsed.id || `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: parsed.model || 'gpt-3.5-turbo',
          choices: [
            {
              index: 0,
              delta: {
                content: parsed.choices?.[0]?.delta?.content || '',
              },
              finish_reason: parsed.choices?.[0]?.finish_reason || null,
            },
          ],
        };

        openAIChunks.push(openAIChunk);
      }
    }
  } catch (error) {
    // 如果解析失败，返回空数组
    console.warn('Failed to parse stream chunk:', error);
  }

  return openAIChunks;
}
