// API Key 相关类型定义
export interface ApiKey {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'moonshot' | 'spark';
  key: string;
  baseUrl?: string; // AI 服务商的自定义 baseUrl
  createdAt: string;
  lastUsed?: string;
  originKey: string;
  status: 'active' | 'disabled';
}

export type ApiKeyFormData = Omit<ApiKey, 'id' | 'createdAt' | 'originKey'>;

export interface ApiKeyTestResult {
  isValid: boolean;
  error?: string;
}
