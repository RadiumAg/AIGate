# AIGate 数据库设置完成

## 🎉 数据库创建成功！

### 📊 数据库信息
- **数据库名称**: `aigate`
- **数据库类型**: PostgreSQL
- **连接地址**: `localhost:5432`
- **用户**: `zly`

### 🗄️ 数据表结构
| 表名 | 记录数 | 描述 |
|------|--------|------|
| `quota_policies` | 3 | 配额策略表 |
| `users` | 4 | 用户表 |
| `api_keys` | 5 | API 密钥表 |
| `usage_records` | 341 | 用量记录表 |

### 🔧 可用命令
```bash
# 生成迁移文件
pnpm run db:generate

# 推送模式到数据库
pnpm run db:push

# 运行迁移
pnpm run db:migrate

# 填充种子数据
pnpm run db:seed
```

### 📁 重要文件
- **配置文件**: `drizzle.config.ts`
- **数据库模式**: `src/lib/schema.ts`
- **数据库连接**: `src/lib/prisma.ts`
- **种子数据**: `src/lib/seed.ts`
- **环境变量**: `.env.local`

### 🌱 种子数据详情
- **配额策略**: 基础套餐、专业套餐、企业套餐
- **用户**: 包含管理员和普通用户
- **API 密钥**: 支持 OpenAI、Anthropic、Google、DeepSeek、Moonshot
- **用量记录**: 最近30天的模拟使用数据

### 🚀 下一步
数据库已完全配置完成，可以开始使用 AIGate 应用程序！
