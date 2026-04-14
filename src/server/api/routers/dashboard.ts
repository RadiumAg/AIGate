import { getTodayString } from '@/lib/date';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { usageRecordDb } from '@/lib/database';
import { db } from '@/lib/drizzle';
import { usageRecords } from '@/lib/schema';
import { and, gte, lte, count, sum, sql, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { isDemoMode } from '@/lib/demo-config';
import { getDemoStats } from '@/lib/demo-stats';

export const dashboardRouter = createTRPCRouter({
  // 获取仪表盘统计数据
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate } = input;

        // 如果没有提供日期范围，默认使用今天
        const now = new Date();
        const queryStartDate = startDate || new Date(now.setHours(0, 0, 0, 0));
        const queryEndDate = endDate || new Date(now.setHours(23, 59, 59, 999));

        // 计算对比时间段（前一天）
        const comparisonStart = new Date(queryStartDate);
        const comparisonEnd = new Date(queryEndDate);
        const diffDays = Math.ceil(
          (queryEndDate.getTime() - queryStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        comparisonStart.setDate(comparisonStart.getDate() - diffDays);
        comparisonEnd.setDate(comparisonEnd.getDate() - diffDays);

        // 获取当前时间段和对比时间段的数据
        let currentUsers: number;
        let comparisonUsers: number;
        let currentRequests: number;
        let comparisonRequests: number;
        let currentTokens: number;
        let comparisonTokens: number;
        let currentActiveUsers: number;
        let comparisonActiveUsers: number;

        if (isDemoMode()) {
          // 演示模式：使用内存数据统计
          currentUsers = getDemoStats.getDistinctUserCount(queryStartDate, queryEndDate).count;
          comparisonUsers = getDemoStats.getDistinctUserCount(comparisonStart, comparisonEnd).count;
          currentRequests = getDemoStats.getRequestCount(queryStartDate, queryEndDate).count;
          comparisonRequests = getDemoStats.getRequestCount(comparisonStart, comparisonEnd).count;
          currentTokens = getDemoStats.getTokenSum(queryStartDate, queryEndDate).sum || 0;
          comparisonTokens = getDemoStats.getTokenSum(comparisonStart, comparisonEnd).sum || 0;
          currentActiveUsers = currentUsers;
          comparisonActiveUsers = comparisonUsers;
        } else {
          // 生产模式：使用数据库查询
          const [
            currentPeriodUsersResult,
            comparisonPeriodUsersResult,
            currentPeriodRequestsResult,
            comparisonPeriodRequestsResult,
            currentPeriodTokensResult,
            comparisonPeriodTokensResult,
            currentPeriodActiveUsersResult,
            comparisonPeriodActiveUsersResult,
          ] = await Promise.all([
            // 当前时间段唯一用户数
            db
              .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, queryStartDate),
                  lte(usageRecords.timestamp, queryEndDate)
                )
              ),

            // 对比时间段唯一用户数
            db
              .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, comparisonStart),
                  lte(usageRecords.timestamp, comparisonEnd)
                )
              ),

            // 当前时间段请求数
            db
              .select({ count: count() })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, queryStartDate),
                  lte(usageRecords.timestamp, queryEndDate)
                )
              ),

            // 对比时间段请求数
            db
              .select({ count: count() })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, comparisonStart),
                  lte(usageRecords.timestamp, comparisonEnd)
                )
              ),

            // 当前时间段 Token 消耗
            db
              .select({ sum: sum(usageRecords.totalTokens) })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, queryStartDate),
                  lte(usageRecords.timestamp, queryEndDate)
                )
              ),

            // 对比时间段 Token 消耗
            db
              .select({ sum: sum(usageRecords.totalTokens) })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, comparisonStart),
                  lte(usageRecords.timestamp, comparisonEnd)
                )
              ),

            // 当前时间段活跃用户数
            db
              .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, queryStartDate),
                  lte(usageRecords.timestamp, queryEndDate)
                )
              ),

            // 对比时间段活跃用户数
            db
              .select({ count: sql<number>`count(distinct ${usageRecords.userId})` })
              .from(usageRecords)
              .where(
                and(
                  gte(usageRecords.timestamp, comparisonStart),
                  lte(usageRecords.timestamp, comparisonEnd)
                )
              ),
          ]);

          currentUsers = Number(currentPeriodUsersResult[0]?.count || 0);
          comparisonUsers = Number(comparisonPeriodUsersResult[0]?.count || 0);
          currentRequests = Number(currentPeriodRequestsResult[0]?.count || 0);
          comparisonRequests = Number(comparisonPeriodRequestsResult[0]?.count || 0);
          currentTokens = Number(currentPeriodTokensResult[0]?.sum || 0);
          comparisonTokens = Number(comparisonPeriodTokensResult[0]?.sum || 0);
          currentActiveUsers = Number(currentPeriodActiveUsersResult[0]?.count || 0);
          comparisonActiveUsers = Number(comparisonPeriodActiveUsersResult[0]?.count || 0);
        }

        // 计算增长率
        const userGrowthRate =
          comparisonUsers > 0
            ? Math.round(((currentUsers - comparisonUsers) / comparisonUsers) * 100)
            : 0;
        const requestGrowthRate =
          comparisonRequests > 0
            ? Math.round(((currentRequests - comparisonRequests) / comparisonRequests) * 100)
            : 0;
        const tokenGrowthRate =
          comparisonTokens > 0
            ? Math.round(((currentTokens - comparisonTokens) / comparisonTokens) * 100)
            : 0;
        const activeUserGrowthRate =
          comparisonActiveUsers > 0
            ? Math.round(
                ((currentActiveUsers - comparisonActiveUsers) / comparisonActiveUsers) * 100
              )
            : 0;

        return {
          totalUsers: {
            value: currentUsers,
            change: userGrowthRate,
            trend: userGrowthRate >= 0 ? 'up' : 'down',
          },
          requests: {
            value: currentRequests,
            change: requestGrowthRate,
            trend: requestGrowthRate >= 0 ? 'up' : 'down',
          },
          tokens: {
            value: currentTokens,
            change: tokenGrowthRate,
            trend: tokenGrowthRate >= 0 ? 'up' : 'down',
          },
          activeUsers: {
            value: currentActiveUsers,
            change: activeUserGrowthRate,
            trend: activeUserGrowthRate >= 0 ? 'up' : 'down',
          },
          dateRange: {
            start: queryStartDate,
            end: queryEndDate,
          },
        };
      } catch (error) {
        console.error('获取仪表盘统计数据失败:', error);
        throw new Error('获取统计数据失败');
      }
    }),

  // 获取最近活动
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        hours: z.number().optional().default(24),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, hours } = input;

        // 如果提供了具体日期范围，使用该范围
        let queryStartDate: Date;
        let queryEndDate: Date;

        if (startDate && endDate) {
          queryStartDate = startDate;
          queryEndDate = endDate;
        } else {
          // 否则使用最近N小时
          queryEndDate = new Date();
          queryStartDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        }

        const recentRecords = await usageRecordDb.getByDateRange(queryStartDate, queryEndDate);

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

  // 获取使用趋势数据
  getUsageTrend: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().optional().default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, days } = input;

        // 如果提供了具体日期范围，使用该范围
        let queryStartDate: Date;
        let queryEndDate: Date;

        if (startDate && endDate) {
          queryStartDate = startDate;
          queryEndDate = endDate;
        } else {
          // 否则使用最近N天
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - (days - 1));
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate.setHours(23, 59, 59, 999);
        }

        const records = await usageRecordDb.getByDateRange(queryStartDate, queryEndDate);

        // 按日期分组统计
        const dailyStats = new Map();

        // 初始化日期范围内的所有日期
        const currentDate = new Date(queryStartDate);
        while (currentDate <= queryEndDate) {
          const dateStr = getTodayString(currentDate);
          dailyStats.set(dateStr, {
            date: dateStr,
            requests: 0,
            tokens: 0,
            cost: 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        records.forEach((record) => {
          const dateStr = getTodayString(record.timestamp);
          if (dailyStats.has(dateStr)) {
            const stats = dailyStats.get(dateStr);
            stats.requests += 1;
            stats.tokens += record.totalTokens;
            stats.cost += parseFloat(record.cost || '0');
          }
        });

        return Array.from(dailyStats.values());
      } catch (error) {
        console.error('获取使用趋势失败:', error);
        throw new Error('获取使用趋势失败');
      }
    }),

  // 获取请求地区分布
  getRegionDistribution: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().optional().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, days } = input;

        // 如果提供了具体日期范围，使用该范围
        let queryStartDate: Date;
        let queryEndDate: Date;

        if (startDate && endDate) {
          queryStartDate = startDate;
          queryEndDate = endDate;
        } else {
          // 否则使用最近N天
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - (days - 1));
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate.setHours(23, 59, 59, 999);
        }

        let results: Array<{
          region: string | null;
          requestCount: number;
          tokenCount: number | null;
        }>;

        if (isDemoMode()) {
          results = getDemoStats.getRegionDistribution(queryStartDate, queryEndDate);
        } else {
          const dbResults = await db
            .select({
              region: usageRecords.region,
              requestCount: count(),
              tokenCount: sum(usageRecords.totalTokens),
            })
            .from(usageRecords)
            .where(
              and(
                gte(usageRecords.timestamp, queryStartDate),
                lte(usageRecords.timestamp, queryEndDate),
                isNotNull(usageRecords.region)
              )
            )
            .groupBy(usageRecords.region);

          results = dbResults.map((item) => ({
            region: item.region,
            requestCount: Number(item.requestCount),
            tokenCount: Number(item.tokenCount || 0),
          }));
        }

        return results.map((item) => ({
          name: item.region || '未知',
          value: item.requestCount,
          tokens: item.tokenCount || 0,
        }));
      } catch (error) {
        console.error('获取地区分布失败:', error);
        throw new Error('获取地区分布失败');
      }
    }),

  // 获取最近 IP 请求记录
  getRecentIpRequests: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().optional().default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, days } = input;

        // 如果提供了具体日期范围，使用该范围
        let queryStartDate: Date;
        let queryEndDate: Date;

        if (startDate && endDate) {
          queryStartDate = startDate;
          queryEndDate = endDate;
        } else {
          // 否则使用最近N天
          queryEndDate = new Date();
          queryStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        }

        let results: Array<{
          id: string;
          userId: string;
          clientIp: string | null;
          region: string | null;
          model: string;
          provider: string;
          totalTokens: number;
          timestamp: Date;
        }>;

        if (isDemoMode()) {
          results = getDemoStats.getRecentIpRequests(20, queryStartDate, queryEndDate).map((r) => ({
            ...r,
            clientIp: r.clientIp as string | null,
            region: r.region as string | null,
          }));
        } else {
          results = await db
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
            .where(
              and(
                isNotNull(usageRecords.clientIp),
                gte(usageRecords.timestamp, queryStartDate),
                lte(usageRecords.timestamp, queryEndDate)
              )
            )
            .orderBy(sql`${usageRecords.timestamp} desc`)
            .limit(20);
        }

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
  getModelDistribution: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().optional().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, days } = input;

        // 如果提供了具体日期范围，使用该范围
        let queryStartDate: Date;
        let queryEndDate: Date;

        if (startDate && endDate) {
          queryStartDate = startDate;
          queryEndDate = endDate;
        } else {
          // 否则使用最近N天
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - (days - 1));
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate.setHours(23, 59, 59, 999);
        }

        const records = await usageRecordDb.getByDateRange(queryStartDate, queryEndDate);

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

  // 获取账单趋势数据
  getBillingTrend: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().optional().default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, days } = input;

        // 如果提供了具体日期范围，使用该范围
        let queryStartDate: Date;
        let queryEndDate: Date;

        if (startDate && endDate) {
          queryStartDate = startDate;
          queryEndDate = endDate;
        } else {
          // 否则使用最近N天
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - (days - 1));
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate.setHours(23, 59, 59, 999);
        }

        const records = await usageRecordDb.getByDateRange(queryStartDate, queryEndDate);

        // 按日期分组统计
        const dailyStats = new Map();

        // 初始化日期范围内的所有日期
        const currentDate = new Date(queryStartDate);
        while (currentDate <= queryEndDate) {
          const dateStr = getTodayString(currentDate);
          dailyStats.set(dateStr, {
            date: dateStr,
            cost: 0,
            tokens: 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        records.forEach((record) => {
          const dateStr = getTodayString(record.timestamp);
          if (dailyStats.has(dateStr)) {
            const stats = dailyStats.get(dateStr);
            stats.cost += parseFloat(record.cost || '0');
            stats.tokens += record.totalTokens;
          }
        });

        return Array.from(dailyStats.values());
      } catch (error) {
        console.error('获取账单趋势失败:', error);
        throw new Error('获取账单趋势失败');
      }
    }),
});
