import { db } from './drizzle';
import { users, quotaPolicies, apiKeys, usageRecords } from './schema';
import { nanoid } from 'nanoid';

async function seed() {
  console.log('🌱 开始种子数据...');

  try {
    // 清空现有数据
    console.log('🧹 清理现有数据...');
    await db.delete(usageRecords);
    await db.delete(users);
    await db.delete(apiKeys);
    await db.delete(quotaPolicies);

    // 创建配额策略
    console.log('📋 创建配额策略...');
    const basicPolicy = await db
      .insert(quotaPolicies)
      .values({
        id: nanoid(),
        name: '基础套餐',
        description: '适合个人开发者和小型项目',
        dailyTokenLimit: 10000,
        monthlyTokenLimit: 300000,
        rpmLimit: 60,
      })
      .returning();

    const proPolicy = await db
      .insert(quotaPolicies)
      .values({
        id: nanoid(),
        name: '专业套餐',
        description: '适合中小企业和团队使用',
        dailyTokenLimit: 100000,
        monthlyTokenLimit: 3000000,
        rpmLimit: 300,
      })
      .returning();

    const enterprisePolicy = await db
      .insert(quotaPolicies)
      .values({
        id: nanoid(),
        name: '企业套餐',
        description: '适合大型企业和高频使用场景',
        dailyTokenLimit: 1000000,
        monthlyTokenLimit: 30000000,
        rpmLimit: 1000,
      })
      .returning();

    console.log(`✅ 创建了 3 个配额策略`);

    // 创建用户
    console.log('👥 创建用户...');
    const testUsers = [
      {
        id: nanoid(),
        name: '张三',
        email: 'zhangsan@example.com',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        quotaPolicyId: basicPolicy[0].id,
      },
      {
        id: nanoid(),
        name: '李四',
        email: 'lisi@example.com',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        quotaPolicyId: proPolicy[0].id,
      },
      {
        id: nanoid(),
        name: '王五',
        email: 'wangwu@example.com',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        quotaPolicyId: enterprisePolicy[0].id,
      },
      {
        id: nanoid(),
        name: '管理员',
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        quotaPolicyId: enterprisePolicy[0].id,
      },
    ];

    const createdUsers = await db.insert(users).values(testUsers).returning();
    console.log(`✅ 创建了 ${createdUsers.length} 个用户`);

    // 创建 API 密钥
    console.log('🔑 创建 API 密钥...');
    const testApiKeys = [
      {
        id: nanoid(),
        name: 'OpenAI GPT-4',
        provider: 'OPENAI' as const,
        key: 'sk-test-openai-key-' + nanoid(),
        status: 'ACTIVE' as const,
      },
      {
        id: nanoid(),
        name: 'Anthropic Claude',
        provider: 'ANTHROPIC' as const,
        key: 'sk-test-anthropic-key-' + nanoid(),
        status: 'ACTIVE' as const,
      },
      {
        id: nanoid(),
        name: 'Google Gemini',
        provider: 'GOOGLE' as const,
        key: 'AIza-test-google-key-' + nanoid(),
        status: 'ACTIVE' as const,
      },
      {
        id: nanoid(),
        name: 'DeepSeek Chat',
        provider: 'DEEPSEEK' as const,
        key: 'sk-test-deepseek-key-' + nanoid(),
        status: 'ACTIVE' as const,
      },
      {
        id: nanoid(),
        name: 'Moonshot AI',
        provider: 'MOONSHOT' as const,
        key: 'sk-test-moonshot-key-' + nanoid(),
        status: 'ACTIVE' as const,
      },
    ];

    const createdApiKeys = await db.insert(apiKeys).values(testApiKeys).returning();
    console.log(`✅ 创建了 ${createdApiKeys.length} 个 API 密钥`);

    // 创建用量记录
    console.log('📊 创建用量记录...');
    const usageData = [];

    // 为每个用户创建最近30天的随机用量记录
    for (const user of createdUsers) {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        // 每天随机生成1-5条记录
        const recordsPerDay = Math.floor(Math.random() * 5) + 1;

        for (let j = 0; j < recordsPerDay; j++) {
          const models = [
            'gpt-4',
            'gpt-3.5-turbo',
            'claude-3-sonnet',
            'gemini-pro',
            'deepseek-chat',
            'moonshot-v1-8k',
          ];
          const providers = ['openai', 'anthropic', 'google', 'deepseek', 'moonshot'];

          const model = models[Math.floor(Math.random() * models.length)];
          const provider = providers[Math.floor(Math.random() * providers.length)];
          const promptTokens = Math.floor(Math.random() * 1000) + 100;
          const completionTokens = Math.floor(Math.random() * 500) + 50;
          const totalTokens = promptTokens + completionTokens;
          const cost = (totalTokens * 0.00002).toFixed(6); // 模拟成本计算

          usageData.push({
            id: nanoid(),
            userId: user.id,
            model,
            provider,
            promptTokens,
            completionTokens,
            totalTokens,
            cost,
            timestamp: new Date(date),
          });
        }
      }
    }

    // 批量插入用量记录
    const batchSize = 100;
    for (let i = 0; i < usageData.length; i += batchSize) {
      const batch = usageData.slice(i, i + batchSize);
      await db.insert(usageRecords).values(batch);
    }

    console.log(`✅ 创建了 ${usageData.length} 条用量记录`);

    console.log('🎉 种子数据创建完成！');
    console.log('\n📊 数据统计:');
    console.log(`- 配额策略: 3 个`);
    console.log(`- 用户: ${createdUsers.length} 个`);
    console.log(`- API 密钥: ${createdApiKeys.length} 个`);
    console.log(`- 用量记录: ${usageData.length} 条`);
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行种子数据
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ 种子数据脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 种子数据脚本执行失败:', error);
      process.exit(1);
    });
}

export default seed;
