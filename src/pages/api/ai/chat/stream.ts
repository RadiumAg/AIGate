import type { NextApiRequest, NextApiResponse } from 'next';
import { corsMiddleware } from '@/lib/cors';
import { withRequestContext } from '@/lib/request-context';
import {
  validateRequest,
  checkRequestQuota,
  recordRequestUsage,
  estimatePromptTokens,
  calculateCompletionTokensFromStream,
  type TokenUsage,
} from '@/lib/chat-service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理 CORS
  if (corsMiddleware(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, apiKeyId, request } = req.body;

    if (!userId || !apiKeyId || !request) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 从 req 中获取 clientIp 和 region（由 withRequestContext 中间件注入）
    const clientIp = req.clientIp || '';
    const region = req.region || 'Unknown';

    // 1. 验证请求
    const { context, apiKeyInfo } = await validateRequest(apiKeyId, userId, clientIp);

    // 更新 context 中的 region
    const updatedContext = {
      ...context,
      region,
    };

    // 2. 应用 defaultModel 覆盖
    if (apiKeyInfo.defaultModel) {
      request.model = apiKeyInfo.defaultModel;
    }

    // 3. 检查配额
    const quotaCheck = await checkRequestQuota(
      context.userId,
      context.apiKeyId,
      request,
      apiKeyInfo.providerInstance
    );

    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: quotaCheck.reason || '配额已用完',
      });
    }

    // 3. 检查 provider 是否支持 stream
    if (!apiKeyInfo.providerInstance.makeStreamRequest) {
      return res.status(501).json({
        error: `Provider ${apiKeyInfo.provider} 暂不支持 stream 模式`,
      });
    }

    // 4. 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const promptTokens = estimatePromptTokens(request, apiKeyInfo.providerInstance);
    let completionTokens = 0;
    let hasRecordedUsage = false;
    const chunks: string[] = [];

    try {
      // 使用 provider 的 makeStreamRequest 方法创建流
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

        // 解码并转发数据
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
        chunks.push(chunk);

        // completion tokens 在最后统一计算
      }

      reader.releaseLock();

      // 发送完成信号
      res.write('data: [DONE]\n\n');

      // 统计 completion tokens
      completionTokens = calculateCompletionTokensFromStream(chunks);

      // 记录使用量
      if (!hasRecordedUsage) {
        hasRecordedUsage = true;
        const usage: TokenUsage = {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        };

        await recordRequestUsage(usage, updatedContext, request.model, apiKeyInfo.provider);
      }

      res.end();
    } catch (error) {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`);
      res.end();
    }
  } catch (error: unknown) {
    console.error('API error:', error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
    res.end();
  }
}

// 包装 handler 以注入请求上下文
export default withRequestContext(handler);
