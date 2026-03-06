import { getTodayString } from '@/lib/date';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { usageRecordDb } from '@/lib/database';
import { db } from '@/lib/drizzle';
import { usageRecords } from '@/lib/schema';
import { and, gte, lte, count, sum, sql, isNotNull } from 'drizzle-orm';

export const dashboardRouter = createTRPCRouter({
  // 获取仪表盘统计数据
  getStats: protectedProcedure.query(async () => {
    try {
      const stats = await usageRecordDb.getStats();

      // 计算增长率（与昨日数据对比）
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const twoDaysAgo = new Date(yesterday);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

      // 获取今日和昨日的统计数据
      const [
        todayNewUsersResult,
        yesterdayNewUsersResult,
        todayRequestsResult,
        yesterdayRequestsResult,
        todayTokensResult,
        yesterdayTokensResult,
        todayActiveUsersResult,
        yesterdayActiveUsersResult,
      ] = await Promise.all([
        // 今日新增用户数（今日出现的用户中，昨日未出现过的）
        db
          .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
          .from(usageRecords)
          .where(gte(usageRecords.timestamp, today)),

        // 昨日新增用户数
        db
          .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
          .from(usageRecords)
          .where(and(gte(usageRecords.timestamp, yesterday), lte(usageRecords.timestamp, today))),

        // 今日请求数
        db.select({ count: count() }).from(usageRecords).where(gte(usageRecords.timestamp, today)),

        // 昨日请求数
        db
          .select({ count: count() })
          .from(usageRecords)
          .where(and(gte(usageRecords.timestamp, yesterday), lte(usageRecords.timestamp, today))),

        // 今日 Token 消耗
        db
          .select({ sum: sum(usageRecords.totalTokens) })
          .from(usageRecords)
          .where(gte(usageRecords.timestamp, today)),

        // 昨日 Token 消耗
        db
          .select({ sum: sum(usageRecords.totalTokens) })
          .from(usageRecords)
          .where(and(gte(usageRecords.timestamp, yesterday), lte(usageRecords.timestamp, today))),

        // 今日活跃用户数
        db
          .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
          .from(usageRecords)
          .where(gte(usageRecords.timestamp, today)),

        // 昨日活跃用户数
        db
          .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
          .from(usageRecords)
          .where(and(gte(usageRecords.timestamp, yesterday), lte(usageRecords.timestamp, today))),
      ]);

      const todayNewUsers = Number(todayNewUsersResult[0]?.count || 0);
      const yesterdayNewUsers = Number(yesterdayNewUsersResult[0]?.count || 0);
      const todayRequests = Number(todayRequestsResult[0]?.count || 0);
      const yesterdayRequests = Number(yesterdayRequestsResult[0]?.count || 0);
      const todayTokens = Number(todayTokensResult[0]?.sum || 0);
      const yesterdayTokens = Number(yesterdayTokensResult[0]?.sum || 0);
      const todayActiveUsers = Number(todayActiveUsersResult[0]?.count || 0);
      const yesterdayActiveUsers = Number(yesterdayActiveUsersResult[0]?.count || 0);

      // 计算增长率（今日 vs 昨日）
      const userGrowthRate =
        yesterdayNewUsers > 0
          ? Math.round(((todayNewUsers - yesterdayNewUsers) / yesterdayNewUsers) * 100)
          : 0;
      const requestGrowthRate =
        yesterdayRequests > 0
          ? Math.round(((todayRequests - yesterdayRequests) / yesterdayRequests) * 100)
          : 0;
      const tokenGrowthRate =
        yesterdayTokens > 0
          ? Math.round(((todayTokens - yesterdayTokens) / yesterdayTokens) * 100)
          : 0;
      const activeUserGrowthRate =
        yesterdayActiveUsers > 0
          ? Math.round(((todayActiveUsers - yesterdayActiveUsers) / yesterdayActiveUsers) * 100)
          : 0;

      return {
        totalUsers: {
          value: stats.totalUsers,
          change: userGrowthRate,
          trend: userGrowthRate >= 0 ? 'up' : 'down',
        },
        todayRequests: {
          value: todayRequests,
          change: requestGrowthRate,
          trend: requestGrowthRate >= 0 ? 'up' : 'down',
        },
        todayTokens: {
          value: todayTokens,
          change: tokenGrowthRate,
          trend: tokenGrowthRate >= 0 ? 'up' : 'down',
        },
        activeUsers: {
          value: todayActiveUsers,
          change: activeUserGrowthRate,
          trend: activeUserGrowthRate >= 0 ? 'up' : 'down',
        },
      };
    } catch (error) {
      console.error('获取仪表盘统计数据失败:', error);
      throw new Error('获取统计数据失败');
    }
  }),

  // 获取最近活动
  getRecentActivity: protectedProcedure.query(async () => {
    try {
      const recentRecords = await usageRecordDb.getByDateRange(
        new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
        new Date()
      );

      const activities = recentRecords.slice(0, 10).map((record) => ({
        id: record.id,
        type: 'api_call',
        description: `${record.user.id || '未知用户'} 调用了 ${record.model} API`,
        time: record.timestamp.toISOString(),
        details: {
          model: record.model,
          provider: record.provider,
          tokens: record.totalTokens,
          cost: record.cost,
        },
      }));

      return activities;
    } catch (error) {
      console.error('获取最近活动失败:', error);
      throw new Error('获取最近活动失败');
    }
  }),

  // 获取使用趋势数据（最近7天）
  getUsageTrend: protectedProcedure.query(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const records = await usageRecordDb.getByDateRange(startDate, endDate);

      // 按日期分组统计
      const dailyStats = new Map();

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = getTodayString(date);
        dailyStats.set(dateStr, {
          date: dateStr,
          requests: 0,
          tokens: 0,
        });
      }

      records.forEach((record) => {
        const dateStr = getTodayString(record.timestamp);
        if (dailyStats.has(dateStr)) {
          const stats = dailyStats.get(dateStr);
          stats.requests += 1;
          stats.tokens += record.totalTokens;
        }
      });

      return Array.from(dailyStats.values()).reverse();
    } catch (error) {
      console.error('获取使用趋势失败:', error);
      throw new Error('获取使用趋势失败');
    }
  }),

  // 获取请求地区分布
  getRegionDistribution: protectedProcedure.query(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const results = await db
        .select({
          region: usageRecords.region,
          requestCount: count(),
          tokenCount: sum(usageRecords.totalTokens),
        })
        .from(usageRecords)
        .where(
          and(
            gte(usageRecords.timestamp, startDate),
            lte(usageRecords.timestamp, endDate),
            isNotNull(usageRecords.region)
          )
        )
        .groupBy(usageRecords.region);

      return results.map((item) => ({
        name: item.region || '未知',
        value: Number(item.requestCount),
        tokens: Number(item.tokenCount || 0),
      }));
    } catch (error) {
      console.error('获取地区分布失败:', error);
      throw new Error('获取地区分布失败');
    }
  }),

  // 获取最近 IP 请求记录
  getRecentIpRequests: protectedProcedure.query(async () => {
    try {
      const results = await db
        .select({
          id: usageRecords.id,
          userId: usageRecords.userId,
          clientIp: usageRecords.clientIp,
          region: usageRecords.region,
          model: usageRecords.model,
          provider: usageRecords.provider,
          totalTokens: usageRecords.totalTokens,
          timestamp: usageRecords.timestamp,
        })
        .from(usageRecords)
        .where(isNotNull(usageRecords.clientIp))
        .orderBy(sql`${usageRecords.timestamp} desc`)
        .limit(20);

      return results.map((record) => ({
        id: record.id,
        userId: record.userId,
        clientIp: record.clientIp || '',
        region: record.region || '未知',
        model: record.model,
        provider: record.provider,
        totalTokens: record.totalTokens,
        timestamp: record.timestamp.toISOString(),
      }));
    } catch (error) {
      console.error('获取最近 IP 请求记录失败:', error);
      throw new Error('获取最近 IP 请求记录失败');
    }
  }),

  // 获取模型使用分布
  getModelDistribution: protectedProcedure.query(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // 最近30天

      const records = await usageRecordDb.getByDateRange(startDate, endDate);

      // 按模型统计
      const modelStats = new Map();

      records.forEach((record) => {
        const model = record.model;
        if (!modelStats.has(model)) {
          modelStats.set(model, {
            name: model,
            value: 0,
            requests: 0,
          });
        }
        const stats = modelStats.get(model);
        stats.value += record.totalTokens;
        stats.requests += 1;
      });

      return Array.from(modelStats.values()).sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('获取模型分布失败:', error);
      throw new Error('获取模型分布失败');
    }
  }),
});
