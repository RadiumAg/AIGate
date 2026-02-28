export interface DashboardStats {
  totalUsers: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  todayRequests: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  todayTokens: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  activeUsers: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  time: string;
  details?: {
    model?: string;
    provider?: string;
    tokens?: number;
    cost?: number | string;
  };
}

export interface UsageTrendItem {
  date: string;
  requests: number;
  tokens: number;
}

export interface ModelDistributionItem {
  name: string;
  value: number;
  requests: number;
}
