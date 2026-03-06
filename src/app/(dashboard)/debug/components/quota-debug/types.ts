export interface QuotaDebugProps {
  userId: string;
  apiKeyId: string;
}

export interface CheckQuotaResult {
  allowed?: boolean;
  reason?: string;
  policy?: {
    name: string;
    limitType: 'token' | 'request';
    dailyTokenLimit?: number;
    dailyRequestLimit?: number;
    rpmLimit: number;
  };
  remainingTokens?: number;
  remainingRequests?: number;
  error?: string;
}

export interface GetUserUsageResult {
  tokensUsed?: number;
  requestsToday?: number;
  policy?: {
    name: string;
    limitType: 'token' | 'request';
  };
  error?: string;
}

export interface ResetQuotaResult {
  success?: boolean;
  error?: string;
}

export type TabType = 'check' | 'usage' | 'reset';
