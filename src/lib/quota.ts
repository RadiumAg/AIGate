import { redis, RedisKeys, getTodayString, getCurrentMinuteString } from './redis';
import { QuotaPolicy, QuotaCheckResult, UsageRecord, IdentifyBy } from './types';
import { whitelistRuleDb, quotaPolicyDb, usageRecordDb } from './database';

// 默认配额策略
const DEFAULT_QUOTA_POLICY: QuotaPolicy = {
  id: 'default',
  name: '默认策略',
  dailyTokenLimit: 5000,
  monthlyTokenLimit: 50000,
  rpmLimit: 10,
  identifyBy: 'email',
  validationEnabled: false,
};

// 根据邮箱匹配白名单规则并获取配额策略
export async function getQuotaPolicyByEmail(email: string): Promise<QuotaPolicy> {
  try {
    const cacheKey = `policy:email:${email}`;
    const cachedPolicy = await redis.get(cacheKey);
    if (cachedPolicy) {
      return JSON.parse(cachedPolicy);
    }

    // 通过白名单规则匹配获取策略名称
    const { policyName } = await whitelistRuleDb.matchUserPolicy(email);

    // 根据策略名称从数据库获取完整的配额策略
    const policies = await quotaPolicyDb.getAll();
    const matchedPolicy = policies.find((p) => p.name === policyName);

    const policy = matchedPolicy
      ? {
          ...matchedPolicy,
          description: matchedPolicy.description || undefined,
          validationPattern: matchedPolicy.validationPattern ?? undefined,
          validationEnabled: Boolean(matchedPolicy.validationEnabled),
        }
      : DEFAULT_QUOTA_POLICY;

    // 缓存策略（缓存1小时）
    await redis.setEx(cacheKey, 60 * 60, JSON.stringify(policy));
    return policy;
  } catch (error) {
    console.error('Error getting quota policy by email:', error);
    return DEFAULT_QUOTA_POLICY;
  }
}

// 根据请求特征获取配额策略（可扩展支持更多匹配方式）
export async function getQuotaPolicyByRequest(requestInfo: {
  email?: string;
  apiKey?: string;
  ip?: string;
  domain?: string;
}): Promise<QuotaPolicy> {
  try {
    // 优先使用邮箱匹配
    if (requestInfo.email) {
      return await getQuotaPolicyByEmail(requestInfo.email);
    }

    // 可以在这里扩展其他匹配方式
    // 比如根据 API Key、IP 地址等匹配

    return DEFAULT_QUOTA_POLICY;
  } catch (error) {
    console.error('Error getting quota policy by request:', error);
    return DEFAULT_QUOTA_POLICY;
  }
}

// 根据策略的 identifyBy 从请求信息中提取用户标识符
export function extractIdentifier(
  requestInfo: {
    email?: string;
    userId?: string;
    ip?: string;
    origin?: string;
    apiKey?: string;
    domain?: string;
  },
  identifyBy: IdentifyBy = 'email'
): string {
  switch (identifyBy) {
    case 'ip':
      return requestInfo.ip || 'unknown-ip';
    case 'origin':
      return requestInfo.origin || requestInfo.domain || 'unknown-origin';
    case 'email':
      return requestInfo.email || 'anonymous';
    case 'userId':
      return requestInfo.userId || requestInfo.email || 'anonymous';
    default:
      return requestInfo.email || requestInfo.ip || 'anonymous';
  }
}

// 校验标识符是否符合策略的校验规则
export function validateIdentifier(
  identifier: string,
  policy: QuotaPolicy
): { valid: boolean; reason?: string } {
  if (!policy.validationEnabled) {
    return { valid: true };
  }

  const identifyBy = policy.identifyBy || 'email';

  // 只有 email 和 userId 类型支持校验规则
  if (identifyBy !== 'email' && identifyBy !== 'userId') {
    return { valid: true };
  }

  if (!policy.validationPattern) {
    return { valid: true };
  }

  try {
    const regex = new RegExp(policy.validationPattern);
    if (!regex.test(identifier)) {
      return {
        valid: false,
        reason: `${identifyBy} "${identifier}" 不符合校验规则: ${policy.validationPattern}`,
      };
    }
    return { valid: true };
  } catch {
    console.error(`Invalid validation pattern: ${policy.validationPattern}`);
    return { valid: true };
  }
}

