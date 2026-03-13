import { isDemoMode } from './lib/demo-config';
import { syncAdminUserOnStartup } from './lib/init-admin';

export async function register() {
  // 只在 Node.js 运行时执行（服务端）
  if (process.env.NEXT_RUNTIME === 'nodejs' && !isDemoMode()) {
    console.log('🚀 Next.js Instrumentation 注册中...');
    await syncAdminUserOnStartup();
  }
}
