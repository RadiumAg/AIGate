/**
 * 演示模式 Mock 数据层
 * 提供内存中的模拟数据，用于演示模式下的数据操作
 */

import type {
  ApiKey,
  QuotaPolicy,
  UsageRecord,
  WhitelistRule,
  User,
  NewApiKey,
  NewQuotaPolicy,
  NewUsageRecord,
  NewWhitelistRule,
  NewUser,
} from './schema';

// 内存存储
class DemoDataStore {
  private apiKeys: Map<string, ApiKey> = new Map();
  private quotaPolicies: Map<string, QuotaPolicy> = new Map();
  private usageRecords: Map<string, UsageRecord> = new Map();
  private whitelistRules: Map<string, WhitelistRule> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    this.initializeData();
  }

  // 初始化演示数据
  private initializeData() {
    const now = new Date();

    // 初始化配额策略
    const defaultPolicy: QuotaPolicy = {
      id: 'policy-001',
      name: '默认策略',
      description: '默认配额策略，适用于普通用户',
      limitType: 'token',
      dailyTokenLimit: 100000,
      monthlyTokenLimit: 2000000,
      dailyRequestLimit: 1000,
      rpmLimit: 60,
      createdAt: now,
      updatedAt: now,
    };

    const premiumPolicy: QuotaPolicy = {
      id: 'policy-002',
      name: '高级策略',
      description: '高级配额策略，适用于VIP用户',
      limitType: 'token',
      dailyTokenLimit: 500000,
      monthlyTokenLimit: 10000000,
      dailyRequestLimit: 5000,
      rpmLimit: 120,
      createdAt: now,
      updatedAt: now,
    };

    this.quotaPolicies.set(defaultPolicy.id, defaultPolicy);
    this.quotaPolicies.set(premiumPolicy.id, premiumPolicy);

    // 初始化 API Keys
    const openaiKey: ApiKey = {
      id: 'key-openai-001',
      name: 'OpenAI Production',
      provider: 'OPENAI',
      key: 'sk-demo-openai-key-1234567890abcdef',
      baseUrl: null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const anthropicKey: ApiKey = {
      id: 'key-anthropic-001',
      name: 'Anthropic Claude',
      provider: 'ANTHROPIC',
      key: 'sk-demo-anthropic-key-0987654321fedcba',
      baseUrl: null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const deepseekKey: ApiKey = {
      id: 'key-deepseek-001',
      name: 'DeepSeek API',
      provider: 'DEEPSEEK',
      key: 'sk-demo-deepseek-key-abcdef1234567890',
      baseUrl: 'https://api.deepseek.com',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.apiKeys.set(openaiKey.id, openaiKey);
    this.apiKeys.set(anthropicKey.id, anthropicKey);
    this.apiKeys.set(deepseekKey.id, deepseekKey);

    // 初始化白名单规则
    const whitelistRule1: WhitelistRule = {
      id: 'rule-001',
      policyName: '默认策略',
      description: '内部员工白名单',
      priority: 10,
      status: 'active',
      validationPattern: '^[a-zA-Z0-9._%+-]+@company\\.com$',
      userIdPattern: '@user_id',
      validationEnabled: 1,
      apiKeyId: 'key-openai-001',
      createdAt: now,
      updatedAt: now,
    };

    const whitelistRule2: WhitelistRule = {
      id: 'rule-002',
      policyName: '高级策略',
      description: 'VIP用户白名单',
      priority: 5,
      status: 'active',
      validationPattern: '^[a-zA-Z0-9._%+-]+@vip\\.com$',
      userIdPattern: '@user_id',
      validationEnabled: 1,
      apiKeyId: 'key-anthropic-001',
      createdAt: now,
      updatedAt: now,
    };

    this.whitelistRules.set(whitelistRule1.id, whitelistRule1);
    this.whitelistRules.set(whitelistRule2.id, whitelistRule2);

    // 初始化用户
    const demoUser: User = {
      id: 'demo-user-001',
      name: '演示管理员',
      email: 'demo@example.com',
      password: 'demo123',
      role: 'ADMIN',
      status: 'ACTIVE',
      quotaPolicyId: 'policy-002',
      emailVerified: now,
      image: null,
      createdAt: now,
      updatedAt: now,
    };

    const testUser: User = {
      id: 'user-002',
      name: '测试用户',
      email: 'test@example.com',
      password: 'test123',
      role: 'USER',
      status: 'ACTIVE',
      quotaPolicyId: 'policy-001',
      emailVerified: now,
      image: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(demoUser.id, demoUser);
    this.users.set(testUser.id, testUser);

    // 生成模拟使用记录
    this.generateMockUsageRecords();
  }

  // 生成模拟使用记录
  private generateMockUsageRecords() {
    const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'deepseek-chat'];
    const providers = ['OPENAI', 'ANTHROPIC', 'DEEPSEEK'];
    const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];

    // 生成最近7天的使用记录
    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000
      );

      const model = models[Math.floor(Math.random() * models.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const promptTokens = Math.floor(Math.random() * 2000) + 100;
      const completionTokens = Math.floor(Math.random() * 1000) + 50;

      const record: UsageRecord = {
        id: `usage-${Date.now()}-${i}`,
        apiKey: `key-${provider.toLowerCase()}-001`,
        userId:
          Math.random() > 0.5
            ? 'demo@example.com'
            : `user${Math.floor(Math.random() * 10)}@example.com`,
        model,
        provider,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost: ((promptTokens + completionTokens) * 0.00002).toFixed(6),
        region,
        clientIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        timestamp,
      };

      this.usageRecords.set(record.id, record);
    }
  }

  // 重置所有数据
  resetData() {
    this.apiKeys.clear();
    this.quotaPolicies.clear();
    this.usageRecords.clear();
    this.whitelistRules.clear();
    this.users.clear();
    this.initializeData();
  }

  // API Key 操作
  getAllApiKeys(): ApiKey[] {
    return Array.from(this.apiKeys.values());
  }

  getApiKeyById(id: string): ApiKey | null {
    return this.apiKeys.get(id) || null;
  }

  getApiKeysByProvider(provider: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter((key) => key.provider === provider);
  }

  createApiKey(apiKey: NewApiKey): ApiKey {
    const newKey: ApiKey = {
      ...apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ApiKey;
    this.apiKeys.set(newKey.id, newKey);
    return newKey;
  }

  updateApiKey(id: string, updates: Partial<ApiKey>): ApiKey | null {
    const existing = this.apiKeys.get(id);
    if (!existing) return null;

    const updated: ApiKey = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.apiKeys.set(id, updated);
    return updated;
  }

  deleteApiKey(id: string): boolean {
    return this.apiKeys.delete(id);
  }

  // 配额策略操作
  getAllQuotaPolicies(): QuotaPolicy[] {
    return Array.from(this.quotaPolicies.values());
  }

  getQuotaPolicyById(id: string): QuotaPolicy | null {
    return this.quotaPolicies.get(id) || null;
  }

  createQuotaPolicy(policy: NewQuotaPolicy): QuotaPolicy {
    const newPolicy: QuotaPolicy = {
      ...policy,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as QuotaPolicy;
    this.quotaPolicies.set(newPolicy.id, newPolicy);
    return newPolicy;
  }

  updateQuotaPolicy(id: string, updates: Partial<QuotaPolicy>): QuotaPolicy | null {
    const existing = this.quotaPolicies.get(id);
    if (!existing) return null;

    const updated: QuotaPolicy = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.quotaPolicies.set(id, updated);
    return updated;
  }

  deleteQuotaPolicy(id: string): boolean {
    return this.quotaPolicies.delete(id);
  }

  // 使用记录操作
  getAllUsageRecords(): UsageRecord[] {
    return Array.from(this.usageRecords.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  getUsageRecordsByUserId(userId: string): UsageRecord[] {
    return Array.from(this.usageRecords.values())
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getUsageRecordsByDateRange(startDate: Date, endDate: Date): UsageRecord[] {
    return Array.from(this.usageRecords.values())
      .filter((record) => record.timestamp >= startDate && record.timestamp <= endDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  createUsageRecord(record: NewUsageRecord): UsageRecord {
    const newRecord: UsageRecord = {
      ...record,
      timestamp: new Date(),
    } as UsageRecord;
    this.usageRecords.set(newRecord.id, newRecord);
    return newRecord;
  }

  // 白名单规则操作
  getAllWhitelistRules(): WhitelistRule[] {
    return Array.from(this.whitelistRules.values()).sort((a, b) => b.priority - a.priority);
  }

  getWhitelistRuleById(id: string): WhitelistRule | null {
    return this.whitelistRules.get(id) || null;
  }

  getWhitelistRuleByApiKeyId(apiKeyId: string): WhitelistRule | null {
    return (
      Array.from(this.whitelistRules.values()).find((rule) => rule.apiKeyId === apiKeyId) || null
    );
  }

  createWhitelistRule(rule: NewWhitelistRule): WhitelistRule {
    const newRule: WhitelistRule = {
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WhitelistRule;
    this.whitelistRules.set(newRule.id, newRule);
    return newRule;
  }

  updateWhitelistRule(id: string, updates: Partial<WhitelistRule>): WhitelistRule | null {
    const existing = this.whitelistRules.get(id);
    if (!existing) return null;

    const updated: WhitelistRule = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.whitelistRules.set(id, updated);
    return updated;
  }

  deleteWhitelistRule(id: string): boolean {
    return this.whitelistRules.delete(id);
  }

  // 用户操作
  getAllUsers(): User[] {
    return Array.from(this.users.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string): User | null {
    return Array.from(this.users.values()).find((user) => user.email === email) || null;
  }

  getAdmins(): User[] {
    return Array.from(this.users.values())
      .filter((user) => user.role === 'ADMIN')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  createUser(user: NewUser): User {
    const newUser: User = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const existing = this.users.get(id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  updateUserPassword(id: string, password: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    user.password = password;
    user.updatedAt = new Date();
    return true;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  deleteAllUsers(): { deletedCount: number } {
    const count = this.users.size;
    this.users.clear();
    return { deletedCount: count };
  }
}

// 导出单例实例
export const demoDataStore = new DemoDataStore();
