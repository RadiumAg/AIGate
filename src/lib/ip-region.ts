import IP2Region from 'ip2region';
import type { IncomingMessage } from 'http';

interface RegionInfo {
  country: string;
  province: string;
  city: string;
  isp: string;
}

let ip2regionInstance: IP2Region | null = null;

function getIp2RegionInstance(): IP2Region {
  if (!ip2regionInstance) {
    ip2regionInstance = new IP2Region();
  }
  return ip2regionInstance;
}

/**
 * 从 HTTP 请求中提取客户端 IP 地址
 * 优先从代理头中获取，兜底使用 socket 连接地址
 */
export function extractClientIp(req: IncomingMessage): string | undefined {
  const forwardedFor = req.headers['x-forwarded-for'] || req.headers['referer'];
  if (forwardedFor) {
    const firstIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      .split(',')[0]
      ?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  const remoteAddress = req.socket?.remoteAddress;
  if (remoteAddress) {
    // 处理 IPv6 映射的 IPv4 地址，如 ::ffff:192.168.1.1
    return remoteAddress.replace(/^::ffff:/, '');
  }

  return undefined;
}

/**
 * 根据 IP 地址查询归属地省份
 * 返回省份名称（如"广东省"），查询失败返回 undefined
 */
export function queryRegionByIp(ipAddress: string): string | undefined {
  try {
    // 跳过本地/内网 IP
    if (isPrivateIp(ipAddress)) {
      return undefined;
    }

    const query = getIp2RegionInstance();
    const result = query.search(ipAddress) as RegionInfo | null;

    if (!result) return undefined;

    // 优先返回省份，其次返回国家
    return result.province || result.country || undefined;
  } catch (error) {
    console.error('IP region query failed:', error);
    return undefined;
  }
}

/**
 * 从 HTTP 请求中自动获取归属地省份
 */
export function getRegionFromRequest(req: IncomingMessage): string | undefined {
  const clientIp = extractClientIp(req);
  if (!clientIp) return undefined;
  return queryRegionByIp(clientIp);
}

/**
 * 判断是否为内网/本地 IP
 */
function isPrivateIp(ipAddress: string): boolean {
  return (
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress === 'localhost' ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.16.') ||
    ipAddress.startsWith('172.17.') ||
    ipAddress.startsWith('172.18.') ||
    ipAddress.startsWith('172.19.') ||
    ipAddress.startsWith('172.2') ||
    ipAddress.startsWith('172.30.') ||
    ipAddress.startsWith('172.31.') ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('fc') ||
    ipAddress.startsWith('fd')
  );
}
