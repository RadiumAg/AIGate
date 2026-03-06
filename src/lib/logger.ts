import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// 日志级别定义
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境确定日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// 自定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 控制台输出格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// 文件输出格式（JSON）
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// 日志目录
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// 创建日志目录的 transports
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
  // 错误日志（单独文件）
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    })
  );

  // 所有日志（按日期轮转）
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '30d',
      format: fileFormat,
    })
  );

  // HTTP 请求日志（单独文件）
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '50m',
      maxFiles: '14d',
      format: fileFormat,
    })
  );
}

// 创建 logger 实例
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// 导出 logger 实例
export default logger;

// 便捷方法导出
export const logError = (message: string, meta?: Record<string, unknown>) => {
  logger.error(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: Record<string, unknown>) => {
  logger.http(message, meta);
};

// 用于记录配额相关操作
export const logQuotaOperation = (
  operation: 'check' | 'update' | 'reset' | 'exceeded',
  userId: string,
  apiKeyId: string,
  metadata?: Record<string, unknown>
) => {
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
};

// 用于记录 AI 请求
export const logAIRequest = (
  userId: string,
  model: string,
  provider: string,
  tokens: { prompt: number; completion: number; total: number },
  metadata?: Record<string, unknown>
) => {
  logger.info('AI Request', {
    userId,
    model,
    provider,
    tokens,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// 用于记录认证相关操作
export const logAuth = (
  action: 'login' | 'logout' | 'register' | 'failed',
  userId?: string,
  metadata?: Record<string, unknown>
) => {
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
};
