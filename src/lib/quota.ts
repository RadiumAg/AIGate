import { redis, RedisKeys } from './redis';
import { getCurrentMinuteString } from './date';
import { getTodayString } from './date';
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
    apiKey: string;
    userId: string;
    domain?: string;
    ip?: string;
  },
  estimatedTokens: number = 0
): Promise<QuotaCheckResult> {
  try {
    const today = getTodayString();
    const policy = await getQuotaPolicyByRequest(requestInfo);
    const currentMinute = getCurrentMinuteString();
    const identifier = requestInfo.userId;

    // 根据 limitType 检查不同的限制
    if (policy.limitType === 'token') {
      // Token 限制模式
      const dailyUsageKey = RedisKeys.userDailyQuota(requestInfo.userId, requestInfo.apiKey, today);
      const dailyUsage = await redis.get(dailyUsageKey);
      const currentDailyTokens = dailyUsage ? parseInt(dailyUsage) : 0;

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
      const dailyRequestKey = RedisKeys.userDailyRequests(identifier, requestInfo.apiKey, today);
      const dailyRequests = await redis.get(dailyRequestKey);
      const currentDailyRequests = dailyRequests ? parseInt(dailyRequests) : 0;

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
    const rpmKey = RedisKeys.userRPM(identifier, requestInfo.apiKey, currentMinute);
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
      const dailyUsageKey = RedisKeys.userDailyQuota(identifier, requestInfo.apiKey, today);
      const dailyUsage = await redis.get(dailyUsageKey);
      const currentDailyTokens = dailyUsage ? parseInt(dailyUsage) : 0;
      remainingTokens = policy.dailyTokenLimit - currentDailyTokens;
    }

    if (policy.limitType === 'request' && policy.dailyRequestLimit) {
      const dailyRequestKey = RedisKeys.userDailyRequests(identifier, requestInfo.apiKey, today);
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
  apiKey: string, // 可以是邮箱、IP、API Key 等标识符
  userId: string
): Promise<void> {
  try {
    const today = getTodayString();
    const currentMinute = getCurrentMinuteString();

    // 获取用户的配额策略
    const policy = await getQuotaPolicyByRequest({ apiKey });

    if (policy.limitType === 'token') {
      const dailyUsageKey = RedisKeys.userDailyQuota(userId, apiKey, today);
      await redis.incrBy(dailyUsageKey, Math.round(record.totalTokens));
      await redis.expire(dailyUsageKey, 7 * 24 * 60 * 60);
    } else if (policy.limitType === 'request') {
      const dailyRequestKey = RedisKeys.userDailyRequests(userId, apiKey, today);
      await redis.incr(dailyRequestKey);
      await redis.expire(dailyRequestKey, 7 * 24 * 60 * 60);
    }

    const rpmKey = RedisKeys.userRPM(userId, apiKey, currentMinute);
    await redis.incr(rpmKey);
    await redis.expire(rpmKey, 120);
    const logKey = RedisKeys.requestLog(apiKey, record.id);
    await redis.setEx(logKey, 24 * 60 * 60, JSON.stringify(record));

    // 写入用量记录到数据库
    await usageRecordDb.create({
      apiKey,
      userId,
      id: record.id,
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

    console.log(`Usage recorded for identifier ${apiKey}: ${record.totalTokens} tokens`);
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}

// 获取今日使用情况
export async function getDailyUsage(requestInfo: {
  userId: string;
  apiKey: string;
  ip?: string;
  domain?: string;
}) {
  try {
    const policy = await getQuotaPolicyByRequest(requestInfo);
    const today = getTodayString();
    // 使用 userId + apiKey 组合作为标识符，确保不同 API Key 的配额分开计算
    const identifier = requestInfo.userId;
    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, requestInfo.apiKey, today);
    const dailyRequestKey = RedisKeys.userDailyRequests(identifier, requestInfo.apiKey, today);

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

// 重置用户在某个apiKey下的配额
export async function resetQuota(identifier: string, apiKey: string): Promise<void> {
  try {
    const today = getTodayString();
    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, apiKey, today);
    await redis.del(dailyUsageKey);

    console.log(`Quota reset for identifier ${identifier}`);
  } catch (error) {
    console.error('Error resetting quota:', error);
  }
}

export async function getUserDailyUsage(userId: string, apiKeyId: string) {
  console.warn('getUserDailyUsage is deprecated. Use getDailyUsage instead.');
  return await getDailyUsage({ userId, apiKey: apiKeyId });
}

export async function resetUserQuota(userId: string, apiKeyId: string): Promise<void> {
  console.warn('resetUserQuota is deprecated. Use resetQuota instead.');
  return await resetQuota(userId, apiKeyId);
}
