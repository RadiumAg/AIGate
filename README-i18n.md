# 国际化 (i18n) 功能说明

## 功能特性

- 🌐 支持中英双语切换
- 💾 使用 localStorage 保存语言偏好
- ⚡ 无需刷新页面，实时切换
- 🔧 基于 next-intl 实现
- 🎯 类型安全的翻译键名提示

## 使用方法

### 1. 切换语言

在页面右上角找到语言切换按钮（地球图标），点击后可以选择：
- 中文
- English

选择后语言会立即生效，并保存到浏览器本地存储。

### 2. 在组件中使用翻译

```tsx
import { useTranslation } from '@/hooks/use-translation';

const MyComponent = () => {
  const { t, locale, isZh, isEn } = useTranslation();
  
  return (
    <div>
      <h1>{t('Dashboard.title')}</h1>
      <p>{t('Common.loading')}</p>
      <p>当前语言: {locale}</p>
    </div>
  );
};
```

### 3. 翻译键名结构

翻译文件采用层级结构，键名格式为 `模块.键名`：

```
Navigation.dashboard     # 导航栏 - 仪表板
Common.save             # 通用 - 保存
Auth.login              # 认证 - 登录
Dashboard.title         # 仪表板 - 标题
```

### 4. 支持插值变量

```tsx
// messages/zh.json
{
  "Common": {
    "welcome": "欢迎 {{name}}!"
  }
}

// 使用
t('Common.welcome', { name: '张三' }) // 输出: 欢迎 张三!
```

## 语言包文件

- `messages/zh.json` - 中文翻译
- `messages/en.json` - 英文翻译

## 技术实现

### 核心文件

```
src/
├── hooks/
│   ├── use-local-storage.ts    # localStorage Hook
│   └── use-translation.ts      # 翻译 Hook
├── components/
│   └── locale-toggle.tsx       # 语言切换组件
└── messages/
    ├── zh.json                 # 中文语言包
    └── en.json                 # 英文语言包
```

### 主要特性

1. **useLocalStorage Hook**
   - 自动处理 localStorage 的读写
   - 支持泛型类型推断
   - 服务端渲染安全

2. **useTranslation Hook**
   - 提供 `t()` 翻译函数
   - 支持嵌套键名访问（如 `Dashboard.title`）
   - 支持插值变量替换
   - 提供语言状态判断（isZh, isEn）

3. **类型安全**
   - 自动生成翻译键名的 TypeScript 类型
   - IDE 智能提示和自动补全
   - 编译时检查未定义的键名

## 添加新翻译

1. 在 `messages/zh.json` 和 `messages/en.json` 中添加新的键值对
2. 在组件中使用 `t('模块.键名')` 调用
3. 重启开发服务器以更新类型定义

## 自定义语言

如需添加其他语言：

1. 在 `messages/` 目录下创建新的语言文件（如 `ja.json`）
2. 在 `use-translation.ts` 中导入并添加到 `locales` 对象
3. 修改 `useLocalStorage` 的初始值或添加语言切换逻辑

## 注意事项

- 翻译键名必须存在于所有语言包中
- 嵌套对象最多支持 10 层深度
- 插值变量使用 `{{变量名}}` 格式
- localStorage 的 key 为 `locale`
