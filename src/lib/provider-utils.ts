// API提供商转换工具函数
export function convertProviderToDb(provider: string): string {
  const mapping: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    mistral: 'Mistral',
  };
  return mapping[provider.toLowerCase()] || provider;
}

export function convertProviderFromDb(provider: string) {
  const mapping: Record<string, string> = {
    OpenAI: 'openai',
    Anthropic: 'anthropic',
    Google: 'google',
    Mistral: 'mistral',
  };
  return (mapping[provider] || provider.toLowerCase()) as
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'deepseek'
    | 'moonshot'
    | 'spark';
}
