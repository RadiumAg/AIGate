import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * 设置 CORS 响应头
 * 支持跨域请求，允许外部客户端调用 API
 */
export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;

  // 设置允许的来源
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // 设置允许的 HTTP 方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH');

  // 设置允许的请求头
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token, X-Requested-With'
  );

  // 允许发送 credentials（Cookie）
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 预检请求缓存时间（秒）
  res.setHeader('Access-Control-Max-Age', '86400');

  // 指定 CORS 响应暴露的响应头
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');
}

/**
 * CORS 中间件
 * 处理 OPTIONS 预检请求，并设置 CORS 响应头
 *
 * @returns true 如果是 OPTIONS 请求，处理完毕；false 继续处理其他请求
 */
export function corsMiddleware(req: NextApiRequest, res: NextApiResponse): boolean {
  // 先设置 CORS 头
  setCorsHeaders(req, res);

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
