import type { NextApiRequest, NextApiResponse } from 'next';
import { corsMiddleware } from '@/lib/cors';
import { withRequestContext } from '@/lib/request-context';
import {
  validateRequest,
  checkRequestQuota,
  recordRequestUsage,
  estimatePromptTokens,
  calculateCompletionTokensFromResponse,
  createOpenAIResponse,
  convertToOpenAIStreamFormat,
  type TokenUsage,
  type ApiKeyInfo,
} from '@/lib/chat-service';

interface HandlerContext {
  requestId: string;
  userId: string;
  apiKeyId: string;
  region: string;
  clientIp: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // 从 req 中获取 clientIp 和 region（由 withRequestContext 中间件注入）
    const clientIp = req.clientIp || '';
    const region = req.region || 'Unknown';

    // 1. 验证请求
    const { context, apiKeyInfo } = await validateRequest(finalApiKey, userId, clientIp);

    // 2. 转换消息格式，优先使用 API Key 配置的 defaultModel
    const effectiveModel = apiKeyInfo.defaultModel || model;
    const convertedRequest = {
      model: effectiveModel,
      messages,
      ...otherParams,
    };

    // 3. 检查配额
    const quotaCheck = await checkRequestQuota(
      context.userId,
      context.apiKeyId,
      convertedRequest,
      apiKeyInfo.providerInstance
    );

    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: quotaCheck.reason || '配额已用完',
      });
    }

    const handlerContext: HandlerContext = {
      requestId: context.requestId,
      userId: context.userId,
      apiKeyId: context.apiKeyId,
      region,
      clientIp: context.clientIp,
    };

    // 4. 处理流式和非流式响应
    if (stream) {
      await handleStreamResponse(res, apiKeyInfo, convertedRequest, handlerContext, effectiveModel);
    } else {
      await handleNonStreamResponse(
        res,
        apiKeyInfo,
        convertedRequest,
        handlerContext,
        effectiveModel
      );
    }
  } catch (error: unknown) {
    console.error('API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          type: 'server_error',
        },
      });
    }
    res.end();
  }
}

// 处理流式响应 - 符合 OpenAI 标准
async function handleStreamResponse(
  res: NextApiResponse,
  apiKeyInfo: ApiKeyInfo,
  request: any,
  context: HandlerContext,
  model: string
) {
  // 检查 provider 是否支持 stream
  if (!apiKeyInfo.providerInstance.makeStreamRequest) {
    return res.status(501).json({
      error: `Provider ${apiKeyInfo.provider} 暂不支持 stream 模式`,
    });
  }

  // 设置 SSE 响应头 - OpenAI 标准
  res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const promptTokens = estimatePromptTokens(request, apiKeyInfo.providerInstance);
  let completionTokens = 0;
  let hasRecordedUsage = false;

  try {
    const sourceStream = await apiKeyInfo.providerInstance.makeStreamRequest(
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
      const usage: TokenUsage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      };

      await recordRequestUsage(usage, context, model, apiKeyInfo.provider);
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
  apiKeyInfo: ApiKeyInfo,
  request: Record<string, unknown>,
  context: HandlerContext,
  model: string
) {
  try {
    const response = await apiKeyInfo.providerInstance.makeRequest(
      apiKeyInfo.key,
      request,
      apiKeyInfo.baseUrl
    );

    // 提取响应内容并计算 tokens
    const { content, tokens: completionTokens } = calculateCompletionTokensFromResponse(response);
    const promptTokens = estimatePromptTokens(request, apiKeyInfo.providerInstance);
    const totalTokens = promptTokens + completionTokens;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
    };

    // 构造 OpenAI 标准响应格式
    const openAIResponse = createOpenAIResponse(context.requestId, model, content, usage);

    // 记录使用量
    await recordRequestUsage(usage, context, model, apiKeyInfo.provider);

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

// 包装 handler 以注入请求上下文
export default withRequestContext(handler);
