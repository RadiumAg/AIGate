# 演示数据系统

<cite>
**本文档引用的文件**
- [demo-data.ts](file://src/lib/demo-data.ts)
- [demo-config.ts](file://src/lib/demo-config.ts)
- [demo-stats.ts](file://src/lib/demo-stats.ts)
- [schema.ts](file://src/lib/schema.ts)
- [database.ts](file://src/lib/database.ts)
- [quota.ts](file://src/lib/quota.ts)
- [dashboard.ts](file://src/server/api/routers/dashboard.ts)
- [init-admin.ts](file://src/lib/init-admin.ts)
- [package.json](file://package.json)
- [auth.ts](file://src/auth.ts)
- [page.tsx](file://src/app/(dashboard)/debug/page.tsx)
- [index.tsx](file://src/app/(dashboard)/debug/components/quota-debug/index.tsx)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介

演示数据系统是 AIGate 项目中的一个关键组件，专门设计用于在演示模式下提供完整的数据管理功能。该系统通过内存存储机制模拟真实的数据库操作，为开发者和用户提供了一个无需真实数据库即可体验完整功能的环境。

系统的核心目标包括：
- 提供演示模式下的数据持久化能力
- 支持完整的 CRUD 操作
- 实现配额管理和白名单验证
- 提供统计数据计算和可视化支持
- 确保与真实数据库操作的兼容性

## 项目结构

演示数据系统主要分布在以下目录和文件中：

```mermaid
graph TB
subgraph "演示数据系统架构"
A[demo-config.ts] --> B[demo-data.ts]
B --> C[demo-stats.ts]
B --> D[schema.ts]
E[database.ts] --> B
F[quota.ts] --> B
G[dashboard.ts] --> C
H[auth.ts] --> A
I[init-admin.ts] --> E
end
subgraph "前端集成"
J[page.tsx] --> K[quota-debug/index.tsx]
K --> F
end
```

**图表来源**
- [demo-config.ts:1-57](file://src/lib/demo-config.ts#L1-L57)
- [demo-data.ts:1-435](file://src/lib/demo-data.ts#L1-L435)
- [database.ts:1-850](file://src/lib/database.ts#L1-L850)

**章节来源**
- [demo-config.ts:1-57](file://src/lib/demo-config.ts#L1-L57)
- [demo-data.ts:1-435](file://src/lib/demo-data.ts#L1-L435)
- [schema.ts:1-162](file://src/lib/schema.ts#L1-L162)

## 核心组件

### 演示模式配置系统

演示模式配置系统通过环境变量控制整个系统的运行模式，提供了灵活的配置选项：

- **模式切换**：通过 `DEMO_MODE` 和 `NEXT_PUBLIC_DEMO_MODE` 环境变量控制
- **权限管理**：支持只读模式和读写模式的切换
- **数据重置**：可配置自动重置间隔时间
- **默认凭据**：提供演示用的默认管理员账户

### 内存数据存储层

DemoDataStore 类实现了完整的内存数据管理功能：

- **多表支持**：支持 API Key、配额策略、使用记录、白名单规则、用户等五种数据表
- **初始化机制**：自动创建演示数据和默认配置
- **CRUD 操作**：提供完整的数据增删改查功能
- **数据验证**：内置数据验证和格式化逻辑

### 统计数据服务

演示统计系统提供了多种数据分析功能：

- **用户统计**：计算唯一用户数量和活跃用户数
- **请求统计**：统计请求次数和 Token 消耗总量
- **区域分析**：按地区统计请求分布
- **IP 追踪**：监控最近的 IP 请求记录

**章节来源**
- [demo-config.ts:11-56](file://src/lib/demo-config.ts#L11-L56)
- [demo-data.ts:20-431](file://src/lib/demo-data.ts#L20-L431)
- [demo-stats.ts:19-110](file://src/lib/demo-stats.ts#L19-L110)

## 架构概览

演示数据系统采用分层架构设计，确保了良好的模块化和可维护性：

```mermaid
classDiagram
class DemoDataStore {
-Map~string, ApiKey~ apiKeys
-Map~string, QuotaPolicy~ quotaPolicies
-Map~string, UsageRecord~ usageRecords
-Map~string, WhitelistRule~ whitelistRules
-Map~string, User~ users
+initializeData()
+generateMockUsageRecords()
+getAllApiKeys() ApiKey[]
+getAllQuotaPolicies() QuotaPolicy[]
+getAllUsageRecords() UsageRecord[]
+getAllWhitelistRules() WhitelistRule[]
+getAllUsers() User[]
+resetData()
}
class DemoConfig {
+boolean enabled
+object defaultUser
+object demoCredentials
+boolean allowMutations
+number resetInterval
+isDemoMode() boolean
+checkDemoPermission(action) boolean
}
class DemoStats {
+getDistinctUserCount(startDate, endDate) StatsResult
+getRequestCount(startDate, endDate) StatsResult
+getTokenSum(startDate, endDate) SumResult
+getRegionDistribution(startDate, endDate) Array
+getRecentIpRequests(limit) Array
}
DemoDataStore --> DemoConfig : uses
DemoStats --> DemoDataStore : depends on
```

**图表来源**
- [demo-data.ts:20-431](file://src/lib/demo-data.ts#L20-L431)
- [demo-config.ts:12-56](file://src/lib/demo-config.ts#L12-L56)
- [demo-stats.ts:19-110](file://src/lib/demo-stats.ts#L19-L110)

## 详细组件分析

### 数据模型设计

系统基于统一的数据库模式定义，确保演示模式与真实数据库的一致性：

```mermaid
erDiagram
QUOTA_POLICIES {
string id PK
string name
string description
enum limit_type
integer daily_token_limit
integer monthly_token_limit
integer daily_request_limit
integer rpm_limit
timestamp created_at
timestamp updated_at
}
API_KEYS {
string id PK
string name
enum provider
string key
string base_url
enum status
timestamp created_at
timestamp updated_at
}
USAGE_RECORDS {
string id PK
string api_key
string user_id
string model
string provider
integer prompt_tokens
integer completion_tokens
integer total_tokens
decimal cost
string region
string client_ip
timestamp timestamp
}
WHITELIST_RULES {
string id PK
string policy_name
string description
integer priority
enum status
string validation_pattern
string user_id_pattern
integer validation_enabled
string api_key_id
timestamp created_at
timestamp updated_at
}
USERS {
string id PK
string name
string email UK
string password
enum role
enum status
string quota_policy_id
date email_verified
string image
timestamp created_at
timestamp updated_at
}
QUOTA_POLICIES ||--o{ WHITELIST_RULES : contains
API_KEYS ||--o{ WHITELIST_RULES : referenced_by
USERS ||--o{ USAGE_RECORDS : generates
API_KEYS ||--o{ USAGE_RECORDS : used_by
```

**图表来源**
- [schema.ts:29-98](file://src/lib/schema.ts#L29-L98)

### 权限控制系统

演示模式的权限控制机制确保了系统的安全性和可控性：

```mermaid
flowchart TD
A[用户操作请求] --> B{检查演示模式}
B --> |否| C[允许所有操作]
B --> |是| D{检查操作类型}
D --> |读取| E[允许操作]
D --> |写入/删除| F{检查允许修改}
F --> |否| G[拒绝操作]
F --> |是| H[允许操作]
G --> I[返回限制消息]
E --> J[执行操作]
H --> J
C --> J
```

**图表来源**
- [demo-config.ts:39-56](file://src/lib/demo-config.ts#L39-L56)

**章节来源**
- [schema.ts:12-162](file://src/lib/schema.ts#L12-L162)
- [demo-config.ts:38-56](file://src/lib/demo-config.ts#L38-L56)

### 配额管理系统

配额管理系统实现了复杂的限额控制逻辑：

```mermaid
sequenceDiagram
participant Client as 客户端
participant Quota as 配额系统
participant Redis as Redis缓存
participant DB as 数据库
Client->>Quota : checkQuota(userId, apiKey, tokens)
Quota->>Redis : 获取用户配额
Redis-->>Quota : 返回当前使用量
Quota->>Quota : 检查每日限额
Quota->>Quota : 检查RPM限制
Quota->>Redis : 更新使用记录
Redis-->>Quota : 确认更新
Quota-->>Client : 返回配额检查结果
Note over Quota,DB : 演示模式下使用内存存储
```

**图表来源**
- [quota.ts:79-200](file://src/lib/quota.ts#L79-L200)
- [database.ts:178-374](file://src/lib/database.ts#L178-L374)

**章节来源**
- [quota.ts:17-76](file://src/lib/quota.ts#L17-L76)
- [database.ts:178-374](file://src/lib/database.ts#L178-L374)

### 统计数据计算

演示统计系统提供了多种维度的数据分析能力：

```mermaid
flowchart LR
A[原始使用记录] --> B[数据过滤]
B --> C[按日期范围筛选]
C --> D[统计聚合]
D --> E[唯一用户数]
D --> F[请求总数]
D --> G[Tokens总和]
D --> H[地区分布]
D --> I[IP请求列表]
E --> J[统计数据对象]
F --> J
G --> J
H --> J
I --> J
```

**图表来源**
- [demo-stats.ts:21-110](file://src/lib/demo-stats.ts#L21-L110)

**章节来源**
- [demo-stats.ts:19-110](file://src/lib/demo-stats.ts#L19-L110)

## 依赖关系分析

演示数据系统与其他组件的依赖关系如下：

```mermaid
graph TB
subgraph "核心依赖"
A[demo-data.ts] --> B[demo-config.ts]
A --> C[schema.ts]
D[database.ts] --> A
E[quota.ts] --> A
F[demo-stats.ts] --> A
end
subgraph "外部依赖"
G[Redis] --> E
H[PostgreSQL] --> D
I[NextAuth] --> J[auth.ts]
K[Drizzle ORM] --> D
end
subgraph "前端依赖"
L[dashboard.ts] --> F
M[page.tsx] --> N[quota-debug组件]
N --> E
end
```

**图表来源**
- [database.ts:1-20](file://src/lib/database.ts#L1-L20)
- [quota.ts:1-6](file://src/lib/quota.ts#L1-L6)

**章节来源**
- [database.ts:1-20](file://src/lib/database.ts#L1-L20)
- [quota.ts:1-6](file://src/lib/quota.ts#L1-L6)

## 性能考虑

演示数据系统在设计时充分考虑了性能优化：

### 内存优化策略
- **Map 数据结构**：使用 Map 替代数组进行 O(1) 时间复杂度的查找
- **懒加载机制**：仅在需要时初始化演示数据
- **数据压缩**：对重复数据进行去重处理

### 缓存策略
- **Redis 集成**：配额信息和策略数据使用 Redis 缓存
- **智能过期**：设置合理的缓存过期时间
- **批量操作**：支持批量数据处理减少内存占用

### 并发处理
- **线程安全**：内存数据结构支持并发访问
- **锁机制**：关键操作使用适当的锁保护
- **异步处理**：长时间操作使用异步执行避免阻塞

## 故障排除指南

### 常见问题及解决方案

**演示模式无法启用**
- 检查环境变量 `DEMO_MODE` 和 `NEXT_PUBLIC_DEMO_MODE` 设置
- 确认 `package.json` 中的脚本配置正确
- 验证 Vercel 部署配置

**数据重置问题**
- 检查 `DEMO_RESET_INTERVAL` 环境变量设置
- 验证定时任务配置
- 确认内存存储状态

**权限控制异常**
- 检查 `DEMO_ALLOW_MUTATIONS` 配置
- 验证用户角色和权限设置
- 确认演示模式下的权限检查逻辑

**统计数据不准确**
- 检查日期范围参数设置
- 验证数据过滤逻辑
- 确认统计计算方法

**章节来源**
- [demo-config.ts:7-56](file://src/lib/demo-config.ts#L7-L56)
- [demo-data.ts:213-221](file://src/lib/demo-data.ts#L213-L221)

## 结论

演示数据系统通过精心设计的架构和实现，成功地为 AIGate 项目提供了一个功能完整、性能优异的演示环境。系统的主要优势包括：

1. **完全兼容性**：与真实数据库操作保持一致的接口和行为
2. **灵活配置**：支持多种运行模式和权限控制
3. **高性能**：基于内存存储和缓存优化确保快速响应
4. **易于维护**：清晰的代码结构和完善的错误处理机制
5. **扩展性强**：模块化设计便于功能扩展和定制

该系统不仅满足了演示需求，还为开发和测试提供了强大的支持，是 AIGate 项目中不可或缺的重要组成部分。