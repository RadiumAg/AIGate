# API Key 管理

<cite>
**本文档引用的文件**
- [src/server/api/routers/api-key.ts](file://src/server/api/routers/api-key.ts)
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx)
- [src/app/(dashboard)/keys/components/add-api-key-dialog.tsx](file://src/app/(dashboard)/keys/components/add-api-key-dialog.tsx)
- [src/app/(dashboard)/keys/components/api-key-table.tsx](file://src/app/(dashboard)/keys/components/api-key-table.tsx)
- [src/app/(dashboard)/keys/components/delete-confirm-modal.tsx](file://src/app/(dashboard)/keys/components/delete-confirm-modal.tsx)
- [src/components/ui/sonner.tsx](file://src/components/ui/sonner.tsx)
- [src/app/layout.tsx](file://src/app/layout.tsx)
- [src/lib/database.ts](file://src/lib/database.ts)
- [src/lib/redis.ts](file://src/lib/redis.ts)
- [src/lib/types.ts](file://src/lib/types.ts)
- [src/lib/quota.ts](file://src/lib/quota.ts)
- [src/server/api/routers/quota.ts](file://src/server/api/routers/quota.ts)
- [src/lib/logger.ts](file://src/lib/logger.ts)
- [src/pages/api/ai/chat/stream.ts](file://src/pages/api/ai/chat/stream.ts)
- [src/server/api/routers/ai.ts](file://src/server/api/routers/ai.ts)
- [src/types/api-key.ts](file://src/types/api-key.ts)
</cite>

## 更新摘要
**变更内容**
- 更新状态管理架构：从传统错误/成功消息迁移到基于 Sonner 的 Toast 通知系统
- 优化用户反馈机制：使用 toast.success() 和 toast.error() 提供更直观的用户体验
- 改进删除操作：确保 API Key 表格组件使用正确的 originId 字段进行删除
- 增强前端交互体验：通过 Toast 通知提供即时的操作反馈

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件面向管理员与开发者，系统性阐述 API Key 管理系统的实现与使用。内容涵盖密钥的生成、验证、状态管理与生命周期控制；密钥绑定策略（白名单规则）、提供商关联、权限控制与使用统计；密钥轮换机制、安全策略配置、批量管理操作与审计日志记录。同时提供具体 API 调用示例与管理界面使用指南，帮助管理员高效、安全地管理 API Key。

**更新** 系统现已采用现代化的 Toast 通知系统替代传统状态消息，提供更流畅的用户体验。

## 项目结构
API Key 管理涉及三层：前端页面与对话框、后端 tRPC 路由层、数据库与缓存层。前端负责展示与交互，tRPC 路由负责业务编排与参数校验，数据库与缓存负责持久化与高性能读取。

```mermaid
graph TB
subgraph "前端"
KeysPage["KeysPage<br/>密钥列表页"]
AddDialog["AddApiKeyDialog<br/>新增/编辑对话框"]
ApiKeyTable["ApiKeyTable<br/>表格组件"]
DeleteModal["DeleteConfirmModal<br/>删除确认模态框"]
ToastSystem["Toast 通知系统<br/>基于 Sonner"]
end
subgraph "后端"
TPRouter["apiKeyRouter<br/>API Key 路由"]
QuotaRouter["quotaRouter<br/>配额路由"]
end
subgraph "数据与缓存"
DB["数据库<br/>apiKeys 表"]
Redis["Redis 缓存<br/>API Key 与配额策略"]
end
KeysPage --> ApiKeyTable
KeysPage --> AddDialog
KeysPage --> DeleteModal
KeysPage --> ToastSystem
ApiKeyTable --> TPRouter
AddDialog --> TPRouter
DeleteModal --> TPRouter
TPRouter --> DB
TPRouter --> Redis
QuotaRouter --> Redis
QuotaRouter --> DB
```

**图表来源**
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx#L1-L176)
- [src/app/(dashboard)/keys/components/api-key-table.tsx](file://src/app/(dashboard)/keys/components/api-key-table.tsx#L1-L194)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

**章节来源**
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx#L1-L176)
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)

## 核心组件
- **API Key 路由层**：提供获取、创建、更新、删除、切换状态与使用统计等接口，统一进行输入校验与状态转换。
- **数据库层**：提供 API Key 的增删改查与按提供商筛选，以及用量记录与白名单规则的读写。
- **缓存层**：Redis 缓存 API Key 与配额策略，提升读取性能并支持快速轮换。
- **前端页面**：提供密钥列表、新增/编辑、删除确认与状态切换的可视化操作，集成 Toast 通知系统。
- **配额与审计**：基于 Redis 的配额检查与记录，结合日志系统实现审计追踪。
- **Toast 通知系统**：基于 Sonner 库的现代化通知组件，提供成功、错误、警告等多类型反馈。

**更新** 新增 Toast 通知系统作为统一的用户反馈机制，替代传统的错误/成功消息显示。

**章节来源**
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)
- [src/lib/database.ts:19-81](file://src/lib/database.ts#L19-L81)
- [src/lib/redis.ts:18-43](file://src/lib/redis.ts#L18-L43)
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx#L1-L176)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

## 架构总览
系统采用 tRPC 作为前后端通信桥梁，前端通过 tRPC 客户端调用后端路由，后端路由访问数据库与缓存完成业务处理。白名单规则与配额策略贯穿请求链路，确保密钥绑定与权限控制。Toast 通知系统作为统一的用户反馈层，提供即时的操作结果反馈。

```mermaid
sequenceDiagram
participant Admin as "管理员"
participant UI as "前端页面"
participant Toast as "Toast 通知系统"
participant API as "apiKeyRouter"
participant DB as "数据库"
participant Cache as "Redis"
Admin->>UI : 打开密钥管理页
UI->>API : 查询所有 API Key
API->>DB : 读取 apiKeys
DB-->>API : 返回密钥列表
API->>Cache : 读取配额策略缓存(可选)
API-->>UI : 返回前端所需格式
Admin->>UI : 新增/编辑/删除/切换状态
UI->>API : 发起变更请求
API->>DB : 写入/更新/删除
API->>Cache : 更新/清理缓存
API-->>UI : 返回结果
UI->>Toast : 显示成功/错误通知
Note over Toast : 基于 Sonner 的 Toast 通知
```

**图表来源**
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)
- [src/lib/database.ts:19-81](file://src/lib/database.ts#L19-L81)
- [src/lib/redis.ts:18-43](file://src/lib/redis.ts#L18-L43)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

## 详细组件分析

### API Key 路由与业务流程
- **输入校验与状态转换**：使用 Zod Schema 对输入进行严格校验，提供前后端状态映射函数，保证存储与展示一致。
- **生命周期管理**：
  - **创建**：生成唯一 ID，写入数据库，更新 Redis 缓存。
  - **更新**：写入数据库，更新 Redis 缓存。
  - **删除**：先读取密钥信息，删除数据库记录，清理 Redis 缓存。
  - **切换状态**：读取当前状态并翻转，禁用时清理 Redis 缓存。
- **使用统计**：按最近七天用量记录聚合请求总数、Token 数与每日趋势。

```mermaid
flowchart TD
Start(["进入 API Key 路由"]) --> Op{"操作类型"}
Op --> |创建| Create["生成ID<br/>写入数据库<br/>更新Redis缓存"]
Op --> |更新| Update["更新数据库<br/>更新Redis缓存"]
Op --> |删除| Delete["读取密钥信息<br/>删除数据库记录<br/>清理Redis缓存"]
Op --> |切换状态| Toggle["读取当前状态<br/>翻转状态<br/>必要时清理Redis缓存"]
Op --> |使用统计| Stats["查询最近7天用量记录<br/>聚合请求/Token/每日趋势"]
Create --> End(["返回结果"])
Update --> End
Delete --> End
Toggle --> End
Stats --> End
```

**图表来源**
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)

**章节来源**
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)

### 前端页面与交互
- **KeysPage**：集中管理 tRPC 查询与变更，处理加载状态，集成 Toast 通知系统，触发刷新。
- **AddApiKeyDialog**：表单校验（名称、API Key 必填），动态占位符与提供商提示，支持新增与编辑。
- **ApiKeyTable**：展示密钥列表，支持复制、启用/禁用、编辑、删除与测试按钮，使用 Toast 进行即时反馈。
- **DeleteConfirmModal**：二次确认删除，防止误操作。
- **Toast 通知系统**：基于 Sonner 的现代化通知组件，提供成功、错误、警告等多类型反馈。

**更新** KeysPage 组件已完全迁移到基于 Sonner 的 Toast 通知系统，移除了传统的错误/成功消息状态管理。

```mermaid
sequenceDiagram
participant Admin as "管理员"
participant Page as "KeysPage"
participant Table as "ApiKeyTable"
participant Dialog as "AddApiKeyDialog"
participant Modal as "DeleteConfirmModal"
participant Toast as "Toast 系统"
participant API as "apiKeyRouter"
Admin->>Page : 打开页面
Page->>API : 查询所有 API Key
API-->>Page : 返回密钥列表
Page->>Table : 渲染表格
Admin->>Dialog : 新增/编辑
Dialog->>API : 提交保存
API-->>Page : 返回成功/失败
Page->>Toast : 显示保存结果通知
Page->>Table : 刷新数据
Admin->>Modal : 删除
Modal->>API : 确认删除
API-->>Page : 返回结果
Page->>Toast : 显示删除成功通知
Page->>Table : 刷新数据
```

**图表来源**
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx#L1-L176)
- [src/app/(dashboard)/keys/components/add-api-key-dialog.tsx](file://src/app/(dashboard)/keys/components/add-api-key-dialog.tsx#L1-L273)
- [src/app/(dashboard)/keys/components/api-key-table.tsx](file://src/app/(dashboard)/keys/components/api-key-table.tsx#L1-L194)
- [src/app/(dashboard)/keys/components/delete-confirm-modal.tsx](file://src/app/(dashboard)/keys/components/delete-confirm-modal.tsx#L1-L54)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

**章节来源**
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx#L1-L176)
- [src/app/(dashboard)/keys/components/add-api-key-dialog.tsx](file://src/app/(dashboard)/keys/components/add-api-key-dialog.tsx#L1-L273)
- [src/app/(dashboard)/keys/components/api-key-table.tsx](file://src/app/(dashboard)/keys/components/api-key-table.tsx#L1-L194)
- [src/app/(dashboard)/keys/components/delete-confirm-modal.tsx](file://src/app/(dashboard)/keys/components/delete-confirm-modal.tsx#L1-L54)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

### 密钥绑定策略与提供商关联
- **白名单规则**：每个 API Key 可绑定一条白名单规则，规则包含匹配模式、优先级与策略名称，支持按 userId 格式校验与占位符生成最终 userId。
- **提供商映射**：前端字符串映射到数据库枚举，确保一致性。
- **校验流程**：请求到达时先按 API Key 查找白名单规则，再进行格式校验与 userId 生成，最终使用生成的 userId 与 API Key 组合进行配额检查。

```mermaid
flowchart TD
Req["收到请求"] --> FindRule["按 API Key 查找白名单规则"]
FindRule --> RuleFound{"找到规则且激活?"}
RuleFound --> |否| Reject["拒绝请求"]
RuleFound --> |是| Validate["校验 userId 格式(可选)"]
Validate --> GenUserId["生成最终 userId(可选)"]
GenUserId --> CheckQuota["按生成的 userId+API Key 检查配额"]
CheckQuota --> Allowed{"允许?"}
Allowed --> |否| Reject
Allowed --> |是| Proceed["继续处理请求"]
```

**图表来源**
- [src/lib/database.ts:456-545](file://src/lib/database.ts#L456-L545)
- [src/server/api/routers/api-key.ts:29-66](file://src/server/api/routers/api-key.ts#L29-L66)
- [src/pages/api/ai/chat/stream.ts:42-86](file://src/pages/api/ai/chat/stream.ts#L42-L86)
- [src/server/api/routers/ai.ts:131-174](file://src/server/api/routers/ai.ts#L131-L174)

**章节来源**
- [src/lib/database.ts:456-545](file://src/lib/database.ts#L456-L545)
- [src/server/api/routers/api-key.ts:29-66](file://src/server/api/routers/api-key.ts#L29-L66)
- [src/pages/api/ai/chat/stream.ts:42-86](file://src/pages/api/ai/chat/stream.ts#L42-L86)
- [src/server/api/routers/ai.ts:131-174](file://src/server/api/routers/ai.ts#L131-L174)

### 权限控制与配额策略
- **配额策略**：支持按 Token 或请求次数两种模式，包含每日/每月限额与每分钟请求限制（RPM）。
- **策略绑定**：通过白名单规则与配额策略关联，按 API Key 直接获取策略并缓存。
- **配额检查**：按用户 ID 与 API Key 组合维度累加，支持 Token 模式与请求次数模式，均受 RPM 限制。
- **用量记录**：记录到 Redis 与数据库，支持重置与统计。

```mermaid
flowchart TD
Start(["发起请求"]) --> GetPolicy["按 API Key 获取配额策略(缓存)"]
GetPolicy --> Mode{"limitType"}
Mode --> |Token| CheckToken["检查当日 Token 使用量"]
Mode --> |Request| CheckReq["检查当日请求次数"]
CheckToken --> RPM["检查每分钟请求次数(RPM)"]
CheckReq --> RPM
RPM --> Allow{"是否超限?"}
Allow --> |是| Deny["返回 429/配额不足"]
Allow --> |否| Record["记录用量到 Redis/数据库"]
Record --> Done(["继续处理/返回响应"])
```

**图表来源**
- [src/lib/quota.ts:18-76](file://src/lib/quota.ts#L18-L76)
- [src/lib/quota.ts:79-200](file://src/lib/quota.ts#L79-L200)
- [src/lib/quota.ts:203-260](file://src/lib/quota.ts#L203-L260)
- [src/server/api/routers/quota.ts:39-221](file://src/server/api/routers/quota.ts#L39-L221)

**章节来源**
- [src/lib/quota.ts:18-76](file://src/lib/quota.ts#L18-L76)
- [src/lib/quota.ts:79-200](file://src/lib/quota.ts#L79-L200)
- [src/lib/quota.ts:203-260](file://src/lib/quota.ts#L203-L260)
- [src/server/api/routers/quota.ts:39-221](file://src/server/api/routers/quota.ts#L39-L221)

### 使用统计与审计日志
- **使用统计**：API Key 路由提供最近七天的请求与 Token 聚合，支持按日期分组的趋势图数据。
- **审计日志**：统一的日志模块记录配额检查、AI 请求与认证事件，生产环境按日期轮转文件，便于审计与问题排查。

```mermaid
sequenceDiagram
participant API as "API 路由"
participant Log as "日志模块"
API->>Log : 记录配额检查/超额/重置
API->>Log : 记录 AI 请求(用户ID/模型/提供商/Tokens)
Note over API,Log : 生产环境输出到按日期轮转的日志文件
```

**图表来源**
- [src/server/api/routers/api-key.ts:324-377](file://src/server/api/routers/api-key.ts#L324-L377)
- [src/lib/logger.ts:125-183](file://src/lib/logger.ts#L125-L183)

**章节来源**
- [src/server/api/routers/api-key.ts:324-377](file://src/server/api/routers/api-key.ts#L324-L377)
- [src/lib/logger.ts:125-183](file://src/lib/logger.ts#L125-L183)

### Toast 通知系统集成
- **统一通知入口**：所有用户操作反馈通过 Toast 系统呈现，提供一致的用户体验。
- **多类型通知**：支持成功、错误、警告、信息等不同类型的视觉反馈。
- **主题适配**：自动适配明暗主题，确保在不同界面下都有良好的可读性。
- **图标系统**：集成 Lucide 图标库，为不同类型的通知提供相应的视觉标识。

**更新** 新增基于 Sonner 的 Toast 通知系统，作为统一的用户反馈机制。

**章节来源**
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)
- [src/app/layout.tsx:1-58](file://src/app/layout.tsx#L1-L58)

## 依赖关系分析
- **路由依赖**：API Key 路由依赖数据库与 Redis；配额路由依赖 Redis 与数据库；AI 请求路由依赖白名单规则与配额模块。
- **数据一致性**：状态切换与删除会同步清理 Redis 缓存，避免脏读。
- **前后端耦合**：前端通过 tRPC 调用后端，参数与返回值由 Zod Schema 与类型定义约束，降低耦合风险。
- **通知系统集成**：Toast 通知系统通过全局布局集成，为所有页面提供统一的反馈机制。

```mermaid
graph LR
UI["前端组件"] --> TPR["apiKeyRouter"]
UI --> QR["quotaRouter"]
TPR --> DB["数据库"]
TPR --> RC["Redis"]
QR --> RC
QR --> DB
AI["AI 请求路由"] --> WL["白名单规则"]
AI --> QU["配额模块"]
WL --> DB
QU --> RC
QU --> DB
Toast["Toast 通知系统"] --> UI
Toast --> TPR
Toast --> QR
```

**图表来源**
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)
- [src/server/api/routers/quota.ts:39-221](file://src/server/api/routers/quota.ts#L39-L221)
- [src/lib/database.ts:19-81](file://src/lib/database.ts#L19-L81)
- [src/lib/redis.ts:18-43](file://src/lib/redis.ts#L18-L43)
- [src/server/api/routers/ai.ts:131-174](file://src/server/api/routers/ai.ts#L131-L174)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

**章节来源**
- [src/server/api/routers/api-key.ts:68-377](file://src/server/api/routers/api-key.ts#L68-L377)
- [src/server/api/routers/quota.ts:39-221](file://src/server/api/routers/quota.ts#L39-L221)
- [src/lib/database.ts:19-81](file://src/lib/database.ts#L19-L81)
- [src/lib/redis.ts:18-43](file://src/lib/redis.ts#L18-L43)
- [src/server/api/routers/ai.ts:131-174](file://src/server/api/routers/ai.ts#L131-L174)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

## 性能考虑
- **缓存优先**：API Key 与配额策略通过 Redis 缓存，减少数据库压力；删除/切换状态时主动清理缓存，保证一致性。
- **异步容错**：Redis 更新失败仅记录警告，不影响主流程。
- **时间窗口**：用量与 RPM 以分钟/天为单位，避免热点时段竞争。
- **批量操作**：建议通过配额路由统一重置策略或用户配额，减少重复扫描与删除。
- **Toast 性能**：Toast 通知系统采用轻量级实现，不会对页面性能造成显著影响。

**更新** Toast 通知系统采用轻量级实现，确保不影响页面性能。

## 故障排除指南
- **API Key 无法使用**
  - 检查状态是否为"活跃"，若为"禁用"需先切换状态。
  - 确认白名单规则已绑定且处于"激活"状态。
  - 核对 userId 格式是否满足规则中的正则表达式。
- **配额不足**
  - 查看配额策略的 limitType 与限额设置，确认是否达到每日或 RPM 限制。
  - 使用配额路由重置用户在某 API Key 下的配额。
- **删除失败**
  - 确认 API Key 是否存在；若不存在会返回"未找到"错误。
- **Toast 通知问题**
  - 检查全局布局中是否正确引入了 Toaster 组件。
  - 确认网络连接正常，Toast 通知系统能够正常工作。
- **日志定位**
  - 查看日志模块输出的配额检查与 AI 请求记录，定位异常原因。

**更新** 新增 Toast 通知系统故障排除指南。

**章节来源**
- [src/server/api/routers/api-key.ts:272-322](file://src/server/api/routers/api-key.ts#L272-L322)
- [src/lib/database.ts:456-545](file://src/lib/database.ts#L456-L545)
- [src/lib/quota.ts:79-200](file://src/lib/quota.ts#L79-L200)
- [src/server/api/routers/quota.ts:66-87](file://src/server/api/routers/quota.ts#L66-L87)
- [src/lib/logger.ts:125-183](file://src/lib/logger.ts#L125-L183)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)

## 结论
本系统通过 tRPC、数据库与 Redis 的协同，实现了 API Key 的全生命周期管理与严格的权限控制。白名单规则与配额策略解耦设计，既保证灵活性又兼顾性能。配合完善的审计日志与现代化的 Toast 通知系统，管理员可以高效、安全地管理密钥并保障系统稳定运行。

**更新** 新的 Toast 通知系统提供了更直观、一致的用户反馈体验，进一步提升了系统的易用性和专业性。

## 附录

### API 调用示例（路径参考）
- 获取所有 API Key
  - 路径：[src/server/api/routers/api-key.ts:69-95](file://src/server/api/routers/api-key.ts#L69-L95)
- 根据 ID 获取 API Key
  - 路径：[src/server/api/routers/api-key.ts:97-129](file://src/server/api/routers/api-key.ts#L97-L129)
- 创建 API Key
  - 路径：[src/server/api/routers/api-key.ts:131-175](file://src/server/api/routers/api-key.ts#L131-L175)
- 更新 API Key
  - 路径：[src/server/api/routers/api-key.ts:177-225](file://src/server/api/routers/api-key.ts#L177-L225)
- 删除 API Key
  - 路径：[src/server/api/routers/api-key.ts:227-270](file://src/server/api/routers/api-key.ts#L227-L270)
- 切换 API Key 状态
  - 路径：[src/server/api/routers/api-key.ts:272-322](file://src/server/api/routers/api-key.ts#L272-L322)
- 获取 API Key 使用统计
  - 路径：[src/server/api/routers/api-key.ts:324-377](file://src/server/api/routers/api-key.ts#L324-L377)
- 获取用户今日使用情况
  - 路径：[src/server/api/routers/quota.ts:40-64](file://src/server/api/routers/quota.ts#L40-L64)
- 重置用户配额
  - 路径：[src/server/api/routers/quota.ts:66-87](file://src/server/api/routers/quota.ts#L66-L87)

### 管理界面使用指南
- 打开"API 密钥管理"页面，查看现有密钥列表。
- 点击"添加密钥"，填写名称、提供商、API Key、可选 Base URL 与状态，提交保存。
- 在列表中可复制密钥、切换状态、编辑或删除。
- 如需测试密钥有效性，可在表格中点击"测试"按钮（若后端提供相应能力）。
- 所有操作都会通过 Toast 通知系统提供即时反馈，包括成功、错误或警告信息。

**更新** 新增 Toast 通知系统使用指南，说明所有操作的即时反馈机制。

### Toast 通知系统配置
- **全局集成**：在应用根布局中引入 Toaster 组件，确保所有页面都能使用通知功能。
- **主题适配**：自动检测系统主题，提供明暗两种外观模式。
- **图标定制**：支持自定义成功、错误、警告等不同类型的图标。
- **样式定制**：可通过 classNames 属性自定义通知的外观样式。

**更新** 新增 Toast 通知系统配置说明。

**章节来源**
- [src/app/(dashboard)/keys/page.tsx](file://src/app/(dashboard)/keys/page.tsx#L1-L176)
- [src/app/(dashboard)/keys/components/add-api-key-dialog.tsx](file://src/app/(dashboard)/keys/components/add-api-key-dialog.tsx#L1-L273)
- [src/app/(dashboard)/keys/components/api-key-table.tsx](file://src/app/(dashboard)/keys/components/api-key-table.tsx#L1-L194)
- [src/components/ui/sonner.tsx:1-46](file://src/components/ui/sonner.tsx#L1-L46)
- [src/app/layout.tsx:1-58](file://src/app/layout.tsx#L1-L58)