export interface DebugRequestForm {
  userId: string;
  apiKeyId: string;
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

export interface ResponseData {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  aigate_metadata: {
    requestId: string;
    provider: string;
    processingTime: number;
    quotaRemaining: {
      tokens: number;
      requests: number;
    };
  };
}
