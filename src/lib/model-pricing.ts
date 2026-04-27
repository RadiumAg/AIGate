import { db } from './drizzle';
import { modelPricing } from './schema';
import { eq, and } from 'drizzle-orm';
import { logError, logInfo } from './logger';

// 默认模型定价（美元/百万 tokens）
// 数据来源：各官方定价页面
export const DEFAULT_PRICING: Record<string, { prompt: number; completion: number }> = {
  // OpenAI
  'gpt-4o': { prompt: 2.5, completion: 10.0 },
  'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
  'gpt-4': { prompt: 30.0, completion: 60.0 },
  'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
  o1: { prompt: 15.0, completion: 60.0 },
  'o1-mini': { prompt: 1.5, completion: 6.0 },
  'o1-preview': { prompt: 15.0, completion: 60.0 },

  // DeepSeek
  'deepseek-chat': { prompt: 0.14, completion: 0.28 },
  'deepseek-reasoner': { prompt: 0.55, completion: 2.19 },

  // Kimi（包含 Moonshot 模型）
  'kimi-latest': { prompt: 2.0, completion: 10.0 },
  'moonshot-v1-8k': { prompt: 0.5, completion: 0.5 },
  'moonshot-v1-32k': { prompt: 1.0, completion: 1.0 },
  'moonshot-v1-128k': { prompt: 2.0, completion: 2.0 },

  // Spark (讯飞)
  'spark-v3.5': { prompt: 0.15, completion: 0.15 },
  'spark-v3.0': { prompt: 0.1, completion: 0.1 },

  // MiniMax
  'MiniMax-Text-01': { prompt: 1.0, completion: 2.0 },
  'MiniMax-M1': { prompt: 0.5, completion: 1.0 },
  'abab6.5s-chat': { prompt: 0.1, completion: 0.1 },
};

// 缓存模型定价
const pricingCache = new Map<string, { prompt: number; completion: number }>();

/**
 * 计算成本
 * @param model 模型名称
 * @param promptTokens 输入 token 数量
 * @param completionTokens 输出 token 数量
 * @returns 成本（美元）
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = getPricing(model);

  // 成本 = (promptTokens / 1M * promptPrice) + (completionTokens / 1M * completionPrice)
  const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion;

  return promptCost + completionCost;
}

/**
 * 获取模型定价
 */
export function getPricing(model: string): { prompt: number; completion: number } {
  // 标准化模型名称（转小写，去除版本号后缀等）
  const normalizedModel = normalizeModelName(model);

  // 检查缓存
  if (pricingCache.has(normalizedModel)) {
    return pricingCache.get(normalizedModel)!;
  }

  // 检查默认定价
  if (DEFAULT_PRICING[normalizedModel]) {
    return DEFAULT_PRICING[normalizedModel];
  }

  // 模糊匹配
  for (const [key, value] of Object.entries(DEFAULT_PRICING)) {
    if (normalizedModel.includes(key) || key.includes(normalizedModel)) {
      return value;
    }
  }

  // 返回默认值（未知模型使用较低定价）
  logInfo(`Unknown model pricing: ${model}, using default`);
  return { prompt: 0.5, completion: 1.5 };
}

/**
 * 标准化模型名称
 */
function normalizeModelName(model: string): string {
  return model
    .toLowerCase()
    .replace(/[-_]/g, '-')
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, '') // 移除日期后缀
    .trim();
}

/**
 * 从数据库获取模型定价
 */
export async function getModelPricingFromDb(model: string): Promise<{
  prompt: number;
  completion: number;
} | null> {
  try {
    const normalizedModel = normalizeModelName(model);

    const result = await db
      .select()
      .from(modelPricing)
      .where(and(eq(modelPricing.model, normalizedModel), eq(modelPricing.isActive, 1)))
      .limit(1);

    if (result.length > 0) {
      const pricing = {
        prompt: parseFloat(result[0].promptPrice),
        completion: parseFloat(result[0].completionPrice),
      };

      // 更新缓存
      pricingCache.set(normalizedModel, pricing);

      return pricing;
    }

    return null;
  } catch (error) {
    logError('Failed to get model pricing from DB', {
      error: error instanceof Error ? error.message : String(error),
      model,
    });
    return null;
  }
}

/**
 * 设置模型定价到数据库
 */
export async function setModelPricing(
  model: string,
  provider: string,
  promptPrice: number,
  completionPrice: number,
  description?: string
): Promise<void> {
  try {
    const normalizedModel = normalizeModelName(model);

    await db
      .insert(modelPricing)
      .values({
        id: `pricing-${normalizedModel}-${Date.now()}`,
        model: normalizedModel,
        provider,
        promptPrice: promptPrice.toString(),
        completionPrice: completionPrice.toString(),
        description,
        isActive: 1,
      })
      .onConflictDoUpdate({
        target: modelPricing.id,
        set: {
          promptPrice: promptPrice.toString(),
          completionPrice: completionPrice.toString(),
          description,
          updatedAt: new Date(),
        },
      });

    // 更新缓存
    pricingCache.set(normalizedModel, { prompt: promptPrice, completion: completionPrice });

    logInfo(`Model pricing updated: ${model}`, { promptPrice, completionPrice });
  } catch (error) {
    logError('Failed to set model pricing', {
      error: error instanceof Error ? error.message : String(error),
      model,
    });
    throw error;
  }
}

/**
 * 清除定价缓存
 */
export function clearPricingCache(): void {
  pricingCache.clear();
}
