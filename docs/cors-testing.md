# CORS 跨域调用测试指南

## 问题描述

外部应用调用 tRPC API 时遇到以下错误：

```
❌ tRPC failed on <no-path>: Unexpected request method OPTIONS
OPTIONS /api/trpc/ai.getQuotaInfo 405 in 7ms
```

这是因为浏览器在跨域请求前会先发送 **OPTIONS 预检请求**，而 API 服务没有处理这类请求。

---

## 修复方案

### 修改的文件

1. **`src/lib/cors.ts`** - 新增 CORS 中间件
2. **`src/pages/api/trpc/[trpc].ts`** - 为 tRPC 端点添加 CORS 支持
3. **`src/pages/api/ai/chat/stream.ts`** - 为 Stream 端点添加 CORS 支持

### 修复原理

- 添加 CORS 响应头处理 (`Access-Control-Allow-Origin` 等)
- 在所有 API 路由中处理 `OPTIONS` 请求
- 为跨域请求设置预检缓存时间

---

## 测试方法

### 方法 1：使用 cURL 测试（推荐）

#### 测试 tRPC 端点

```bash
# 1. 先发送 OPTIONS 预检请求
curl -X OPTIONS http://localhost:3000/api/trpc/ai.getSupportedModels \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# 检查响应头是否包含：
# Access-Control-Allow-Origin: http://example.com
# Access-Control-Allow-Methods: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
# HTTP/1.1 200 OK

# 2. 再发送实际请求
curl -X POST http://localhost:3000/api/trpc/ai.getSupportedModels \
  -H "Origin: http://example.com" \
  -H "Content-Type: application/json" \
  -d '{"json":{}}' \
  -v
```

#### 测试 Stream 端点

```bash
# 1. OPTIONS 预检请求
curl -X OPTIONS http://localhost:3000/api/ai/chat/stream \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# 2. POST 实际请求
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Origin: http://example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@example.com",
    "apiKeyId": "key-id",
    "request": {
      "model": "gpt-4o",
      "messages": [{"role": "user", "content": "hi"}],
      "stream": true
    }
  }' \
  -v
```

### 方法 2：使用 JavaScript 测试

#### 从另一个域的网页调用

```javascript
// 从 http://example.com 网页上运行

async function testTRPC() {
  try {
    const response = await fetch('http://localhost:3000/api/trpc/ai.getSupportedModels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 重要：允许跨域请求时发送认证信息
      credentials: 'include',
      body: JSON.stringify({
        json: {},
      }),
    });

    const data = await response.json();
    console.log('✅ 成功:', data);
  } catch (error) {
    console.error('❌ 失败:', error);
  }
}

testTRPC();
```

#### Stream 调用示例

```javascript
async function testStream() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user@example.com',
        apiKeyId: 'key-id',
        request: {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'hello' }],
          stream: true,
        },
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log('📤 收到:', chunk);
    }
  } catch (error) {
    console.error('❌ 失败:', error);
  }
}

testStream();
```

### 方法 3：使用 Postman 测试

#### 设置

1. 打开 Postman
2. 创建新的 Request
3. 设置 URL: `http://localhost:3000/api/trpc/ai.getSupportedModels`
4. 设置方法: `POST`

#### 添加 Headers

| Key          | Value              |
| ------------ | ------------------ |
| Content-Type | application/json   |
| Origin       | http://example.com |

#### Body (raw JSON)

```json
{
  "json": {}
}
```

#### 检查结果

- 状态码应该是 `200`
- 响应头应包含 `Access-Control-Allow-Origin: http://example.com`
- 返回 JSON 数据

---

## 预期结果

### ✅ 修复成功的标志

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://example.com
Access-Control-Allow-Methods: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400

{
  "result": {
    "data": [
      { "model": "gpt-4o", "provider": "OpenAI" },
      ...
    ]
  }
}
```

### ❌ 如果仍然失败

如果仍然看到 `405 Method not allowed` 或 CORS 错误：

1. **检查服务器是否重启**

   ```bash
   # 重启开发服务器
   npm run dev
   ```

2. **检查文件是否正确修改**

   ```bash
   # 验证 CORS 中间件文件是否存在
   ls -la src/lib/cors.ts
   ```

3. **检查浏览器控制台**
   - 打开浏览器开发者工具 (F12)
   - 查看 Network 标签
   - 查看 OPTIONS 请求的响应头

4. **查看服务器日志**
   - 开发服务器应该看到请求日志
   - 如果看到错误，检查错误信息

---

## CORS 配置说明

### 允许的请求源 (Origin)

目前配置为：

- **任何来源** (`*`)
- 也可以指定具体域名进行限制

如需限制，修改 `src/lib/cors.ts` 中的 `setCorsHeaders` 函数：

```typescript
// 只允许特定域名
const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com'];
const origin = req.headers.origin;

if (allowedOrigins.includes(origin || '')) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

### 允许的 HTTP 方法

```
GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
```

### 允许的请求头

```
Content-Type, Authorization, X-CSRF-Token, X-Requested-With
```

### 认证信息

- `Access-Control-Allow-Credentials: true` - 允许发送 Cookie

### 预检缓存

- `Access-Control-Max-Age: 86400` - 浏览器缓存 24 小时

---

## 常见问题

### Q: 为什么还是 405 错误？

**A:** 需要重启开发服务器，确保新代码被加载。

### Q: 为什么 OPTIONS 请求返回 200，但 POST 还是失败？

**A:** 检查 POST 请求本身的问题（参数格式、认证等），不是 CORS 问题。

### Q: 如何在生产环境中设置更严格的 CORS？

**A:** 修改 `src/lib/cors.ts` 中的 `allowedOrigins` 列表，只允许受信任的域名。

### Q: Stream 端点也支持 CORS 吗？

**A:** 是的，`/api/ai/chat/stream` 也已添加 CORS 支持。

---

## 安全建议

⚠️ 当前配置允许 **任何来源** (`*`) 的请求。在生产环境中：

1. **限制允许的来源**

   ```typescript
   const allowedOrigins = ['https://yourdomain.com'];
   ```

2. **验证 Authorization 头**
   - 实现 API Key 验证
   - 或使用 OAuth2

3. **限制允许的方法**
   - 只允许必要的 HTTP 方法

4. **限制允许的请求头**
   - 移除不必要的请求头

---

最后更新: 2024年
