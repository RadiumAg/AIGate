// API提供商转换工具函数
export function convertProviderToDb(provider: string): string {
  const mapping: Record<string, string> = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    moonshot: 'Moonshot',
    spark: 'Spark',
    kimi: 'Kimi',
    minimax: 'MiniMax',
  };
  return mapping[provider.toLowerCase()] || provider;
}

export function convertProviderFromDb(provider: string) {
  const mapping: Record<string, string> = {
    OpenAI: 'openai',
    DeepSeek: 'deepseek',
    Moonshot: 'moonshot',
    Spark: 'spark',
    Kimi: 'kimi',
    MiniMax: 'minimax',
  };
  return (mapping[provider] || provider.toLowerCase()) as
    | 'openai'
    | 'deepseek'
    | 'moonshot'
    | 'spark'
    | 'kimi'
    | 'minimax';
}
