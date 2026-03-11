// API Key 相关类型定义
export interface ApiKey {
  id: string;
  key: string;
  maskId: string;
  maskKey: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'moonshot' | 'spark';
  baseUrl?: string; // AI 服务商的自定义 baseUrl
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'disabled';
}

export type ApiKeyFormData = Omit<ApiKey, 'createdAt' | 'maskId' | 'maskKey'>;

export interface ApiKeyTestResult {
  isValid: boolean;
  error?: string;
}
