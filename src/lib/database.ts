// 数据库抽象层 - 使用 Drizzle ORM
import { db } from './drizzle';
import { apiKeys, quotaPolicies, usageRecords, whitelistRules } from './schema';
import { eq, and, gte, lte, desc, count, sum, countDistinct } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
  ApiKey,
  QuotaPolicy,
  UsageRecord,
  WhitelistRule,
  NewApiKey,
  NewQuotaPolicy,
  NewUsageRecord,
  NewWhitelistRule,
} from './schema';
import { convertProviderToDb } from '@/server/api/routers/apiKey';

// API Key 数据库操作
export const apiKeyDb = {
  getAll: async (): Promise<ApiKey[]> => {
    try {
      return await db.select().from(apiKeys);
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  getByProvider: async (provider: string): Promise<ApiKey[]> => {
    try {
      return await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.provider, provider as (typeof apiKeys.provider.enumValues)[number]));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<ApiKey | null> => {
    try {
      const result = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  create: async (apiKey: NewApiKey): Promise<ApiKey> => {
    const result = await db.insert(apiKeys).values(apiKey).returning();
    return result[0];
  },

  update: async (id: string, updates: Partial<ApiKey>): Promise<ApiKey | null> => {
    try {
      const result = await db
        .update(apiKeys)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(apiKeys.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await db.delete(apiKeys).where(eq(apiKeys.id, id));
      return true;
    } catch (error) {
      console.error('Database error:', error);
      return false;
    }
  },
};

// 配额策略数据库操作
export const quotaPolicyDb = {
  getAll: async (): Promise<QuotaPolicy[]> => {
    try {
      return await db.select().from(quotaPolicies);
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<QuotaPolicy | null> => {
    try {
      const result = await db.select().from(quotaPolicies).where(eq(quotaPolicies.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  create: async (
    policy: Omit<NewQuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<QuotaPolicy> => {
    const newPolicy: NewQuotaPolicy = {
      id: nanoid(),
      ...policy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(quotaPolicies).values(newPolicy).returning();
    return result[0];
  },

  update: async (id: string, updates: Partial<QuotaPolicy>): Promise<QuotaPolicy | null> => {
    try {
      const result = await db
        .update(quotaPolicies)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(quotaPolicies.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await db.delete(quotaPolicies).where(eq(quotaPolicies.id, id));
      return true;
    } catch (error) {
      console.error('Database error:', error);
      return false;
    }
  },
};

// 用量记录数据库操作
export const usageRecordDb = {
  getAll: async (): Promise<
    Array<UsageRecord & { user: { id: string; name: string | null; email: string | null } }>
  > => {
    try {
      const results = await db.select().from(usageRecords).orderBy(desc(usageRecords.timestamp));

      return results.map((record) => ({
        ...record,
        user: {
          id: record.userId,
          name: record.userId.includes('@') ? record.userId.split('@')[0] : '未知用户',
          email: record.userId.includes('@') ? record.userId : null,
        },
      }));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  getByUserId: async (
    userId: string
  ): Promise<
    Array<UsageRecord & { user: { id: string; name: string | null; email: string | null } }>
  > => {
    try {
      const results = await db
        .select()
        .from(usageRecords)
        .where(eq(usageRecords.userId, userId))
        .orderBy(desc(usageRecords.timestamp));

      return results.map((record) => ({
        ...record,
        user: {
          id: record.userId,
          name: record.userId.includes('@') ? record.userId.split('@')[0] : '未知用户',
          email: record.userId.includes('@') ? record.userId : null,
        },
      }));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  getByDateRange: async (
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<UsageRecord & { user: { id: string; name: string | null; email: string | null } }>
  > => {
    try {
      const results = await db
        .select()
        .from(usageRecords)
        .where(and(gte(usageRecords.timestamp, startDate), lte(usageRecords.timestamp, endDate)))
        .orderBy(desc(usageRecords.timestamp));

      return results.map((record) => ({
        ...record,
        user: {
          id: record.userId,
          name: record.userId.includes('@') ? record.userId.split('@')[0] : '未知用户',
          email: record.userId.includes('@') ? record.userId : null,
        },
      }));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  create: async (record: NewUsageRecord): Promise<UsageRecord> => {
    const result = await db.insert(usageRecords).values(record).returning();
    return result[0];
  },

  // 获取统计数据
  getStats: async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsersResult,
        todayRequestsResult,
        todayTokensResult,
        totalRequestsResult,
        activeUsersResult,
      ] = await Promise.all([
        // 总用户数（从用量记录中统计唯一用户）
        db.select({ count: countDistinct(usageRecords.userId) }).from(usageRecords),

        // 今日请求数
        db.select({ count: count() }).from(usageRecords).where(gte(usageRecords.timestamp, today)),

        // 今日 Token 消耗
        db
          .select({ sum: sum(usageRecords.totalTokens) })
          .from(usageRecords)
          .where(gte(usageRecords.timestamp, today)),

        // 总请求数
        db.select({ count: count() }).from(usageRecords),

        // 活跃用户数（最近7天有使用记录）
        db
          .select({ count: countDistinct(usageRecords.userId) })
          .from(usageRecords)
          .where(gte(usageRecords.timestamp, sevenDaysAgo)),
      ]);

      return {
        totalUsers: Number(totalUsersResult[0]?.count || 0),
        todayRequests: Number(todayRequestsResult[0]?.count || 0),
        todayTokens: Number(todayTokensResult[0]?.sum || 0),
        totalRequests: Number(totalRequestsResult[0]?.count || 0),
        activeUsers: Number(activeUsersResult[0]?.count || 0),
      };
    } catch (error) {
      console.error('Database error:', error);
      return {
        totalUsers: 0,
        todayRequests: 0,
        todayTokens: 0,
        totalRequests: 0,
        activeUsers: 0,
      };
    }
  },
};

// 获取用户的配额策略
export const getUserQuotaPolicyFromDb = async (userId: string): Promise<QuotaPolicy | null> => {
  try {
    // 由于当前项目没有用户表，通过白名单规则匹配用户策略
    const matchResult = await whitelistRuleDb.matchUserPolicy(userId);

    // 根据策略名称查找对应的配额策略
    const policies = await quotaPolicyDb.getAll();
    const matchedPolicy = policies.find((policy) => policy.name === matchResult.policyName);

    // 如果找到匹配的策略则返回，否则返回第一个策略作为默认策略
    return matchedPolicy || policies[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
};
// 获取活跃的 API Key
export const getActiveApiKey = async (provider: string): Promise<string | null> => {
  try {
    const apiKeysList = await apiKeyDb.getByProvider(convertProviderToDb(provider));
    const activeKey = apiKeysList.find((key) => key.status === 'ACTIVE');
    return activeKey ? activeKey.key : null;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
};

// 白名单规则数据库操作
export const whitelistRuleDb = {
  getAll: async (): Promise<WhitelistRule[]> => {
    try {
      return await db.select().from(whitelistRules).orderBy(desc(whitelistRules.priority));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<WhitelistRule | null> => {
    try {
      const result = await db
        .select()
        .from(whitelistRules)
        .where(eq(whitelistRules.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  // 根据 API Key ID 获取白名单规则
  getByApiKeyId: async (apiKeyId: string): Promise<WhitelistRule | null> => {
    try {
      const result = await db
        .select()
        .from(whitelistRules)
        .where(eq(whitelistRules.apiKeyId, apiKeyId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  // 通过 apiKeyId 获取白名单规则及其关联的配额策略
  getByApiKeyIdWithPolicy: async (
    apiKeyId: string
  ): Promise<{ rule: WhitelistRule; policy: QuotaPolicy } | null> => {
    try {
      const result = await db
        .select({
          rule: whitelistRules,
          policy: quotaPolicies,
        })
        .from(whitelistRules)
        .innerJoin(quotaPolicies, eq(whitelistRules.policyName, quotaPolicies.name))
        .where(eq(whitelistRules.apiKeyId, apiKeyId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  create: async (
    rule: Omit<NewWhitelistRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WhitelistRule> => {
    const newRule: NewWhitelistRule = {
      id: nanoid(),
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(whitelistRules).values(newRule).returning();
    return result[0];
  },

  update: async (
    id: string,
    updates: Partial<Omit<WhitelistRule, 'id' | 'createdAt'>>
  ): Promise<WhitelistRule | null> => {
    try {
      const result = await db
        .update(whitelistRules)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(whitelistRules.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await db.delete(whitelistRules).where(eq(whitelistRules.id, id));
      return true;
    } catch (error) {
      console.error('Database error:', error);
      return false;
    }
  },

  toggleStatus: async (id: string): Promise<WhitelistRule | null> => {
    try {
      const rule = await whitelistRuleDb.getById(id);
      if (!rule) return null;

      const newStatus = rule.status === 'active' ? 'inactive' : 'active';
      return await whitelistRuleDb.update(id, { status: newStatus });
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  getActiveRules: async (): Promise<WhitelistRule[]> => {
    try {
      return await db
        .select()
        .from(whitelistRules)
        .where(eq(whitelistRules.status, 'active'))
        .orderBy(desc(whitelistRules.priority));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  },

  matchUserPolicy: async (
    userId: string
  ): Promise<{ policyName: string; ruleId: string | null }> => {
    try {
      const activeRules = await whitelistRuleDb.getActiveRules();

      for (const rule of activeRules) {
        // 如果启用了校验规则，用正则匹配
        if (rule.validationEnabled && rule.validationPattern) {
          try {
            const regex = new RegExp(rule.validationPattern);
            if (regex.test(userId)) {
              return { policyName: rule.policyName, ruleId: rule.id };
            }
          } catch {
            console.error(`Invalid validation pattern: ${rule.validationPattern}`);
          }
        } else {
          // 未启用校验规则的规则，视为匹配所有用户
          return { policyName: rule.policyName, ruleId: rule.id };
        }
      }

      return { policyName: '默认策略', ruleId: null };
    } catch (error) {
      console.error('Database error:', error);
      return { policyName: '默认策略', ruleId: null };
    }
  },

  /**
   * 根据 apiKeyId 和 userId 进行白名单规则校验
   * 首先根据 apiKeyId 找到对应的白名单规则，然后使用该规则的配置进行校验
   * 返回匹配到的规则信息和校验结果
   */
  validateUserByApiKey: async (
    apiKeyId: string,
    userId: string,
    clientIp?: string
  ): Promise<{
    matched: boolean;
    policyName: string;
    ruleId: string | null;
    valid: boolean;
    generatedUserId?: string;
    reason?: string;
  }> => {
    try {
      // 1. 根据 apiKeyId 找到对应的白名单规则
      const rule = await whitelistRuleDb.getByApiKeyId(apiKeyId);

      if (!rule) {
        return {
          matched: false,
          policyName: '默认策略',
          ruleId: null,
          valid: false,
          reason: `API Key "${apiKeyId}" 未绑定白名单规则`,
        };
      }

      if (rule.status !== 'active') {
        return {
          matched: false,
          policyName: rule.policyName,
          ruleId: rule.id,
          valid: false,
          reason: '白名单规则未激活',
        };
      }

      // 2. 首先进行 userId 格式校验（如果配置了 userIdPattern）
      if (rule.validationPattern) {
        try {
          const userIdRegex = new RegExp(rule.validationPattern);
          if (!userIdRegex.test(userId)) {
            return {
              matched: true,
              policyName: rule.policyName,
              ruleId: rule.id,
              valid: false,
              reason: `userId "${userId}" 不符合格式要求: ${rule.validationPattern}`,
            };
          }
        } catch (patternError) {
          console.error(`Invalid validationPattern: ${rule.validationPattern}`, patternError);
          // 如果正则表达式无效，跳过校验但记录错误
        }
      }

      // 3. 使用 validationPattern 生成/校验最终的 userId
      let generatedUserId = userId;

      if (rule && rule.userIdPattern) {
        try {
          // 如果 validationPattern 包含占位符（如 @ip、@user_id 等），需要替换
          if (rule.userIdPattern.includes('@')) {
            // 替换占位符：@ip 替换为客户端 IP，@user_id 替换为传入的 userId
            generatedUserId = rule.userIdPattern
              .replace(/@user_id/g, userId)
              .replace(/@ip/g, clientIp || 'unknown_ip')
              .replace(/@any/g, userId);
          }
        } catch (regexError) {
          console.error(`生成失败: ${rule.validationPattern}`, regexError);
          return {
            matched: true,
            policyName: rule.policyName,
            ruleId: rule.id,
            valid: false,
            reason: '生成失败用户Id失败',
          };
        }
      }

      return {
        matched: true,
        policyName: rule.policyName,
        ruleId: rule.id,
        valid: true,
        generatedUserId,
      };
    } catch (error) {
      console.error('Database error:', error);
      return {
        matched: false,
        policyName: '默认策略',
        ruleId: null,
        valid: false,
        reason: '系统错误',
      };
    }
  },

  getStats: async () => {
    try {
      const [totalRulesResult, activeRulesResult, inactiveRulesResult, highPriorityRulesResult] =
        await Promise.all([
          db.select({ count: count() }).from(whitelistRules),
          db
            .select({ count: count() })
            .from(whitelistRules)
            .where(eq(whitelistRules.status, 'active')),
          db
            .select({ count: count() })
            .from(whitelistRules)
            .where(eq(whitelistRules.status, 'inactive')),
          db.select({ count: count() }).from(whitelistRules).where(gte(whitelistRules.priority, 5)),
        ]);

      return {
        totalRules: Number(totalRulesResult[0]?.count || 0),
        activeRules: Number(activeRulesResult[0]?.count || 0),
        inactiveRules: Number(inactiveRulesResult[0]?.count || 0),
        highPriorityRules: Number(highPriorityRulesResult[0]?.count || 0),
      };
    } catch (error) {
      console.error('Database error:', error);
      return {
        totalRules: 0,
        activeRules: 0,
        inactiveRules: 0,
        highPriorityRules: 0,
      };
    }
  },
};
