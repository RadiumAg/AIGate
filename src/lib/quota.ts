import { redis, RedisKeys, getTodayString, getCurrentMinuteString } from './redis';
import { QuotaPolicy, QuotaCheckResult, UsageRecord } from './types';
import { whitelistRuleDb, usageRecordDb } from './database';
// 默认配额策略
const DEFAULT_QUOTA_POLICY: QuotaPolicy = {
  id: 'default',
  name: '默认策略',
  limitType: 'token',
  dailyTokenLimit: 5000,
  monthlyTokenLimit: 50000,
  rpmLimit: 10,
};

// 根据 API Key ID 获取配额策略（新的主要方式）
export async function getQuotaPolicyByApiKey(apiKeyId: string): Promise<QuotaPolicy> {
  try {
    const cacheKey = RedisKeys.quotaPolicyByApiKey(apiKeyId);
    const cachedPolicy = await redis.get(cacheKey);
    if (cachedPolicy) {
      return JSON.parse(cachedPolicy);
    }

    // 通过 apiKeyId 直接获取白名单规则及其关联的配额策略（使用 JOIN 查询）
    const result = await whitelistRuleDb.getByApiKeyIdWithPolicy(apiKeyId);

    if (!result) {
      console.warn(`[getQuotaPolicyByApiKey] No whitelist rule found for apiKeyId: ${apiKeyId}`);
      return DEFAULT_QUOTA_POLICY;
    }

    // 直接使用 JOIN 查询返回的 policy，无需再次查询所有策略
    const policy = {
      ...result.policy,
      description: result.policy.description || undefined,
      limitType: (result.policy.limitType as 'token' | 'request') || 'token',
      dailyTokenLimit: result.policy.dailyTokenLimit || undefined,
      monthlyTokenLimit: result.policy.monthlyTokenLimit || undefined,
      dailyRequestLimit: result.policy.dailyRequestLimit || undefined,
    };

    // 缓存策略（缓存1小时）
    await redis.setEx(cacheKey, 60 * 60, JSON.stringify(policy));
    return policy;
  } catch (error) {
    console.error('Error getting quota policy by apiKey:', error);
    return DEFAULT_QUOTA_POLICY;
  }
}

// 根据请求特征获取配额策略（可扩展支持更多匹配方式）
export async function getQuotaPolicyByRequest(requestInfo: {
  apiKey?: string;
  ip?: string;
  domain?: string;
}): Promise<QuotaPolicy> {
  try {
    // 优先使用 apiKey 匹配（新的主要方式）
    if (requestInfo.apiKey) {
      return await getQuotaPolicyByApiKey(requestInfo.apiKey);
    }

    return DEFAULT_QUOTA_POLICY;
  } catch (error) {
    console.error('Error getting quota policy by request:', error);
    return DEFAULT_QUOTA_POLICY;
  }
}

