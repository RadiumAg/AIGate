import type { NextApiRequest, NextApiResponse } from 'next';
import type { IncomingMessage } from 'http';
import { getRegionFromRequest, extractClientIp } from './ip-region';

/**
 * 请求上下文中间件
 * 在请求处理前提取 clientIp 和 region 并附加到 req 对象
 */
export function requestContextMiddleware(
  req: NextApiRequest,
  res: unknown,
  next: () => void
): void {
  // 提取并设置 clientIp 和 region
  req.clientIp = extractClientIp(req as unknown as IncomingMessage) || '';
  req.region = getRegionFromRequest(req as unknown as IncomingMessage) || 'Unknown';

  next();
}

/**
 * 包装 API handler，自动注入请求上下文
 * 用法: export default withRequestContext(handler);
 */
export function withRequestContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextApiRequest, res: any) => Promise<void> | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (req: NextApiRequest, res: any) => Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextApiRequest, res: any) => {
    // 提取并设置 clientIp 和 region
    req.clientIp = extractClientIp(req as unknown as IncomingMessage) || '';
    req.region = getRegionFromRequest(req as unknown as IncomingMessage) || 'Unknown';

    return handler(req, res);
  };
}
