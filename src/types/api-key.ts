// API Key 相关类型定义
export interface ApiKey {
  id: string;
  key: string;
  maskId: string;
  maskKey: string;
  name: string;
  provider: 'openai' | 'deepseek' | 'moonshot' | 'spark' | 'kimi' | 'minimax';
  baseUrl?: string; // AI 服务商的自定义 baseUrl
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'disabled';
  // 定价相关（可选，覆盖默认定价）
  promptPrice?: number; // 输入 token 价格（美元/百万）
  completionPrice?: number; // 输出 token 价格（美元/百万）
}

export type ApiKeyFormData = Omit<ApiKey, 'createdAt' | 'maskId' | 'maskKey'>;

export interface ApiKeyTestResult {
  isValid: boolean;
  error?: string;
}
