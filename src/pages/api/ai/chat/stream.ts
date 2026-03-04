import type { NextApiRequest, NextApiResponse } from 'next';
import { providers } from '@/lib/ai-providers';
import { checkQuota, recordUsage } from '@/lib/quota';
import { v4 as uuidv4 } from 'uuid';
import { getRegionFromRequest, extractClientIp } from '@/lib/ip-region';
import type { UsageRecord } from '@/lib/types';
import { corsMiddleware } from '@/lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // 提取客户端 IP 并查询归属地省份
    const clientIp = extractClientIp(req);
    const region = getRegionFromRequest(req);
    const requestId = uuidv4();

    // 1. 根据 apiKeyId 获取白名单规则
    const { whitelistRuleDb } = await import('@/lib/database');
    const whitelistRule = await whitelistRuleDb.getByApiKeyId(apiKeyId);

    if (!whitelistRule || whitelistRule.status !== 'active') {
      return res.status(403).json({
        error: '该 API Key 未绑定有效的白名单规则',
      });
    }

    // 2. 根据白名单规则校验 userId 格式
    const validationResult = await whitelistRuleDb.validateUserByApiKey(apiKeyId, userId, clientIp);

    if (!validationResult.valid) {
      return res.status(403).json({
        error: validationResult.reason || '用户校验未通过',
      });
    }

    // 使用生成的 userId（如果有的话）
    const finalUserId = validationResult.generatedUserId || userId;

    // 3. 获取 API Key 和 Provider
    const { apiKeyDb } = await import('@/lib/database');
    const apiKey = await apiKeyDb.getById(apiKeyId);

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

    // 3. 估算 Token 消耗
    const estimatedTokens = provider.estimateTokens(request);

    // 4. 检查配额（使用 finalUserId + apiKeyId 组合作为标识符，确保不同 API Key 配额分开计算）
    const identifier = `${finalUserId}:${apiKeyId}`;
    const quotaCheck = await checkQuota({ userId: finalUserId, apiKey: apiKeyId }, estimatedTokens);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: quotaCheck.reason || '配额已用完',
      });
    }

    // 5. 检查 provider 是否支持 stream
    if (!provider.makeStreamRequest) {
      return res.status(501).json({
        error: `Provider ${provider.name} 暂不支持 stream 模式`,
      });
    }

    // 6. 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    const promptTokens = Math.round(estimatedTokens * 0.7);
    let completionTokens = 0;
    let hasRecordedUsage = false;

    try {
      // 使用 provider 的 makeStreamRequest 方法创建流
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

        // 解码并转发数据
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);

        // 统计 token 使用量
        try {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              const data = line.slice(6);
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                completionTokens += Math.max(1, Math.ceil(content.length / 4));
              }
            }
          }
        } catch {
          // 忽略解析错误
        }
      }

      reader.releaseLock();

      // 发送完成信号
      res.write('data: [DONE]\n\n');

      // 记录使用量
      if (!hasRecordedUsage) {
        hasRecordedUsage = true;
        const actualUsage: UsageRecord = {
          id: requestId,
          userId: identifier,
          requestId,
          model: request.model,
          provider: provider.name,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          timestamp: new Date().toISOString(),
          cost: 0,
          region,
          clientIp,
        };

        recordUsage(actualUsage, identifier).catch((error) => {
          console.error('Failed to record usage:', error);
        });
      }

      res.end();
    } catch (error) {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.end();
  }
}
