import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// 连接到 Redis
if (!redis.isOpen) {
  redis.connect();
}

export { redis };

// Redis 键名生成器
export const RedisKeys = {
  // 用户每日配额使用情况: user_quota:userId:YYYY-MM-DD
  userDailyQuota: (userId: string, date: string) => `user_quota:${userId}:${date}`,

  // 用户每日请求次数: user_requests:userId:YYYY-MM-DD
  userDailyRequests: (userId: string, date: string) => `user_requests:${userId}:${date}`,

  // 用户每分钟请求次数: user_rpm:userId:YYYY-MM-DD:HH:MM
  userRPM: (userId: string, dateTime: string) => `user_rpm:${userId}:${dateTime}`,

  // 用户配额策略缓存: user_policy:userId
  userPolicy: (userId: string) => `user_policy:${userId}`,

  // API Key 配置缓存: api_keys:provider
  apiKeys: (provider: string) => `api_keys:${provider}`,

  // 请求日志: request_log:userId:requestId
  requestLog: (userId: string, requestId: string) => `request_log:${userId}:${requestId}`,
};

// 获取今日日期字符串
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// 获取当前分钟字符串
export const getCurrentMinuteString = () => {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}:${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};
