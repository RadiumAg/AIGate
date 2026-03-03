# AIGate - AI 网关管理系统

基于 Next.js 14 + tRPC + Redis 的智能 AI 网关管理系统，支持配额控制和多模型代理。

## 功能特性

- ✅ **配额管理**：基于 Redis 的实时配额检查和用量记录
- ✅ **多模型支持**：支持 OpenAI、Anthropic、Google、DeepSeek、Moonshot
- ✅ **tRPC 集成**：类型安全的 API 调用
- ✅ **OpenAI 兼容**：提供标准的 OpenAI API 接口
- ✅ **管理后台**：完整的用户、API Key、配额策略管理界面
- ✅ **深色模式**：支持明暗主题切换

## 一键部署

项目提供 `deploy.sh` 脚本，支持一键部署和交互式配置。

### 快速部署

```bash
# 1. 配置环境变量（交互式）
./deploy.sh config

# 2. 一键部署
./deploy.sh up
```

### 部署命令

| 命令                  | 说明                         |
| --------------------- | ---------------------------- |
| `./deploy.sh`         | 首次部署 / 全量启动（默认）  |
| `./deploy.sh config`  | 交互式配置环境变量           |
| `./deploy.sh update`  | 更新应用（重新构建 + 迁移）  |
| `./deploy.sh down`    | 停止并移除所有容器           |
| `./deploy.sh restart` | 重启应用容器                 |
| `./deploy.sh logs`    | 查看应用日志                 |
| `./deploy.sh migrate` | 仅执行数据库迁移             |
| `./deploy.sh status`  | 查看服务状态                 |
| `./deploy.sh clean`   | 停止并清除所有数据（危险！） |

### 配置说明

运行 `./deploy.sh config` 可交互式配置以下环境变量：

- **ADMIN_EMAIL** / **ADMIN_PASSWORD** - 管理员账号密码
- **NEXT_PUBLIC_ADMIN_EMAIL** / **NEXT_PUBLIC_ADMIN_PASSWORD** - 前端显示的管理员信息
- **DATABASE_URL** - PostgreSQL 连接地址
- **REDIS_URL** - Redis 连接地址

配置会自动保存到 `.env` 文件，并在部署时加载。

## 快速开始（开发模式）

如需本地开发，可手动安装依赖：

```bash
# 1. 安装依赖
pnpm install

# 2. 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 设置 DATABASE_URL

# 3. 初始化数据库
pnpm db:push
pnpm db:seed

# 4. 启动项目
pnpm dev
```

## API 使用

### 1. 测试配额系统

```bash
curl -X POST http://localhost:3000/api/test-quota \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "model": "gpt-3.5-turbo",
    "message": "Hello, world!"
  }'
```

### 2. OpenAI 兼容接口

```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 3. tRPC 客户端调用

```typescript
import { trpc } from '../components/TRPCProvider';

// 调用 AI 接口
const result = await trpc.ai.chatCompletion.mutate({
  userId: 'test-user',
  request: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
});
```

## 核心架构

### 配额检查流程

1. **请求到达** → 2. **检查用户配额** → 3. **调用 AI 服务** → 4. **记录用量** → 5. **返回响应**

### 关键文件

- `src/lib/quota.ts` - 配额检查逻辑
- `src/lib/redis.ts` - Redis 配置和键管理
- `src/lib/ai-providers.ts` - AI 服务商统一接口
- `src/server/api/routers/ai.ts` - tRPC AI 路由
- `src/pages/api/v1/chat/completions.ts` - OpenAI 兼容 API

### 数据存储

- **Redis Keys**：
  - `user_quota:{userId}:{date}` - 用户每日配额使用情况
  - `user_rpm:{userId}:{dateTime}` - 用户每分钟请求数
  - `user_policy:{userId}` - 用户配额策略缓存
  - `api_keys:{provider}` - API Key 缓存

## 开发说明

项目使用 TypeScript + Next.js 14 App Router，所有 API 都通过 tRPC 提供类型安全保障。

前端使用 Tailwind CSS 4 和自定义深色模式支持，管理界面已完成用户、API Key、配额策略的 CRUD 操作。

## 许可证

MIT License
