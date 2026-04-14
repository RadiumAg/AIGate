/**
 * 演示模式统计数据服务
 * 为 dashboard router 等需要直接数据库查询的模块提供演示模式支持
 */

import { demoDataStore } from './demo-data';

export interface StatsResult {
  count: number;
}

export interface SumResult {
  sum: number | null;
}

/**
 * 获取演示模式下的统计数据
 */
export const getDemoStats = {
  // 获取指定日期范围内的唯一用户数
  getDistinctUserCount: (startDate: Date, endDate: Date): StatsResult => {
    const records = demoDataStore
      .getAllUsageRecords()
      .filter((r) => r.timestamp >= startDate && r.timestamp <= endDate);
    const uniqueUsers = new Set(records.map((r) => r.userId));
    return { count: uniqueUsers.size };
  },

  // 获取指定日期范围内的请求数
  getRequestCount: (startDate: Date, endDate: Date): StatsResult => {
    const count = demoDataStore
      .getAllUsageRecords()
      .filter((r) => r.timestamp >= startDate && r.timestamp <= endDate).length;
    return { count };
  },

  // 获取指定日期范围内的 Token 总数
  getTokenSum: (startDate: Date, endDate: Date): SumResult => {
    const sum = demoDataStore
      .getAllUsageRecords()
      .filter((r) => r.timestamp >= startDate && r.timestamp <= endDate)
      .reduce((total, r) => total + r.totalTokens, 0);
    return { sum };
  },

  // 获取地区分布数据
  getRegionDistribution: (
    startDate: Date,
    endDate: Date
  ): Array<{ region: string | null; requestCount: number; tokenCount: number | null }> => {
    const records = demoDataStore
      .getAllUsageRecords()
      .filter((r) => r.timestamp >= startDate && r.timestamp <= endDate && r.region);

    const regionMap = new Map<
      string,
      { region: string; requestCount: number; tokenCount: number }
    >();

    records.forEach((r) => {
      if (!r.region) return;
      const existing = regionMap.get(r.region);
      if (existing) {
        existing.requestCount += 1;
        existing.tokenCount += r.totalTokens;
      } else {
        regionMap.set(r.region, {
          region: r.region,
          requestCount: 1,
          tokenCount: r.totalTokens,
        });
      }
    });

    return Array.from(regionMap.values()).map((item) => ({
      region: item.region,
      requestCount: item.requestCount,
      tokenCount: item.tokenCount,
    }));
  },

  // 获取最近的 IP 请求记录
  getRecentIpRequests: (
    limit: number = 20,
    startDate?: Date,
    endDate?: Date
  ): Array<{
    id: string;
    userId: string;
    clientIp: string;
    region: string;
    model: string;
    provider: string;
    totalTokens: number;
    timestamp: Date;
  }> => {
    const queryStartDate = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const queryEndDate = endDate || new Date();

    return demoDataStore
      .getAllUsageRecords()
      .filter((r): r is typeof r & { clientIp: string } => !!r.clientIp)
      .filter((r) => r.timestamp >= queryStartDate && r.timestamp <= queryEndDate)
      .slice(0, limit)
      .map((record) => ({
        id: record.id,
        userId: record.userId,
        clientIp: record.clientIp || '',
        region: record.region || '未知',
        model: record.model,
        provider: record.provider,
        totalTokens: record.totalTokens,
        timestamp: record.timestamp,
      }));
  },
};