// 检查配额限制
export async function checkQuota(
  requestInfo: {
    email?: string;
    userId?: string;
    apiKey?: string;
    ip?: string;
    origin?: string;
    domain?: string;
  },
  estimatedTokens: number = 0
): Promise<QuotaCheckResult> {
  try {
    const policy = await getQuotaPolicyByRequest(requestInfo);
    const today = getTodayString();
    const currentMinute = getCurrentMinuteString();

    // 根据策略的 identifyBy 提取标识符
    const identifyBy = (policy.identifyBy || 'email') as IdentifyBy;
    const identifier = extractIdentifier(requestInfo, identifyBy);

    // 校验标识符是否符合策略的校验规则
    const validation = validateIdentifier(identifier, policy);
    if (!validation.valid) {
      return {
        allowed: false,
        reason: validation.reason,
        policy,
      };
    }

    // 检查每日 Token 限制
    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
    const dailyUsage = await redis.get(dailyUsageKey);
    const currentDailyTokens = dailyUsage ? parseInt(dailyUsage) : 0;

    if (currentDailyTokens + estimatedTokens > policy.dailyTokenLimit) {
      return {
        allowed: false,
        reason: `每日 Token 配额已用完。当前使用: ${currentDailyTokens}/${policy.dailyTokenLimit}`,
        remainingTokens: Math.max(0, policy.dailyTokenLimit - currentDailyTokens),
        policy,
      };
    }

    // 检查每分钟请求次数限制
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

    return {
      allowed: true,
      remainingTokens: policy.dailyTokenLimit - currentDailyTokens,
      remainingRequests: policy.rpmLimit - currentRequests,
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

    // 更新每日 Token 使用量
    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
    await redis.incrBy(dailyUsageKey, record.totalTokens);
    // 设置过期时间为 7 天
    await redis.expire(dailyUsageKey, 7 * 24 * 60 * 60);

    // 更新每分钟请求次数
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
      timestamp: new Date(record.timestamp),
    });

    console.log(`Usage recorded for identifier ${identifier}: ${record.totalTokens} tokens`);
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}

// 获取今日使用情况
export async function getDailyUsage(requestInfo: {
  email?: string;
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
    const identifier = requestInfo.email || requestInfo.ip || requestInfo.apiKey || 'anonymous';

    const dailyUsageKey = RedisKeys.userDailyQuota(identifier, today);
    const tokensUsed = await redis.get(dailyUsageKey);

    // 获取今日请求次数（简化实现，实际可能需要更复杂的统计）
    const requestsToday = 0; // 这里可以通过其他方式统计

    return {
      tokensUsed: tokensUsed ? parseInt(tokensUsed) : 0,
      requestsToday,
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

// 兼容性函数 - 保持向后兼容
export async function getUserQuotaPolicy(userId: string): Promise<QuotaPolicy> {
  console.warn('getUserQuotaPolicy is deprecated. Use getQuotaPolicyByEmail instead.');
  return await getQuotaPolicyByEmail(userId);
}

export async function checkUserQuota(
  userId: string,
  estimatedTokens: number = 0
): Promise<QuotaCheckResult> {
  console.warn('checkUserQuota is deprecated. Use checkQuota instead.');
  return await checkQuota({ email: userId }, estimatedTokens);
}

export async function getUserDailyUsage(userId: string): Promise<{
  tokensUsed: number;
  requestsToday: number;
  policy: QuotaPolicy;
}> {
  console.warn('getUserDailyUsage is deprecated. Use getDailyUsage instead.');
  return await getDailyUsage({ email: userId });
}

export async function resetUserQuota(userId: string): Promise<void> {
  console.warn('resetUserQuota is deprecated. Use resetQuota instead.');
  return await resetQuota(userId);
}
