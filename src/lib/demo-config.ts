/**
 * 演示模式配置
 * 用于控制是否启用演示模式，以及演示模式下的行为
 */

// 演示模式开关 - 可以通过环境变量控制
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DEMO_MODE === 'true';
};

// 演示模式配置
export const demoConfig = {
  // 是否启用演示模式
  enabled: isDemoMode(),

  // 演示模式下的默认用户
  defaultUser: {
    id: 'demo-user-001',
    name: '演示用户',
    email: 'demo@example.com',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
  },

  // 演示模式下的默认管理员账号
  demoCredentials: {
    email: 'demo@example.com',
    password: 'demo123',
  },

  // 是否允许修改数据（演示模式下通常为 false，即只读）
  allowMutations: process.env.DEMO_ALLOW_MUTATIONS === 'true',

  // 演示数据重置间隔（毫秒），0 表示不自动重置
  resetInterval: parseInt(process.env.DEMO_RESET_INTERVAL || '0', 10),
};

// 演示模式下的权限检查
export const checkDemoPermission = (action: 'read' | 'write' | 'delete'): boolean => {
  if (!isDemoMode()) return true;

  // 演示模式下，默认只允许读取操作
  if (action === 'read') return true;

  // 如果配置了允许修改，则允许写操作
  if (demoConfig.allowMutations && (action === 'write' || action === 'delete')) {
    return true;
  }

  return false;
};

// 演示模式下的操作拦截提示
export const getDemoRestrictionMessage = (action: string): string => {
  return `演示模式：${action} 操作已被限制。请在真实环境中进行此操作。`;
};
