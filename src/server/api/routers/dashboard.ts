import { createTRPCRouter, publicProcedure } from '../trpc';
import { usageRecordDb } from '../../../lib/database';
import { and, gte, lte, count, sum, sql } from 'drizzle-orm';
import { db } from '../../../lib/drizzle';
import { usageRecords } from '../../../lib/schema';

export const dashboardRouter = createTRPCRouter({
  // 获取仪表盘统计数据
  getStats: publicProcedure.query(async () => {
    try {
      const stats = await usageRecordDb.getStats();

      // 计算增长率（与昨日数据对比）
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const twoDaysAgo = new Date(yesterday);
      twoDaysAgo.setHours(0, 0, 0, 0);

      // 获取昨日的统计数据
      const [
        yesterdayUsersResult,
        yesterdayRequestsResult,
        yesterdayTokensResult,
        yesterdayActiveUsersResult,
      ] = await Promise.all([
        // 昨日用户数（从用量记录中统计唯一用户）
        db
          .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
          .from(usageRecords)
          .where(lte(usageRecords.timestamp, yesterday)),

        // 昨日请求数
        db
          .select({ count: count() })
          .from(usageRecords)
          .where(
            and(gte(usageRecords.timestamp, twoDaysAgo), lte(usageRecords.timestamp, yesterday))
          ),

        // 昨日 Token 消耗
        db
          .select({ sum: sum(usageRecords.totalTokens) })
          .from(usageRecords)
          .where(
            and(gte(usageRecords.timestamp, twoDaysAgo), lte(usageRecords.timestamp, yesterday))
          ),

        // 昨日活跃用户数
        db
          .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
          .from(usageRecords)
          .where(
            and(gte(usageRecords.timestamp, twoDaysAgo), lte(usageRecords.timestamp, yesterday))
          ),
      ]);

      const yesterdayUsers = Number(yesterdayUsersResult[0]?.count || 0);
      const yesterdayRequests = Number(yesterdayRequestsResult[0]?.count || 0);
      const yesterdayTokens = Number(yesterdayTokensResult[0]?.sum || 0);
      const yesterdayActiveUsers = Number(yesterdayActiveUsersResult[0]?.count || 0);

      // 计算增长率
      const userGrowthRate =
        yesterdayUsers > 0
          ? Math.round(((stats.totalUsers - yesterdayUsers) / yesterdayUsers) * 100)
          : 0;
      const requestGrowthRate =
        yesterdayRequests > 0
          ? Math.round(((stats.todayRequests - yesterdayRequests) / yesterdayRequests) * 100)
          : 0;
      const tokenGrowthRate =
        yesterdayTokens > 0
          ? Math.round(((stats.todayTokens - yesterdayTokens) / yesterdayTokens) * 100)
          : 0;
      const activeUserGrowthRate = stats.activeUsers - yesterdayActiveUsers;

      return {
        totalUsers: {
          value: stats.totalUsers,
          change: userGrowthRate,
          trend: userGrowthRate > 0 ? 'up' : 'down',
        },
        todayRequests: {
          value: stats.todayRequests,
          change: requestGrowthRate,
          trend: requestGrowthRate > 0 ? 'up' : 'down',
        },
        todayTokens: {
          value: stats.todayTokens,
          change: tokenGrowthRate,
          trend: tokenGrowthRate > 0 ? 'up' : 'down',
        },
        activeUsers: {
          value: stats.activeUsers,
          change: activeUserGrowthRate,
          trend: activeUserGrowthRate > 0 ? 'up' : 'down',
        },
      };
    } catch (error) {
      console.error('获取仪表盘统计数据失败:', error);
      throw new Error('获取统计数据失败');
    }
  }),

  // 获取最近活动
  getRecentActivity: publicProcedure.query(async () => {
    try {
      const recentRecords = await usageRecordDb.getByDateRange(
        new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
        new Date()
      );

      // 转换为活动格式
      const activities = recentRecords.slice(0, 10).map((record) => ({
        id: record.id,
        type: 'api_call',
        description: `${record.user.name || '未知用户'} 调用了 ${record.model} API`,
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
  getUsageTrend: publicProcedure.query(async () => {
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
        const dateStr = date.toISOString().split('T')[0];
        dailyStats.set(dateStr, {
          date: dateStr,
          requests: 0,
          tokens: 0,
        });
      }

      records.forEach((record) => {
        const dateStr = record.timestamp.toISOString().split('T')[0];
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

  // 获取模型使用分布
  getModelDistribution: publicProcedure.query(async () => {
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
