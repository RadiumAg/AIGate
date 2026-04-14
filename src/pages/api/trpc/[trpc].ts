import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/api/root';
import { createTRPCContext } from '../../../server/api/trpc';
import type { NextApiRequest, NextApiResponse } from 'next';
import { corsMiddleware } from '../../../lib/cors';
import { extractClientIp, getRegionFromRequest } from '../../../lib/ip-region';

// tRPC 处理器
const trpcHandler = createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
        }
      : undefined,
});

// 导出 API 处理器，同时处理 CORS
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 注入 clientIp 和 region 到 req
  req.clientIp = extractClientIp(req) || '';
  req.region = getRegionFromRequest(req) || 'Unknown';

  // 先处理 CORS，如果是 OPTIONS 请求则直接返回
  if (corsMiddleware(req, res)) {
    return;
  }
  // 否则交给 tRPC 处理
  return trpcHandler(req, res);
}
