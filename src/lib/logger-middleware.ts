import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

// 记录 HTTP 请求的中间件
export function logHttpRequest(req: NextRequest, response: NextResponse, startTime: number) {
  const endTime = Date.now();
  const duration = endTime - startTime;

  const logData = {
    method: req.method,
    url: req.url,
    pathname: req.nextUrl.pathname,
    statusCode: response.status,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent') || '-',
    referer: req.headers.get('referer') || '-',
    ip: req.headers.get('x-forwarded-for') || '-',
    timestamp: new Date().toISOString(),
  };

  // 根据状态码选择日志级别
  if (response.status >= 500) {
    logger.error('HTTP Request Error', logData);
  } else if (response.status >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
}

// 用于 API 路由的日志包装函数
export async function withLogging<T>(
  handler: () => Promise<T>,
  context: { operation: string; userId?: string; metadata?: Record<string, unknown> }
): Promise<T> {
  const startTime = Date.now();

  logger.info(`Operation started: ${context.operation}`, {
    userId: context.userId,
    ...context.metadata,
  });

  try {
    const result = await handler();
    const duration = Date.now() - startTime;

    logger.info(`Operation completed: ${context.operation}`, {
      userId: context.userId,
      duration: `${duration}ms`,
      ...context.metadata,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`Operation failed: ${context.operation}`, {
      userId: context.userId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ...context.metadata,
    });

    throw error;
  }
}

// 用于记录业务操作的辅助函数
export function logOperation(
  level: 'info' | 'warn' | 'error' | 'debug',
  operation: string,
  metadata?: Record<string, unknown>
) {
  const message = `[${operation}] ${metadata?.message || ''}`;
  logger.log(level, message, metadata);
}

// 用于记录配额相关操作
export function logQuotaOperation(
  operation: 'check' | 'update' | 'reset' | 'exceeded',
  userId: string,
  apiKeyId: string,
  metadata?: Record<string, unknown>
) {
  const logData = {
    operation: `quota:${operation}`,
    userId,
    apiKeyId,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (operation === 'exceeded') {
    logger.warn('Quota exceeded', logData);
  } else {
    logger.info(`Quota ${operation}`, logData);
  }
}

// 用于记录 AI 请求
export function logAIRequest(
  userId: string,
  model: string,
  provider: string,
  tokens: { prompt: number; completion: number; total: number },
  metadata?: Record<string, unknown>
) {
  logger.info('AI Request', {
    userId,
    model,
    provider,
    tokens,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// 用于记录认证相关操作
export function logAuth(
  action: 'login' | 'logout' | 'register' | 'failed',
  userId?: string,
  metadata?: Record<string, unknown>
) {
  const logData = {
    action: `auth:${action}`,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (action === 'failed') {
    logger.warn('Authentication failed', logData);
  } else {
    logger.info(`Authentication ${action}`, logData);
  }
}