// 检查配额限制
export async function checkQuota(
  requestInfo: {
    userId?: string;
    apiKey?: string;
    ip?: string;
    domain?: string;
  },
  estimatedTokens: number = 0
): Promise<QuotaCheckResult> {
  try {
    const policy = await getQuotaPolicyByRequest(requestInfo);
    const today = getTodayString();
    const currentMinute = getCurrentMinuteString();

    // 使用 userId + apiKey 组合作为标识符，确保不同 API Key 的配额分开计算
    const identifier = requestInfo.userId
      ? `${requestInfo.userId}:${requestInfo.apiKey || 'default'}`
      : requestInfo.ip || requestInfo.apiKey || 'anonymous';

    console.log(
      '[checkQuota] Policy:',
      JSON.stringify({
        limitType: policy.limitType,
        dailyTokenLimit: policy.dailyTokenLimit,
        dailyRequestLimit: policy.dailyRequestLimit,
        rpmLimit: policy.rpmLimit,
      })
    );

    // 根据 limitType 检查不同的限制
    if (policy.limitType === 'token') {
      // Token 限制模式
      const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
      const dailyUsage = await redis.get(dailyUsageKey);
      const currentDailyTokens = dailyUsage ? parseInt(dailyUsage) : 0;

      console.log(
        '[checkQuota] Token mode - Daily usage:',
        currentDailyTokens,
        '/',
        policy.dailyTokenLimit
      );

      if (policy.dailyTokenLimit && currentDailyTokens + estimatedTokens > policy.dailyTokenLimit) {
        return {
          allowed: false,
          reason: `每日 Token 配额已用完。当前使用: ${currentDailyTokens}/${policy.dailyTokenLimit}`,
          remainingTokens: Math.max(0, policy.dailyTokenLimit - currentDailyTokens),
          policy,
        };
      }
    } else if (policy.limitType === 'request') {
      // 请求次数限制模式
      const dailyRequestKey = RedisKeys.userDailyRequests(identifier, today);
      const dailyRequests = await redis.get(dailyRequestKey);
      const currentDailyRequests = dailyRequests ? parseInt(dailyRequests) : 0;

      console.log(
        '[checkQuota] Request mode - Daily requests:',
        currentDailyRequests,
        '/',
        policy.dailyRequestLimit
      );

      if (policy.dailyRequestLimit && currentDailyRequests >= policy.dailyRequestLimit) {
        return {
          allowed: false,
          reason: `每日请求次数已达上限。当前请求: ${currentDailyRequests}/${policy.dailyRequestLimit}`,
          remainingRequests: Math.max(0, policy.dailyRequestLimit - currentDailyRequests),
          policy,
        };
      }
    }

    // 检查每分钟请求次数限制（两种模式都要检查）
    const rpmKey = RedisKeys.userRPM(identifier, currentMinute);
    const currentRPM = await redis.get(rpmKey);
    const currentRequests = currentRPM ? parseInt(currentRPM) : 0;

    if (currentRequests >= policy.rpmLimit) {
      return {
        allowed: false,
        reason: `每分钟请求次数已达上限。当前请求: ${currentRequests}/${policy.rpmLimit}`,
        remainingRequests: Math.max(0, policy.rpmLimit - currentRequests),
        policy,
      };
    }

    // 计算剩余配额
    let remainingTokens: number | undefined;
    let remainingRequests: number | undefined;

    if (policy.limitType === 'token' && policy.dailyTokenLimit) {
      const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
      const dailyUsage = await redis.get(dailyUsageKey);
      const currentDailyTokens = dailyUsage ? parseInt(dailyUsage) : 0;
      remainingTokens = policy.dailyTokenLimit - currentDailyTokens;
    }

    if (policy.limitType === 'request' && policy.dailyRequestLimit) {
      const dailyRequestKey = RedisKeys.userDailyRequests(identifier, today);
      const dailyRequests = await redis.get(dailyRequestKey);
      const currentDailyRequests = dailyRequests ? parseInt(dailyRequests) : 0;
      remainingRequests = policy.dailyRequestLimit - currentDailyRequests;
    }

    return {
      allowed: true,
      remainingTokens,
      remainingRequests: remainingRequests || Math.max(0, policy.rpmLimit - currentRequests),
      policy,
    };
  } catch (error) {
    console.error('Error checking quota:', error);
    return {
      allowed: false,
      reason: '配额检查失败',
    };
  }
}

