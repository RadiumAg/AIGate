import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

if (!redis.isOpen) {
  redis.connect();
}

export { redis };

// Redis 键名生成器
export const RedisKeys = {
  // 用户每日配额使用情况: user_quota:userId:date:apiKey
  userDailyQuota: (userId: string, apiKey: string, date: string) =>
    `user_quota:${userId}:${date}:${apiKey}`,

  // 用户每日请求次数: user_requests:userId:date:apiKey
  userDailyRequests: (userId: string, apiKey: string, date: string) =>
    `user_requests:${userId}:${date}:${apiKey}`,

  // 用户每分钟请求次数: user_rpm:userId:YYYY-MM-DD:HH:MM
  userRPM: (userId: string, apiKey: string, dateTime: string) =>
    `user_rpm:${userId}:${apiKey}:${dateTime}`,

  // 用户配额策略缓存: user_policy:userId
  userPolicy: (userId: string) => `user_policy:${userId}`,

  // API Key 配置缓存: api_keys:provider
  apiKeys: (provider: string) => `api_keys:${provider}`,

  // 根据 API Key 获取配额策略的keyId
  quotaPolicyByApiKey: (apiKeyId: string) => `policy:apiKey:${apiKeyId}`,

  // 请求日志: request_log:userId:requestId
  requestLog: (userId: string, requestId: string) => `request_log:${userId}:${requestId}`,
};
