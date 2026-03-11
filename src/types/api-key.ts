// API Key 相关类型定义
export interface ApiKey {
  id: string;
  key: string;
  originId: string;
  originKey: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'moonshot' | 'spark';
  baseUrl?: string; // AI 服务商的自定义 baseUrl
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'disabled';
}

export type ApiKeyFormData = Omit<ApiKey, 'id' | 'createdAt' | 'key' | 'originId'>;

export interface ApiKeyTestResult {
  isValid: boolean;
  error?: string;
}