// 记录用量
export async function recordUsage(
  record: UsageRecord,
  identifier: string // 可以是邮箱、IP、API Key 等标识符
): Promise<void> {
  try {
    const today = getTodayString();
    const currentMinute = getCurrentMinuteString();

    // 获取用户的配额策略
    const policy = await getQuotaPolicyByRequest({ userId: identifier });

    // 根据 limitType 更新不同的计数器
    if (policy.limitType === 'token') {
      // Token 模式：更新每日 Token 使用量
      const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
      await redis.incrBy(dailyUsageKey, Math.round(record.totalTokens));
      // 设置过期时间为 7 天
      await redis.expire(dailyUsageKey, 7 * 24 * 60 * 60);
      console.log(
        '[recordUsage] Token mode - Recorded',
        record.totalTokens,
        'tokens for',
        identifier
      );
    } else if (policy.limitType === 'request') {
      // 请求次数模式：更新每日请求次数
      const dailyRequestKey = RedisKeys.userDailyRequests(identifier, today);
      const newCount = await redis.incr(dailyRequestKey);
      // 设置过期时间为 7 天
      await redis.expire(dailyRequestKey, 7 * 24 * 60 * 60);
      console.log('[recordUsage] Request mode - New request count:', newCount, 'for', identifier);
    }

    // 更新每分钟请求次数（两种模式都要记录）
    const rpmKey = RedisKeys.userRPM(identifier, currentMinute);
    await redis.incr(rpmKey);
    // 设置过期时间为 2 分钟
    await redis.expire(rpmKey, 120);

    // 存储详细的请求日志
    const logKey = RedisKeys.requestLog(identifier, record.id);
    await redis.setEx(logKey, 24 * 60 * 60, JSON.stringify(record)); // 保存 24 小时

    // 写入用量记录到数据库
    await usageRecordDb.create({
      id: record.id,
      userId: identifier,
      model: record.model,
      provider: record.provider,
      promptTokens: record.promptTokens,
      completionTokens: record.completionTokens,
      totalTokens: record.totalTokens,
      cost: typeof record.cost === 'number' ? String(record.cost) : '0',
      region: record.region || null,
      clientIp: record.clientIp || null,
      timestamp: new Date(record.timestamp),
    });

    console.log(`Usage recorded for identifier ${identifier}: ${record.totalTokens} tokens`);
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}

// 获取今日使用情况
export async function getDailyUsage(requestInfo: {
  userId?: string;
  apiKey?: string;
  ip?: string;
  domain?: string;
}): Promise<{
  tokensUsed: number;
  requestsToday: number;
  policy: QuotaPolicy;
}> {
  try {
    const policy = await getQuotaPolicyByRequest(requestInfo);
    const today = getTodayString();
    // 使用 userId + apiKey 组合作为标识符，确保不同 API Key 的配额分开计算
    const identifier = requestInfo.userId
      ? `${requestInfo.userId}:${requestInfo.apiKey || 'default'}`
      : requestInfo.ip || requestInfo.apiKey || 'anonymous';

    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
    const dailyRequestKey = RedisKeys.userDailyRequests(identifier, today);

    const tokensUsed = await redis.get(dailyUsageKey);
    const requestsUsed = await redis.get(dailyRequestKey);

    return {
      tokensUsed: tokensUsed ? parseInt(tokensUsed) : 0,
      requestsToday: requestsUsed ? parseInt(requestsUsed) : 0,
      policy,
    };
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return {
      tokensUsed: 0,
      requestsToday: 0,
      policy: DEFAULT_QUOTA_POLICY,
    };
  }
}

// 重置配额
export async function resetQuota(identifier: string): Promise<void> {
  try {
    const today = getTodayString();
    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
    await redis.del(dailyUsageKey);

    console.log(`Quota reset for identifier ${identifier}`);
  } catch (error) {
    console.error('Error resetting quota:', error);
  }
}

export async function checkUserQuota(
  userId: string,
  estimatedTokens: number = 0
): Promise<QuotaCheckResult> {
  console.warn('checkUserQuota is deprecated. Use checkQuota instead.');
  return await checkQuota({ userId }, estimatedTokens);
}

export async function getUserDailyUsage(userId: string): Promise<{
  tokensUsed: number;
  requestsToday: number;
  policy: QuotaPolicy;
}> {
  console.warn('getUserDailyUsage is deprecated. Use getDailyUsage instead.');
  return await getDailyUsage({ userId });
}

export async function resetUserQuota(userId: string): Promise<void> {
  console.warn('resetUserQuota is deprecated. Use resetQuota instead.');
  return await resetQuota(userId);
}
