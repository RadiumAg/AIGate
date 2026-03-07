import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '@/lib/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

let hasSynced = false;

export async function syncAdminUserOnStartup() {
  // 确保只执行一次
  if (hasSynced) {
    return;
  }

  hasSynced = true;

  console.log('🔄 应用启动时同步管理员用户...');

  // 从环境变量获取管理员信息
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aigate.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || '系统管理员';

  console.log(`👤 管理员信息: ${adminEmail}`);

  try {
    // 创建数据库连接
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/aigate';
    const client = postgres(connectionString);
    const db = drizzle(client);

    // 1. 删除所有现有的管理员用户
    console.log('🗑️  删除现有管理员用户...');
    const deleteResult = await db
      .delete(users)
      .where(eq(users.role, 'ADMIN'))
      .returning({ id: users.id });

    console.log(`✅ 删除了 ${deleteResult.length} 个管理员用户`);

    // 2. 创建新的管理员用户
    console.log('🆕 创建新的管理员用户...');
    const newAdmin = {
      id: nanoid(),
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      quotaPolicyId: 'default', // 默认配额策略ID
    };

    const [createdUser] = await db.insert(users).values(newAdmin).returning();

    console.log(`✅ 管理员用户创建成功:`);
    console.log(`   ID: ${createdUser.id}`);
    console.log(`   邮箱: ${createdUser.email}`);
    console.log(`   姓名: ${createdUser.name}`);
    console.log(`   角色: ${createdUser.role}`);

    // 关闭数据库连接
    await client.end();

    console.log('🎉 管理员用户同步完成！');
  } catch (error) {
    console.error('❌ 管理员用户同步失败:', error);
    // 不要终止应用启动，只是记录错误
  }
}

// 如果直接运行此脚本，则执行同步
if (require.main === module) {
  syncAdminUserOnStartup().then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  });
}
